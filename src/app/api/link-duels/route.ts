import { createClient } from "redis";
import { cleanNick, DUEL_ID, DUEL_TILES } from "@/lib/challenge";
import { notifyAnswered } from "@/lib/duelChallenges";
import { dailyNumber, type GameMode } from "@/lib/game";
import { listLinkDuels, saveLinkDuel, type LinkDuelItem } from "@/lib/linkDuels";
import { parseMoves, replay, sameResult } from "@/lib/replay";
import { fail, json, readJson, requireUser, safe } from "@/lib/session";

// Duelos por link na conta (specs/login-duelo/14-duelos-na-conta-e-paginacao.md).
// POST { id, role: "challenger" | "responder", mode, day, moves, claimed: { won, score }, nick, player, rival? }:
//   o servidor refaz a partida com as jogadas (src/lib/replay.ts) e grava só o recalculado. Se o placar que o navegador
//   diz não bate, 409 mismatch e nada é gravado (vale para quem desafia e para quem responde). Só o desafio de hoje
//   (±1 dia de fuso), uma vez por duelo: 409 exists. Duelo contra si mesmo: 409 self.
// GET: os duelos de quem está logado (60 dias), para a janela "Duelos" (igual em qualquer aparelho). Quem respondeu sem
//   conta vem das respostas do Redis (as mesmas do duelo de hoje), sem repetir quem já está na conta.

const MODES: GameMode[] = ["emoji", "opening", "pistas"];
const REDIS_URL = process.env.KV_REDIS_URL;
const redis = createClient({ url: REDIS_URL }).on("error", console.error);

export const POST = safe(async (req: Request) => {
  const me = await requireUser(req, "duels");
  if (me instanceof Response) return me;
  const b = await readJson(req);
  const mode = b?.mode as GameMode;
  const day = b?.day as number;
  const id = b?.id;
  const role = b?.role;
  const nick = typeof b?.nick === "string" ? cleanNick(b.nick) : "";
  const player = typeof b?.player === "string" && DUEL_ID.test(b.player) ? b.player : null;
  if (typeof id !== "string" || !DUEL_ID.test(id) || (role !== "challenger" && role !== "responder") || !MODES.includes(mode) || !nick)
    return fail(400, "invalid");
  if (!Number.isInteger(day) || Math.abs(day - dailyNumber()) > 1) return fail(410, "expired");
  const moves = parseMoves(mode, b?.moves);
  const result = moves && replay(mode, day, moves);
  if (!moves || !result) return fail(400, "invalid_moves");
  const claimed = b?.claimed as { won?: unknown; score?: unknown } | undefined;
  if (!claimed || typeof claimed !== "object" || !sameResult(result, { won: claimed.won, score: claimed.score })) return fail(409, "mismatch");
  // quem respondeu: quem desafiou, como veio no link (só vale se o desafiante não tem conta; com conta, vale a linha dele)
  const r = b?.rival as { nick?: unknown; tiles?: unknown; won?: unknown } | undefined;
  const rivalTiles = Array.isArray(r?.tiles) ? r!.tiles.filter((t): t is string => typeof t === "string" && DUEL_TILES.has(t)).slice(0, 10) : [];
  const rivalNick = typeof r?.nick === "string" ? cleanNick(r.nick) : "";
  const rival = role === "responder" && rivalNick && rivalTiles.length && typeof r?.won === "boolean" ? { nick: rivalNick, tiles: rivalTiles, won: r.won } : null;
  const out = await saveLinkDuel(me.id, { duelId: id, role, mode, day, player, nick, moves, result, rival });
  if (out !== "saved") return fail(409, out);
  // respondeu um desafio que chegou por notificação: quem desafiou é avisado (15-desafio-por-notificacao.md)
  if (role === "responder") await notifyAnswered(me.id, id);
  return json({ result }, 201);
});

type RedisAnswer = { player?: string; nick: string; tiles?: string[]; won?: boolean; t: number };

export const GET = safe(async (req: Request) => {
  const me = await requireUser(req, "duels");
  if (me instanceof Response) return me;
  const { items, open } = await listLinkDuels(me.id, dailyNumber());
  // quem respondeu sem conta aos seus desafios: as respostas do Redis (some em 14 dias, como antes)
  if (REDIS_URL && open.length) {
    if (!redis.isOpen) await redis.connect();
    for (const o of open) {
      const all = Object.values(await redis.hGetAll(`duel:${o.duelId}`));
      for (const v of all) {
        let a: RedisAnswer;
        try {
          a = JSON.parse(v);
        } catch {
          continue;
        }
        if (!a.tiles || typeof a.won !== "boolean" || (a.player && o.skip.includes(a.player))) continue;
        items.push({ duelId: o.duelId, mode: o.mode, day: o.day, t: a.t, role: "challenger", me: o.me, rival: { nick: a.nick, tiles: a.tiles, won: a.won, account: null, player: a.player ?? null } } satisfies LinkDuelItem);
      }
    }
  }
  items.sort((a, b) => b.day - a.day || b.t - a.t);
  return json({ items });
});
