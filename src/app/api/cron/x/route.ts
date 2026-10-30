import { createClient } from "redis";
import { dailyNumber, todayEmojis } from "@/lib/game";
import { SITE_URL } from "@/lib/site";
import { postToX } from "@/lib/x";

// Bot do X (vercel.json → crons), dois posts por dia:
//  - manhã (12:00 UTC = 9h Brasília): enigma do dia em emojis; link só na resposta
//    (o X rebaixa post com link externo).
//  - noite (23:30 UTC = 20h30 Brasília): quantas pessoas jogaram e quantas acertaram.
// Teste à mão: curl -H "Authorization: Bearer $CRON_SECRET" "https://www.aknewme.com/api/cron/x?kind=morning"
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response(null, { status: 401 });
  const kind = new URL(req.url).searchParams.get("kind") ?? "morning";
  const n = dailyNumber();
  const link = `${SITE_URL}/emoji?d=${n}&utm_source=x&utm_medium=bot`;

  if (kind === "morning") {
    const id = await postToX(
      [
        `🎌 aknewme #${n} · Modo Emoji`,
        "",
        todayEmojis().join("  "),
        "",
        "Que anime é esse? Responda só com seus quadradinhos 🟩🟨, sem spoiler!",
      ].join("\n"),
    );
    await postToX(`Jogue aqui 👉 ${link}\n\nTem também o modo Opening 🎵 e o modo Pistas 🔎. Novo desafio todo dia!`, id);
    return Response.json({ ok: true, id });
  }

  const redis = await createClient({ url: process.env.KV_REDIS_URL }).connect();
  const c = await redis.hGetAll(`played:${n}`);
  await redis.quit();
  const people = Number(c.people ?? 0);
  // Número baixo não vende: só posta o resumo com público mínimo.
  if (people < 10) return Response.json({ ok: false, reason: "poucos jogadores", people });
  const played = Number(c.emoji ?? 0);
  const pct = played ? Math.round((100 * Number(c["emoji:won"] ?? 0)) / played) : 0;
  const id = await postToX(
    [`📊 aknewme #${n}: ${people} pessoas jogaram hoje.`, `Só ${pct}% acertaram o modo Emoji 🎭`, "", "Ainda dá tempo até meia-noite 👇"].join("\n"),
  );
  await postToX(link, id);
  return Response.json({ ok: true, id, people, pct });
}
