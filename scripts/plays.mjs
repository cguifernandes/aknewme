// Quantas pessoas jogaram por dia (contadores gravados por src/app/api/played).
// Uso: npm run plays — lê KV_REDIS_URL do .env.local
import { createClient } from "redis";

const redis = await createClient({ url: process.env.KV_REDIS_URL }).connect();
const keys = [];
for await (const batch of redis.scanIterator({ MATCH: "played:*" })) keys.push(...batch);
keys.sort((a, b) => b.split(":")[1] - a.split(":")[1]);

const rows = {};
for (const key of keys.slice(0, 14)) {
  const c = await redis.hGetAll(key);
  const mode = (m) => `${c[m] ?? 0} (${c[`${m}:won`] ?? 0})`;
  rows[`#${key.split(":")[1]}`] = { pessoas: +(c.people ?? 0), emoji: mode("emoji"), opening: mode("opening"), pistas: mode("pistas") };
}
console.table(rows);
console.log("modo: terminaram (acertaram)");
await redis.quit();
