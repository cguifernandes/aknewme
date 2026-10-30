import { createClient } from "redis";
import { dailyNumber } from "@/lib/game";

const MODES = ["emoji", "opening", "pistas"];
const REDIS_URL = process.env.KV_REDIS_URL;

// Conecta no 1º uso e reaproveita enquanto a função estiver quente
// (isOpen vira true na hora do connect; pedidos simultâneos esperam na fila do cliente).
const redis = createClient({ url: REDIS_URL }).on("error", console.error);

// Conta quem terminou o desafio do dia (sendBeacon de saveDailyResult). Ver: npm run plays ou /plays?key=<PLAYS_KEY>.
// ponytail: endpoint aberto, dá para inflar a contagem na mão; rate limit por IP se virar problema.
export async function POST(req: Request) {
  const { mode, day, won, first } = await req.json().catch(() => ({}));
  // ±1 dia: o servidor (UTC) e o jogador (horário local) viram o dia em horas diferentes
  if (!MODES.includes(mode) || !Number.isInteger(day) || Math.abs(day - dailyNumber()) > 1) {
    return new Response(null, { status: 400 });
  }
  // Só conta em produção: no next dev a URL pode estar no .env.local (para o npm run plays)
  if (!REDIS_URL || process.env.NODE_ENV !== "production") return new Response(null, { status: 204 });
  const key = `played:${day}`;
  if (!redis.isOpen) await redis.connect();
  const m = redis.multi().hIncrBy(key, mode, 1);
  if (won) m.hIncrBy(key, `${mode}:won`, 1);
  if (first) m.hIncrBy(key, "people", 1);
  await m.exec();
  return new Response(null, { status: 204 });
}
