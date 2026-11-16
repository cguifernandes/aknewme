import type { Anime } from "@/data/animes";
import { normalize } from "@/lib/game";

/** Célula da comparação: certo (verde), parcial/perto (amarelo), dica de direção ou diferente. */
export type Cell = { label: string; value: string; note: string; state: "ok" | "partial" | "hint" | "no" };

/** Até quantos anos de distância o chute conta como "perto" (fica amarelo). */
const NEAR_YEARS = 3;

/** Como o anime do dia se compara a um palpite errado (ano, estúdio, gênero, episódios). Modos Pistas e Emoji. */
export function compare(guess: Anime, answer: Anime): Cell[] {
  const num = (label: string, value: string, g: number, a: number, more: string, less: string, near = 0): Cell =>
    g === a
      ? { label, value, note: "Igual", state: "ok" }
      : { label, value, note: a > g ? `↑ ${more}` : `↓ ${less}`, state: Math.abs(a - g) <= near ? "partial" : "hint" };
  // "Madhouse / J.C.Staff" e "Ação / Aventura": todas as partes em comum = certo; alguma = parcial
  const set = (label: string, g: string, a: string): Cell => {
    const parts = (s: string) => s.split("/").map(normalize);
    const [pg, pa] = [parts(g), parts(a)];
    const common = pg.filter((p) => pa.includes(p)).length;
    if (common === pg.length && common === pa.length) return { label, value: "Todos iguais", note: "Certo", state: "ok" };
    if (common) return { label, value: g, note: "≈ Em comum", state: "partial" };
    return { label, value: g, note: "Diferente", state: "no" };
  };
  const cells = [
    num("Ano", String(guess.year), guess.year, answer.year, "Mais recente", "Mais antigo", NEAR_YEARS),
    set("Estúdio", guess.studio, answer.studio),
    set("Gênero", guess.genre, answer.genre),
  ];
  const [ge, ae] = [parseInt(guess.episodes, 10), parseInt(answer.episodes, 10)];
  if (!Number.isNaN(ge) && !Number.isNaN(ae)) cells.push(num("Episódios", guess.episodes, ge, ae, "Mais eps", "Menos eps"));
  return cells;
}

export const CELL: Record<Cell["state"], string> = {
  ok: "bg-lime text-ink",
  partial: "bg-sun text-ink",
  hint: "bg-track text-ink",
  no: "bg-blush text-ink",
};
