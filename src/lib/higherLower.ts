// Mais ou Menos: modo infinito de comparar dois animes: episódios, ano de estreia e, com dados do
// MyAnimeList (src/data/animes/mal.ts), nota e popularidade.
// Lógica pura (só import de tipo), testada por scripts/check-stats.mjs.
import type { Anime } from "@/data/animes";

export const HL_PATH = "/higher-lower";

export type Category = "episodes" | "year" | "score" | "members";
/** Ordem em que as categorias se revezam, uma por rodada. */
export const CATEGORIES: Category[] = ["episodes", "year", "score", "members"];
export type Guess = "more" | "less";

/** Textos de cada categoria. `ask` + título do anime da esquerda = pergunta da carta; `more`/`less` = os dois botões. */
export const CATEGORY: Record<
  Category,
  { label: string; question: string; ask: string; verb: string; unit: string; more: string; less: string }
> = {
  episodes: { label: "Episódios", question: "Qual tem mais episódios?", ask: "Mais ou menos episódios que", verb: "tem", unit: "episódios", more: "Mais", less: "Menos" },
  year: { label: "Ano de estreia", question: "Qual estreou primeiro?", ask: "Estreou antes ou depois de", verb: "estreou em", unit: "", more: "Depois", less: "Antes" },
  score: { label: "Nota no MyAnimeList", question: "Qual tem a maior nota?", ask: "Nota maior ou menor que a de", verb: "tem nota", unit: "no MyAnimeList", more: "Maior", less: "Menor" },
  members: { label: "Popularidade no MyAnimeList", question: "Qual é mais popular?", ask: "Mais ou menos popular que", verb: "tem", unit: "membros no MyAnimeList", more: "Mais", less: "Menos" },
};

/** Valor comparado na categoria ("1100+" de anime em exibição vale 1100). NaN = anime sem esse dado. */
export function valueOf(a: Anime, cat: Category): number {
  if (cat === "score") return a.mal?.score ?? NaN;
  if (cat === "members") return a.mal?.members ?? NaN;
  return cat === "year" ? a.year : parseInt(a.episodes, 10);
}

const COMPACT = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumSignificantDigits: 2 });

/** Como o valor aparece na carta: nota com 2 casas ("8,54"), membros abreviados em 2 algarismos ("3,3 mi", "870 mil"). */
export function formatValue(v: number, cat: Category): string {
  if (cat === "score") return v.toFixed(2).replace(".", ",");
  if (cat === "members") return COMPACT.format(v);
  return String(Math.round(v));
}

/** Categoria da rodada seguinte: a próxima do rodízio para a qual o anime (o novo da esquerda) tem dado. */
export function nextCategory(cat: Category, left: Anime): Category {
  const i = CATEGORIES.indexOf(cat);
  const order = CATEGORIES.map((_, k) => CATEGORIES[(i + 1 + k) % CATEGORIES.length]);
  return order.find((c) => !Number.isNaN(valueOf(left, c))) ?? "episodes";
}

/** O palpite vale? `more` = o da direita tem valor maior (mais episódios / estreou depois). */
export function isRight(left: Anime, right: Anime, cat: Category, guess: Guess): boolean {
  const diff = valueOf(right, cat) - valueOf(left, cat);
  return guess === "more" ? diff > 0 : diff < 0;
}

/**
 * Próximo anime: tem o dado da categoria, aparece com valor diferente do atual (nunca dá empate, nem
 * "2,2 mi" contra "2,2 mi") e, se der, está fora dos vistos há pouco.
 */
export function nextAnime(pool: Anime[], left: Anime, cat: Category, recent: string[], rng = Math.random): Anime {
  const shown = formatValue(valueOf(left, cat), cat);
  const ok = pool.filter((a) => !Number.isNaN(valueOf(a, cat)) && formatValue(valueOf(a, cat), cat) !== shown);
  const fresh = ok.filter((a) => !recent.includes(a.title));
  const from = fresh.length ? fresh : ok;
  return from[Math.floor(rng() * from.length)];
}

/** Medalhas por acertos seguidos (cores: tokens do tema). */
export const MEDALS = [
  { name: "Bronze", at: 5, bg: "bg-bronze" },
  { name: "Prata", at: 10, bg: "bg-lavender" },
  { name: "Ouro", at: 25, bg: "bg-sun" },
  { name: "Lendário", at: 50, bg: "bg-lime" },
] as const;

/** Maior medalha já alcançada com essa sequência (undefined = nenhuma). */
export function medalFor(streak: number) {
  return MEDALS.findLast((m) => streak >= m.at);
}

// --- Recorde e últimas jogadas, em localStorage -----------------------
const KEY = "aknewme.hl";
export type HLSave = { best: number; recent: boolean[] };

export function loadHL(): HLSave {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      best: Number.isInteger(s?.best) && s.best > 0 ? s.best : 0,
      recent: Array.isArray(s?.recent) ? s.recent.filter((b: unknown) => typeof b === "boolean").slice(-10) : [],
    };
  } catch {
    return { best: 0, recent: [] };
  }
}

export function saveHL(s: HLSave) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}
