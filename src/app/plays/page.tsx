import { notFound } from "next/navigation";
import { createClient } from "redis";
import { EPOCH_UTC } from "@/lib/game";

const MODES = ["emoji", "opening", "pistas"];

// Quantas pessoas jogaram por dia (contadores gravados por api/played).
// Abrir /plays?key=<PLAYS_KEY> — sem a chave certa dá 404.
export default async function PlaysPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!process.env.PLAYS_KEY || key !== process.env.PLAYS_KEY) notFound();

  const redis = await createClient({ url: process.env.KV_REDIS_URL }).connect();
  const keys: string[] = [];
  for await (const batch of redis.scanIterator({ MATCH: "played:*" })) keys.push(...batch);
  const days = keys.map((k) => Number(k.split(":")[1])).sort((a, b) => b - a).slice(0, 30);
  const rows = await Promise.all(days.map(async (day) => ({ day, c: await redis.hGetAll(`played:${day}`) })));
  await redis.quit();

  const date = (day: number) =>
    new Date(EPOCH_UTC + (day - 1) * 86_400_000).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-ink">
      <h1 className="font-display text-2xl font-extrabold">Jogadores por dia</h1>
      <p className="mt-1 text-sm text-muted">modo: terminaram (acertaram)</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-lavender text-muted">
            <tr>
              <th className="py-2 pr-4">Dia</th>
              <th className="py-2 pr-4">Pessoas</th>
              {MODES.map((m) => <th key={m} className="py-2 pr-4 capitalize">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ day, c }) => (
              <tr key={day} className="border-b border-track">
                <td className="py-2 pr-4">#{day} · {date(day)}</td>
                <td className="py-2 pr-4 font-bold">{c.people ?? 0}</td>
                {MODES.map((m) => <td key={m} className="py-2 pr-4">{c[m] ?? 0} ({c[`${m}:won`] ?? 0})</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
