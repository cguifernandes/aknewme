import { createClient } from "redis";
import { cleanNick, DUEL_ID, DUEL_TILES } from "@/lib/challenge";

// Placar de quem aceitou um desafio, para quem desafiou ver o resultado na janela de fim de jogo.
// POST { id, player, nick, tiles, won }: quem aceitou terminou o jogo (uma resposta por jogador em cada desafio).
// POST { id, player, nick, status: "opened" | "playing" }: abriu o convite / começou a jogar (sem placar ainda).
// GET ?id=: as respostas do desafio. Hash "duel:<id>" no Redis (código do jogador → JSON), some em 14 dias.
// Guardado pelo código do jogador (de cada navegador), não pelo apelido: dois "Gui" não se sobrescrevem.
// ponytail: endpoint aberto, dá para gravar placar inventado (como editar o link do desafio); rate limit se virar problema.

const REDIS_URL = process.env.KV_REDIS_URL;
const TTL = 14 * 86_400;
/** Respostas guardadas por desafio (um link mandado num grupo grande não cresce sem fim). */
const MAX_ANSWERS = 30;

const redis = createClient({ url: REDIS_URL }).on("error", console.error);
const key = (id: string) => `duel:${id}`;

/** Sem `tiles`: ainda não terminou (`status` diz se só abriu o convite ou já está jogando). */
export type DuelAnswer = { player: string; nick: string; tiles?: string[]; won?: boolean; status?: "opened" | "playing"; t: number };

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!DUEL_ID.test(id)) return new Response(null, { status: 400 });
  if (!REDIS_URL) return Response.json({ answers: [] });
  if (!redis.isOpen) await redis.connect();
  const all = await redis.hGetAll(key(id));
  const answers = Object.values(all)
    .map((v) => {
      try {
        return JSON.parse(v) as DuelAnswer;
      } catch {
        return null;
      }
    })
    .filter((a): a is DuelAnswer => !!a)
    .sort((a, b) => b.t - a.t); // mais recente primeiro
  return Response.json({ answers }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const { id, player, nick, tiles, won, status } = await req.json().catch(() => ({}));
  const name = typeof nick === "string" ? cleanNick(nick) : "";
  // aviso de que abriu / está jogando
  if (status === "opened" || status === "playing") {
    if (typeof id !== "string" || !DUEL_ID.test(id) || typeof player !== "string" || !DUEL_ID.test(player) || !name)
      return new Response(null, { status: 400 });
    if (!REDIS_URL) return new Response(null, { status: 204 });
    if (!redis.isOpen) await redis.connect();
    const k = key(id);
    const old = await redis.hGet(k, player);
    if (old && (JSON.parse(old) as DuelAnswer).tiles) return new Response(null, { status: 204 }); // já terminou: o placar fica
    if (!old && (await redis.hLen(k)) >= MAX_ANSWERS) return new Response(null, { status: 409 });
    const entry: DuelAnswer = { player, nick: name, status, t: Date.now() };
    await redis.multi().hSet(k, player, JSON.stringify(entry)).expire(k, TTL).exec();
    return new Response(null, { status: 204 });
  }
  const list = Array.isArray(tiles) ? tiles.filter((t): t is string => typeof t === "string" && DUEL_TILES.has(t)) : [];
  if (typeof id !== "string" || !DUEL_ID.test(id) || typeof player !== "string" || !DUEL_ID.test(player) || !name || !list.length || list.length > 10 || typeof won !== "boolean")
    return new Response(null, { status: 400 });
  if (!REDIS_URL) return new Response(null, { status: 204 });
  if (!redis.isOpen) await redis.connect();
  const k = key(id);
  if ((await redis.hLen(k)) >= MAX_ANSWERS && !(await redis.hExists(k, player))) return new Response(null, { status: 409 });
  const answer: DuelAnswer = { player, nick: name, tiles: list, won, t: Date.now() };
  await redis.multi().hSet(k, player, JSON.stringify(answer)).expire(k, TTL).exec();
  return new Response(null, { status: 204 });
}
