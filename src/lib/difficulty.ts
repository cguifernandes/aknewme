// Dificuldade do desafio diário: de qual fatia do banco o sorteio do dia sai, pela popularidade no MyAnimeList.
// Lógica pura (só import de tipo), testada por scripts/check-stats.mjs.
import type { Anime } from "@/data/animes";

export type Level = "easy" | "normal" | "hard";
export const LEVEL_LABEL: Record<Level, string> = { easy: "dia fácil", normal: "dia normal", hard: "dia difícil" };
/** Etiqueta do nível ao lado do modo, nos jogos (Emoji e Opening). */
export const LEVEL_TAG: Record<Level, { label: string; className: string }> = {
  easy: { label: "Nível fácil", className: "border border-lime bg-lime/30" },
  normal: { label: "Nível médio", className: "bg-sun" },
  hard: { label: "Nível difícil", className: "bg-blush" },
};

/** Nível pelo dia da semana (0 = domingo): segunda é o dia fácil, sábado o difícil. */
export function levelOf(weekday: number): Level {
  return weekday === 1 ? "easy" : weekday === 6 ? "hard" : "normal";
}

/**
 * Fatia do banco de onde sai o sorteio: fácil = o quarto mais popular; normal = a metade mais popular;
 * difícil = a metade menos conhecida (que nos outros dias só aparece no arquivo e no Mais ou Menos).
 */
// ponytail: popularidade = membros no MAL (público global); clássico forte só no Brasil (ex.: Cavaleiros do
// Zodíaco) cai no dia difícil. Se os votos do /plays mostrarem isso, ajustar o anime à mão em vez de mudar a regra.
// `members`: de onde vem a popularidade (o catálogo congelado usa a de quando foi congelado; ver src/lib/catalog.ts).
export function poolFor<T extends Pick<Anime, "mal">>(level: Level, animes: T[], members = (a: T) => a.mal?.members ?? 0): T[] {
  const ranked = [...animes].sort((a, b) => members(b) - members(a));
  const half = Math.ceil(ranked.length / 2);
  if (level === "hard") return ranked.slice(half);
  return ranked.slice(0, level === "easy" ? Math.ceil(ranked.length / 4) : half);
}
