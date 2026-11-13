import { ANIMES } from "@/data/animes";
import { poolFor } from "@/lib/difficulty";
import { dailyAnimes, pickAnimes, type GameMode } from "@/lib/game";
import { SITE_URL } from "@/lib/site";

export type XPost = { when: string; text: string; answer?: string };

/** Link da resposta do 3º post: /emoji tem prévia com os emojis de hoje (opengraph-image). */
export const REPLY_TEXT = `Joga as 5 rodadas de hoje, a opening e as pistas aqui 👇\n${SITE_URL.replace(/^https?:\/\//, "")}/emoji`;

/**
 * Os 3 posts do dia para o X: 2 sem link (emoji e pistas de animes fora do desafio de hoje, para não dar spoiler)
 * e o 3º com a 1ª rodada do desafio, cujo link vai na resposta (post com link é entregue a menos gente).
 */
// ponytail: sorteio por dia sem memória, pode repetir anime de semanas atrás; guardar os usados se incomodar.
export function dailyPosts(day: number): XPost[] {
  const inGame = new Set((["emoji", "opening", "pistas"] as GameMode[]).flatMap((m) => dailyAnimes(m, day).map((a) => a.title)));
  // metade mais popular: post é para muita gente arriscar a resposta
  const [a, b] = pickAnimes(day * 31 + 11, 2, poolFor("normal", ANIMES).filter((x) => !inGame.has(x.title)));
  return [
    {
      when: "Manhã",
      text: `🎭 Que anime é esse?\n\n${a.emojis.join("")}\n\nResponde aí sem pesquisar 👇`,
      answer: a.title,
    },
    {
      when: "Tarde",
      text: `🔎 Adivinha o anime pelas pistas:\n\n📅 ${b.year}\n🎬 ${b.studio}\n🏷️ ${b.genre}\n📺 ${b.episodes} episódios\n\nQual é? 👇`,
      answer: b.title,
    },
    {
      when: "Noite",
      text: `🎮 Desafio #${day} do aknewme\n\n${dailyAnimes("emoji", day)[0].emojis.join("")}\n\nAcertou esse? Ainda tem mais 4 rodadas, a opening e as pistas 👇`,
    },
  ];
}
