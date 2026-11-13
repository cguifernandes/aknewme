import { createClient } from "redis";
import { dailyNumber } from "@/lib/game";
import { postTweet } from "@/lib/xapi";
import { botKey, LOG_KEY, LOG_MAX, writePosts, type BotLog, type Logger } from "@/lib/xbot";
import { dailyPosts, REPLY_TEXT, SLOTS, type Slot } from "@/lib/xposts";

// Bot do X: a Vercel chama esta rota nos horários de vercel.json (?slot=manha|tarde|noite).
// 1ª chamada do dia: o Claude escreve os 3 textos, que ficam no Redis (o /plays mostra).
// Cada chamada publica o seu post; só publica de verdade com XBOT_ENABLED=1, sem ela só escreve os textos.
// Manhã também responde o post de ontem com a resposta do enigma; noite responde o próprio post com o link do site.
// Tudo o que acontece vai para o console do /plays (lista xbot:log no Redis) e para os logs da Vercel.

export const dynamic = "force-dynamic";
export const maxDuration = 120; // o Claude leva alguns segundos para escrever

const short = (t: string) => t.replace(/\s+/g, " ").slice(0, 120);

export async function GET(req: Request) {
  // a Vercel manda "Bearer <CRON_SECRET>" nas chamadas agendadas; sem o segredo configurado, ninguém entra
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("não autorizado", { status: 401 });
  const slot = new URL(req.url).searchParams.get("slot") as Slot;
  if (!SLOTS.includes(slot)) return new Response("slot inválido", { status: 400 });

  const day = dailyNumber();
  const lines: BotLog[] = [];
  const log: Logger = (level, msg) => {
    lines.push({ t: Date.now(), day, slot, level, msg });
    (level === "error" ? console.error : console.log)(`xbot #${day} ${slot} [${level}] ${msg}`);
  };

  const key = botKey(day);
  const posts = dailyPosts(day);
  const redis = await createClient({ url: process.env.KV_REDIS_URL }).connect();
  try {
    log("info", "início");
    let texts = await redis.hGetAll(key);
    if (!texts[slot]) {
      log("info", "primeira chamada do dia: escrevendo os 3 posts");
      // posts dos últimos 14 dias, para o Claude não repetir o jeito de escrever
      const old = await Promise.all(Array.from({ length: 14 }, (_, i) => redis.hmGet(botKey(day - 1 - i), [...SLOTS])));
      const written = await writePosts(posts, old.flat().filter((t): t is string => !!t), log);
      await redis.hSet(key, { ...written, ...texts }); // o que já existia (de outra chamada) fica
      await redis.expire(key, 60 * 86_400);
      texts = await redis.hGetAll(key);
    }
    if (process.env.XBOT_ENABLED !== "1") {
      log("warn", `XBOT_ENABLED desligado: não publicou. Texto: ${short(texts[slot])}`);
      return Response.json({ day, slot, posted: false, text: texts[slot] });
    }

    // trava: a Vercel pode chamar duas vezes; o mesmo post nunca sai repetido
    if (!(await redis.set(`${key}:lock:${slot}`, "1", { NX: true, EX: 86_400 }))) {
      log("warn", "já publicado hoje (ou publicando agora): nada a fazer");
      return Response.json({ day, slot, posted: false, reason: "já publicado hoje" });
    }
    let id: string;
    try {
      id = await postTweet(texts[slot]);
    } catch (e) {
      // o post principal falhou: libera a trava para dar para rodar de novo (Vercel → Cron Jobs → Run)
      await redis.del(`${key}:lock:${slot}`);
      throw e;
    }
    await redis.hSet(key, `id:${slot}`, id);
    log("ok", `publicado: x.com/i/status/${id} · ${short(texts[slot])}`);

    // respostas: se uma falhar, o post principal já saiu e fica registrado
    const replies: Record<string, string> = {};
    const reply = async (name: string, text: string, to: string) => {
      try {
        replies[name] = await postTweet(text, to);
        log("ok", `resposta (${name}) publicada: x.com/i/status/${replies[name]}`);
      } catch (e) {
        log("error", `resposta (${name}) falhou: ${e instanceof Error ? e.message : String(e)}`);
      }
    };
    if (slot === "noite") await reply("link", REPLY_TEXT, id);
    if (slot === "manha") {
      await redis.hSet(key, "answer", posts[0].answer!); // antes da resposta de ontem: se ela falhar, amanhã ainda sai
      const [yesterday, answer] = await redis.hmGet(botKey(day - 1), ["id:manha", "answer"]);
      if (yesterday && answer) await reply("gabarito", `✅ Resposta: ${answer}\n\nQuem acertou? 👀`, yesterday);
      else log("info", "sem enigma de ontem publicado pelo bot: nada de gabarito hoje");
    }
    return Response.json({ day, slot, posted: true, id, replies });
  } catch (e) {
    log("error", e instanceof Error ? e.message : String(e));
    return Response.json({ day, slot, error: String(e) }, { status: 500 });
  } finally {
    // o registro sempre vai para o Redis, até quando deu erro
    try {
      // lPush de uma lista põe o último item no topo: o mais novo fica primeiro
      if (lines.length) await redis.lPush(LOG_KEY, lines.map((l) => JSON.stringify(l)));
      await redis.lTrim(LOG_KEY, 0, LOG_MAX - 1);
    } finally {
      await redis.quit();
    }
  }
}
