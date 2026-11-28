import { cleanNick, DUEL_ID } from "@/lib/challenge";
import {
  acceptDuelChallenge,
  acceptLateWithGame,
  sendDuelChallenge,
  sentChallengeModes,
} from "@/lib/duelChallenges";
import { dailyNumber, type GameMode } from "@/lib/game";
import { saveLinkDuel } from "@/lib/linkDuels";
import { parseMoves, replay, sameResult } from "@/lib/replay";
import { fail, json, readJson, requireUser, safe } from "@/lib/session";
import { UUID_RE } from "@/lib/users";

// Desafio a um amigo por notificação (specs/login-duelo/15-desafio-por-notificacao.md).
// POST { friend, mode, day, duelId, moves, claimed: { won, score }, nick, player }: numa chamada só, salva a partida de
//   quem desafia na conta (como /api/link-duels, role "challenger": o servidor refaz a partida com as jogadas e grava só
//   o recalculado; placar que não bate → 409 mismatch) e manda o desafio como notificação. Sem `moves`, exige a partida
//   já salva (409 no_duel). Só amigos aceitos (403 not_friend), só o duelo de hoje (±1 dia de fuso: 410 expired).
//   201 { expiresIn }: o convite vale INVITE_SECONDS (2 min). Dentro do prazo, 409 { error: "pending", retryIn } (os
//   segundos que faltam); se o amigo já aceitou aquele modo no dia, 409 accepted.
// PATCH { duelId, mode?, day?, moves?, claimed? }: quem recebeu abriu pelo "Jogar" (aceita). No prazo 200; depois do
//   prazo 410 expired, a não ser que venham as jogadas válidas daquele modo e dia (quem já jogou: o servidor recalcula
//   e o placar tem de bater); sem convite 404.
// GET ?friend=<id>&day=N → { sent: [{ mode, status: "pending" | "accepted", remaining }] }: os convites do dia para esse
//   amigo (os expirados não contam), para a janela mostrar "Duelo enviado · 1:59" com o tempo do servidor.

const MODES: GameMode[] = ["emoji", "opening", "pistas"];
const today = (day: unknown): day is number =>
  Number.isInteger(day) && Math.abs((day as number) - dailyNumber()) <= 1;

export const POST = safe(async (req: Request) => {
  const me = await requireUser(req, "duel-challenges");
  if (me instanceof Response) return me;
  const b = await readJson(req);
  const { friend, mode, day, duelId } = b ?? {};
  if (
    typeof friend !== "string" ||
    !UUID_RE.test(friend) ||
    !MODES.includes(mode as GameMode) ||
    typeof duelId !== "string" ||
    !DUEL_ID.test(duelId)
  )
    return fail(400, "invalid");
  if (!today(day)) return fail(410, "expired");
  const m = mode as GameMode;
  // a partida de quem desafia, na mesma chamada (antes eram duas em série: /api/link-duels e depois esta)
  if (b?.moves !== undefined) {
    const nick = typeof b.nick === "string" ? cleanNick(b.nick) : "";
    const player =
      typeof b.player === "string" && DUEL_ID.test(b.player) ? b.player : null;
    const moves = parseMoves(m, b.moves);
    const result = moves && replay(m, day, moves);
    if (!moves || !result || !nick) return fail(400, "invalid_moves");
    const claimed = b.claimed as { won?: unknown; score?: unknown } | undefined;
    if (
      !claimed ||
      typeof claimed !== "object" ||
      !sameResult(result, { won: claimed.won, score: claimed.score })
    )
      return fail(409, "mismatch");
    const saved = await saveLinkDuel(me.id, { duelId, role: "challenger", mode: m, day, player, nick, moves, result }); // já salva: segue
    if (saved === "taken") return fail(409, "taken"); // o id é do duelo de outra pessoa
  }
  const r = await sendDuelChallenge(me.id, friend, m, day, duelId);
  if (r.out === "sent") return json({ expiresIn: r.expiresIn }, 201);
  if (r.out === "pending")
    return json({ error: "pending", retryIn: r.retryIn }, 409);
  return fail(r.out === "not_friend" ? 403 : 409, r.out);
});

export const PATCH = safe(async (req: Request) => {
  const me = await requireUser(req, "duel-challenges");
  if (me instanceof Response) return me;
  const b = await readJson(req);
  const duelId = b?.duelId;
  if (typeof duelId !== "string" || !DUEL_ID.test(duelId))
    return fail(400, "invalid");
  const out = await acceptDuelChallenge(me.id, duelId);
  if (out === "none") return fail(404, "not_found");
  if (out === "expired") {
    // já jogou o modo: as jogadas daquele modo e dia, recalculadas, liberam o aceite depois do prazo
    const valid = (mode: GameMode, day: number) => {
      if (b?.mode !== mode || b?.day !== day) return false;
      const moves = parseMoves(mode, b.moves);
      const result = moves && replay(mode, day, moves);
      const claimed = b.claimed as
        { won?: unknown; score?: unknown } | undefined;
      return (
        !!result &&
        !!claimed &&
        typeof claimed === "object" &&
        sameResult(result, { won: claimed.won, score: claimed.score })
      );
    };
    if (!(await acceptLateWithGame(me.id, duelId, valid)))
      return fail(410, "expired");
  }
  return json({ accepted: true });
});

export const GET = safe(async (req: Request) => {
  const me = await requireUser(req, "duel-challenges");
  if (me instanceof Response) return me;
  const q = new URL(req.url).searchParams;
  const friend = q.get("friend") ?? "";
  const day = Number(q.get("day"));
  if (!UUID_RE.test(friend) || !today(day)) return fail(400, "invalid");
  return json({ sent: await sentChallengeModes(me.id, friend, day) });
});
