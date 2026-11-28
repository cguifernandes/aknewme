import { createClient } from "redis";
import { dailyNumber, type GameMode } from "@/lib/game";
import { THEMES } from "@/lib/higherLower";
import { rank, standing } from "@/lib/stats";

const MODES = ["emoji", "opening", "pistas"];
/** Cliques contados: "seguir no X" e "Apoiar" por origem (fim de jogo, faixa da home, menu). */
const CLICKS = ["follow", "support:end", "support:home", "support:menu"];
/** Nota válida: null (perdeu) ou inteiro de 0 a 7 (7 = resgate do Opening). */
const isScore = (s: unknown): s is number | null => s === null || (Number.isInteger(s) && (s as number) >= 0 && (s as number) <= 7);
/** Respostas do "Como foi o desafio de hoje?" (DailyFeedback). */
const LEVELS = ["easy", "ok", "hard"];
/** Temas do Mais ou Menos contados à parte (os ids de THEMES em src/lib/higherLower.ts). */
const HL_THEMES = THEMES.map((t) => t.id as string);
const REDIS_URL = process.env.KV_REDIS_URL;

// Conecta no 1º uso e reaproveita enquanto a função estiver quente
// (isOpen vira true na hora do connect; pedidos simultâneos esperam na fila do cliente).
const redis = createClient({ url: REDIS_URL }).on("error", console.error);

// Conta quem terminou o desafio do dia (sendBeacon de saveDailyResult). Ver: npm run plays ou /plays?key=<PLAYS_KEY>.
// ponytail: endpoint aberto, dá para inflar a contagem na mão; rate limit por IP se virar problema.
export async function POST(req: Request) {
  const { mode, day, won, first, score, click, start, visit, feedback, hl, streak, theme } = await req.json().catch(() => ({}));
  const isClick = CLICKS.includes(click);
  const isHL = hl === "start" || hl === "done";
  // ±1 dia: o servidor (UTC) e o jogador (horário local) viram o dia em horas diferentes
  if ((!isClick && !visit && !isHL && !MODES.includes(mode)) || !Number.isInteger(day) || Math.abs(day - dailyNumber()) > 1) {
    return new Response(null, { status: 400 });
  }
  // Só conta em produção: no next dev a URL pode estar no .env.local (para o npm run plays)
  if (!REDIS_URL || process.env.NODE_ENV !== "production") return new Response(null, { status: 204 });
  const key = `played:${day}`;
  if (!redis.isOpen) await redis.connect();
  // Mais ou Menos (modo infinito): partidas começadas (hl:start), pessoas no dia (hl:people), partidas
  // terminadas (hl:done), soma das sequências (hl:sum, para a média) e a maior sequência do dia (hl:best).
  // Por tema (Todos, Anos 2010, Ação): os mesmos contadores com o id do tema no fim (hl:start:2010s...), além do total.
  if (isHL) {
    const t = HL_THEMES.includes(theme) ? (theme as string) : null; // versão antiga do site não manda o tema: só o total
    if (hl === "start") {
      const m = redis.multi().hIncrBy(key, "hl:start", 1);
      if (first) m.hIncrBy(key, "hl:people", 1);
      if (t) m.hIncrBy(key, `hl:start:${t}`, 1);
      await m.exec();
      return new Response(null, { status: 204 });
    }
    if (!Number.isInteger(streak) || streak < 0 || streak > 1000) return new Response(null, { status: 400 });
    const m = redis.multi().hIncrBy(key, "hl:done", 1).hIncrBy(key, "hl:sum", streak);
    if (t) m.hIncrBy(key, `hl:done:${t}`, 1).hIncrBy(key, `hl:sum:${t}`, streak);
    await m.exec();
    // ponytail: lê e grava em dois passos; duas partidas recordes no mesmo instante podem deixar a menor. Script Lua se importar.
    for (const k of t ? ["hl:best", `hl:best:${t}`] : ["hl:best"]) if (streak > Number((await redis.hGet(key, k)) ?? 0)) await redis.hSet(key, k, streak);
    return new Response(null, { status: 204 });
  }
  // Clique num link do X ou em "Apoiar" (trackClick): só o contador do dia (click:follow, click:support:end...)
  if (isClick) {
    await redis.hIncrBy(key, `click:${click}`, 1);
    return new Response(null, { status: 204 });
  }
  // Opinião sobre o desafio do dia (DailyFeedback): dificuldade (modo:fb:easy|ok|hard) e gostou do anime (modo:like:yes|no)
  if (feedback) {
    if (!MODES.includes(mode)) return new Response(null, { status: 400 });
    const m = redis.multi();
    if (LEVELS.includes(feedback.level)) m.hIncrBy(key, `${mode}:fb:${feedback.level}`, 1);
    if (typeof feedback.like === "boolean") m.hIncrBy(key, `${mode}:like:${feedback.like ? "yes" : "no"}`, 1);
    await m.exec();
    return new Response(null, { status: 204 });
  }
  // Celular × PC (painel /plays): visitas, jogos começados e terminados por aparelho
  const dev = /Mobi|Android|iPhone|iPad/i.test(req.headers.get("user-agent") ?? "") ? "mobile" : "desktop";
  // Visita do dia (trackVisit)
  if (visit) {
    await redis.hIncrBy(key, `visit:${dev}`, 1);
    return new Response(null, { status: 204 });
  }
  // Começou o desafio (trackStart)
  if (start) {
    await redis.multi().hIncrBy(key, `${mode}:start`, 1).hIncrBy(key, `start:${dev}`, 1).exec();
    return new Response(null, { status: 204 });
  }
  const m = redis.multi().hIncrBy(key, mode, 1).hIncrBy(key, `done:${dev}`, 1);
  if (won) m.hIncrBy(key, `${mode}:won`, 1);
  if (first) m.hIncrBy(key, "people", 1);
  // Nota do jogador (modo:rN), base do "melhor que X%" do fim de jogo
  if (isScore(score)) m.hIncrBy(key, `${mode}:r${rank(mode, score)}`, 1);
  await m.exec();
  return new Response(null, { status: 204 });
}

// Como esta nota se compara com a de quem já jogou o dia (EndCard). null = sem dados suficientes.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const mode = q.get("mode") ?? "";
  const day = Number(q.get("day"));
  const score = q.get("score") ? Number(q.get("score")) : null; // vazio = perdeu
  if (!MODES.includes(mode) || !Number.isInteger(day) || !isScore(score) || !REDIS_URL) return Response.json(null);
  if (!redis.isOpen) await redis.connect();
  return Response.json(standing(mode as GameMode, await redis.hGetAll(`played:${day}`), score));
}
