// Mais ou Menos: modo infinito de comparar dois animes (episódios ou ano de estreia).
// Lógica pura (só import de tipo), testada por scripts/check-stats.mjs.
import type { Anime } from "@/data/animes";

export const HL_PATH = "/higher-lower";

export type Category = "episodes" | "year";
export type Guess = "more" | "less";

/** Textos de cada categoria. `more`/`less` são os rótulos dos dois botões. */
export const CATEGORY: Record<
  Category,
  { label: string; question: string; verb: string; unit: string; more: string; less: string }
> = {
  episodes: { label: "Episódios", question: "Qual tem mais episódios?", verb: "tem", unit: "episódios", more: "Mais", less: "Menos" },
  year: { label: "Ano de estreia", question: "Qual estreou primeiro?", verb: "estreou em", unit: "", more: "Depois", less: "Antes" },
};

/** Valor comparado na categoria ("1100+" de anime em exibição vale 1100). */
export function valueOf(a: Anime, cat: Category): number {
  return cat === "year" ? a.year : parseInt(a.episodes, 10);
}

/** O palpite vale? `more` = o da direita tem valor maior (mais episódios / estreou depois). */
export function isRight(left: Anime, right: Anime, cat: Category, guess: Guess): boolean {
  const diff = valueOf(right, cat) - valueOf(left, cat);
  return guess === "more" ? diff > 0 : diff < 0;
}

/** Próximo anime: valor diferente do atual na categoria (nunca dá empate) e, se der, fora dos vistos há pouco. */
export function nextAnime(pool: Anime[], left: Anime, cat: Category, recent: string[], rng = Math.random): Anime {
  const ok = pool.filter((a) => valueOf(a, cat) !== valueOf(left, cat));
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
