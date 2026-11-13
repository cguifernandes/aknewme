import Anthropic from "@anthropic-ai/sdk";
import { ANIMES } from "@/data/animes";
import { normalize } from "@/lib/game";
import { SLOTS, type Slot, type XPost } from "@/lib/xposts";

// Textos do bot do X: o código escolhe anime e formato (xposts.ts, sem repetir nem dar spoiler) e o Claude só
// reescreve o rascunho para soar natural e variar. Texto que não passa na conferência volta para o rascunho.

/** Hash do Redis com os textos do dia (campos manha/tarde/noite) e os ids já postados (id:manha...). */
export const botKey = (day: number) => `xbot:${day}`;

/** Lista do Redis com o registro do bot (mais novo primeiro), mostrado no console do /plays. */
export const LOG_KEY = "xbot:log";
export const LOG_MAX = 300;
export type LogLevel = "info" | "ok" | "warn" | "error";
export type BotLog = { t: number; day: number; slot: string; level: LogLevel; msg: string };
export type Logger = (level: LogLevel, msg: string) => void;

const SYSTEM = `Você escreve os posts do X (Twitter) do @aknewmee, um jogo diário brasileiro de adivinhar anime (pelos emojis, por 1 segundo da abertura ou por pistas).

Você recebe 3 rascunhos do dia (manhã, tarde e noite) e reescreve cada um para engajar: gente respondendo nos comentários.

Regras de cada post:
- Português do Brasil, tom de quem é fã de anime conversando no X: leve, direto, com graça, sem cara de propaganda nem de texto de IA.
- Curto: no máximo 240 caracteres. Uma frase de gancho, o enigma ou a pergunta, e um convite para responder.
- Use só os fatos do rascunho. Não invente ano, estúdio, personagem, notícia nem estatística ("só 1% acerta").
- Os trechos marcados como OBRIGATÓRIO entram exatamente iguais (emojis na mesma ordem).
- Post de adivinhar nunca revela a resposta, nem nome de personagem, nem dica que entregue de bandeja.
- Sem links, sem hashtags, sem marcar ninguém.
- Não repita ganchos, aberturas de frase nem bordões dos posts recentes listados.`;

const SCHEMA = {
  type: "object",
  properties: Object.fromEntries(SLOTS.map((s) => [s, { type: "string" }])),
  required: [...SLOTS],
  additionalProperties: false,
};

/** O texto do Claude serve? (tamanho, sem link, trechos obrigatórios iguais, sem revelar a resposta) */
export function validPost(text: string, post: XPost): boolean {
  if (!text.trim() || text.length > 270 || /https?:|www\.|\.com\b|@\w/i.test(text)) return false;
  if (post.keep?.some((k) => !text.includes(k))) return false;
  const anime = post.answer ? ANIMES.find((a) => a.title === post.answer) : undefined;
  const t = ` ${normalize(text)} `;
  return !anime || ![anime.title, ...anime.aliases].some((n) => normalize(n).length > 2 && t.includes(` ${normalize(n)} `));
}

function prompt(posts: XPost[], recent: string[]): string {
  const drafts = posts
    .map((p) =>
      [
        `## ${p.slot} (${p.kind})`,
        p.text,
        ...(p.keep ?? []).map((k) => `OBRIGATÓRIO: ${k}`),
        p.answer ? `Resposta, que NÃO pode aparecer: ${p.answer}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
  const last = recent.length ? recent.map((t) => `- ${t.replace(/\n+/g, " / ")}`).join("\n") : "(nenhum ainda)";
  return `Rascunhos de hoje:\n\n${drafts}\n\nPosts recentes (não repita o jeito de escrever):\n${last}`;
}

/** Reescreve os 3 posts com o Claude; o que falhar (API fora, recusa, texto inválido) fica com o rascunho. */
export async function writePosts(posts: XPost[], recent: string[], log: Logger): Promise<Record<Slot, string>> {
  const out = Object.fromEntries(posts.map((p) => [p.slot, p.text])) as Record<Slot, string>;
  if (!process.env.ANTHROPIC_API_KEY) {
    log("warn", "sem ANTHROPIC_API_KEY: os 3 posts de hoje ficam com o texto padrão");
    return out;
  }
  try {
    const res = await new Anthropic().beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // se o modelo recusar, a própria API tenta de novo em outro modelo
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: prompt(posts, recent) }],
    });
    const { input_tokens: inp, output_tokens: outp } = res.usage;
    // preço do Opus 5.5 (US$ 4 / 20 por milhão); se a API trocou de modelo (recusa), é só uma estimativa
    log("info", `Claude (${res.model}) respondeu: ${inp} tokens de entrada, ${outp} de saída, ~US$ ${((inp * 4 + outp * 20) / 1e6).toFixed(3)}`);
    if (res.stop_reason !== "end_turn") throw new Error(`Claude parou com ${res.stop_reason}`);
    const block = res.content.find((b) => b.type === "text");
    const json = JSON.parse(block?.type === "text" ? block.text : "{}") as Partial<Record<Slot, string>>;
    for (const p of posts) {
      const text = json[p.slot]?.trim() ?? "";
      if (validPost(text, p)) out[p.slot] = text;
      else log("warn", `texto do Claude para ${p.slot} não passou na conferência, vai o texto padrão. Recusado: ${text || "(vazio)"}`);
    }
    const mine = posts.filter((p) => out[p.slot] !== p.text).length;
    log(mine ? "ok" : "warn", `Claude escreveu ${mine} de ${posts.length} posts de hoje`);
  } catch (e) {
    log("error", `Claude falhou, os 3 posts ficam com o texto padrão: ${e instanceof Error ? e.message : String(e)}`);
  }
  return out;
}
