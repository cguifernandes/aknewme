import { createClient } from "redis";
import { dailyNumber } from "@/lib/game";
import { postTweet } from "@/lib/xapi";
import { botKey, writePosts } from "@/lib/xbot";
import { dailyPosts, REPLY_TEXT, SLOTS, type Slot } from "@/lib/xposts";

// Bot do X: a Vercel chama esta rota nos horários de vercel.json (?slot=manha|tarde|noite).
// 1ª chamada do dia: o Claude escreve os 3 textos, que ficam no Redis (o /plays mostra).
// Cada chamada publica o seu post; só publica de verdade com XBOT_ENABLED=1, sem ela só escreve os textos.
// Manhã também responde o post de ontem com a resposta do enigma; noite responde o próprio post com o link do site.

export const dynamic = "force-dynamic";
export const maxDuration = 120; // o Claude leva alguns segundos para escrever

export async function GET(req: Request) {
  // a Vercel manda "Bearer <CRON_SECRET>" nas chamadas agendadas; sem o segredo configurado, ninguém entra
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("não autorizado", { status: 401 });
  const slot = new URL(req.url).searchParams.get("slot") as Slot;
  if (!SLOTS.includes(slot)) return new Response("slot inválido", { status: 400 });

  const day = dailyNumber();
  const key = botKey(day);
  const posts = dailyPosts(day);
  const redis = await createClient({ url: process.env.KV_REDIS_URL }).connect();
  try {
    let texts = await redis.hGetAll(key);
    if (!texts[slot]) {
      // posts dos últimos 14 dias, para o Claude não repetir o jeito de escrever
      const old = await Promise.all(Array.from({ length: 14 }, (_, i) => redis.hmGet(botKey(day - 1 - i), [...SLOTS])));
      const written = await writePosts(posts, old.flat().filter((t): t is string => !!t));
      await redis.hSet(key, { ...written, ...texts }); // o que já existia (de outra chamada) fica
      await redis.expire(key, 60 * 86_400);
      texts = await redis.hGetAll(key);
    }
    if (process.env.XBOT_ENABLED !== "1") return Response.json({ day, slot, posted: false, text: texts[slot] });

    // trava: a Vercel pode chamar duas vezes; o mesmo post nunca sai repetido
    if (!(await redis.set(`${key}:lock:${slot}`, "1", { NX: true, EX: 86_400 }))) {
      return Response.json({ day, slot, posted: false, reason: "já publicado hoje" });
    }
    try {
      const id = await postTweet(texts[slot]);
      await redis.hSet(key, `id:${slot}`, id);
      const replies: Record<string, string> = {};
      if (slot === "noite") replies.link = await postTweet(REPLY_TEXT, id);
      if (slot === "manha") {
        await redis.hSet(key, "answer", posts[0].answer!); // antes da resposta de ontem: se ela falhar, amanhã ainda sai
        const [yesterday, answer] = await redis.hmGet(botKey(day - 1), ["id:manha", "answer"]);
        if (yesterday && answer) replies.answer = await postTweet(`✅ Resposta: ${answer}\n\nQuem acertou? 👀`, yesterday);
      }
      return Response.json({ day, slot, posted: true, id, replies });
    } catch (e) {
      // o post principal falhou: libera a trava para dar para rodar de novo (Vercel → Cron Jobs → Run)
      if (!(await redis.hGet(key, `id:${slot}`))) await redis.del(`${key}:lock:${slot}`);
      throw e;
    }
  } finally {
    await redis.quit();
  }
}
