// Mais ou Menos: modo infinito de comparar dois animes: episódios, ano de estreia, nota e popularidade no
// MyAnimeList (src/data/animes/mal.ts) e favoritos no AniList (src/data/animes/anilist.ts). Errou, perdeu.
// Ficha na carta, pergunta de favoritos e rodadas temáticas: specs/mais-ou-menos/01-ficha-favoritos-temas.md.
// Lógica pura (só import de tipo), testada por scripts/check-stats.mjs.
import type { Anime } from "@/data/animes";

export const HL_PATH = "/higher-lower";

export type Category = "episodes" | "year" | "score" | "members" | "favourites";
/** Ordem em que as categorias se revezam, uma por rodada. */
export const CATEGORIES: Category[] = ["episodes", "year", "score", "members", "favourites"];
/** A pergunta de favoritos só liga se pelo menos esta parte do banco em jogo tiver o número do AniList. */
export const FAVOURITES_MIN_COVERAGE = 0.9;
export type Guess = "more" | "less";

/** Textos de cada categoria. `ask` + título do anime da esquerda = pergunta da carta; `more`/`less` = os dois botões. */
export const CATEGORY: Record<
  Category,
  { label: string; question: string; short: string; tag: string; ask: string; verb: string; unit: string; more: string; less: string }
> = {
  episodes: { label: "Episódios", question: "Qual tem mais episódios?", short: "Mais episódios?", tag: "Episódios", ask: "Mais ou menos episódios que", verb: "tem", unit: "episódios", more: "Mais", less: "Menos" },
  year: { label: "Ano de estreia", question: "Qual estreou primeiro?", short: "Estreou primeiro?", tag: "Ano de estreia", ask: "Estreou antes ou depois de", verb: "estreou em", unit: "", more: "Depois", less: "Antes" },
  score: { label: "Nota no MyAnimeList", question: "Qual tem a maior nota?", short: "Nota maior?", tag: "Nota no MAL", ask: "Nota maior ou menor que a de", verb: "tem nota", unit: "no MyAnimeList", more: "Maior", less: "Menor" },
  members: { label: "Popularidade no MyAnimeList", question: "Qual é mais popular?", short: "Mais membros?", tag: "Membros no MAL", ask: "Mais ou menos popular que", verb: "tem", unit: "membros no MyAnimeList", more: "Mais", less: "Menos" },
  // a fonte vai na pergunta: é outro site, para não confundir com a popularidade do MyAnimeList
  favourites: { label: "Favoritos no AniList", question: "Qual tem mais favoritos no AniList?", short: "Mais favoritos no AniList?", tag: "Favoritos no AniList", ask: "Mais ou menos favoritos no AniList que", verb: "tem", unit: "favoritos no AniList", more: "Mais", less: "Menos" },
};

/** Valor comparado na categoria ("1100+" de anime em exibição vale 1100). NaN = anime sem esse dado. */
export function valueOf(a: Anime, cat: Category): number {
  if (cat === "score") return a.mal?.score ?? NaN;
  if (cat === "members") return a.mal?.members ?? NaN;
  if (cat === "favourites") return a.favourites ?? NaN;
  return cat === "year" ? a.year : parseInt(a.episodes, 10);
}

const COMPACT = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumSignificantDigits: 2 });

/** Como o valor aparece na carta: nota com 2 casas ("8,54"), membros e favoritos abreviados em 2 algarismos ("3,3 mi", "870 mil"). */
export function formatValue(v: number, cat: Category): string {
  if (cat === "score") return v.toFixed(2).replace(".", ",");
  if (cat === "members" || cat === "favourites") return COMPACT.format(v);
  return String(Math.round(v));
}

/** Parte do banco (0 a 1) que tem o dado da categoria. */
export function coverage(pool: Anime[], cat: Category): number {
  return pool.length ? pool.filter((a) => !Number.isNaN(valueOf(a, cat))).length / pool.length : 0;
}

/** Categorias em jogo para um banco: favoritos só entra com cobertura de pelo menos 90% (quem não tem o número fica fora só dessa pergunta). */
export function categoriesFor(pool: Anime[]): Category[] {
  return CATEGORIES.filter((c) => c !== "favourites" || coverage(pool, c) >= FAVOURITES_MIN_COVERAGE);
}

/** Categoria da rodada seguinte: a próxima do rodízio (`cats`) para a qual o anime (o novo da esquerda) tem dado. */
export function nextCategory(cat: Category, left: Anime, cats: Category[] = CATEGORIES): Category {
  const i = cats.indexOf(cat);
  const order = cats.map((_, k) => cats[(i + 1 + k) % cats.length]);
  return order.find((c) => !Number.isNaN(valueOf(left, c))) ?? "episodes";
}

/** Gêneros do anime, um a um ("Ação / Aventura" → ["Ação", "Aventura"]). */
export const genresOf = (a: Pick<Anime, "genre">) => a.genre.split("/").map((g) => g.trim()).filter(Boolean);

/** Um dado da ficha da carta. */
export type Fact = { key: "genre" | "studio" | "year" | "episodes"; label: string; text: string };

/**
 * Ficha da carta: gênero (os `maxGenres` primeiros), estúdio, ano e episódios. O dado comparado na rodada não entra
 * (na rodada de ano o ano seria a resposta; na de episódios, os episódios).
 */
export function cardFacts(a: Anime, cat: Category, maxGenres = 2): Fact[] {
  const facts: Fact[] = [
    { key: "genre", label: "Gênero", text: genresOf(a).slice(0, maxGenres).join(" · ") },
    { key: "studio", label: "Estúdio", text: a.studio },
    { key: "year", label: "Ano", text: String(a.year) },
    { key: "episodes", label: "Episódios", text: `${a.episodes} ${parseInt(a.episodes, 10) === 1 ? "ep." : "eps."}` },
  ];
  return facts.filter((f) => f.text && f.key !== cat);
}

// --- Rodadas temáticas (teste com 2 temas) -----------------------------
// Os 2 temas com mais animes com imagem no banco em 26/11/2026: Anos 2010 (61) e Ação (59); o seguinte seria
// Fantasia (29). Cada tema precisa de pelo menos THEME_MIN animes (conferido em scripts/check-stats.mjs).
export type ThemeId = "all" | "2010s" | "action";
export const THEME_MIN = 25;
export const THEMES: { id: ThemeId; label: string; has: (a: Anime) => boolean }[] = [
  { id: "all", label: "Todos os animes", has: () => true },
  { id: "2010s", label: "Anos 2010", has: (a) => a.year >= 2010 && a.year <= 2019 },
  { id: "action", label: "Ação", has: (a) => genresOf(a).includes("Ação") },
];
export const themeOf = (id: string | null | undefined) => THEMES.find((t) => t.id === id) ?? THEMES[0];
/** Animes do tema dentro do banco em jogo. */
export const themePool = (pool: Anime[], id: ThemeId) => pool.filter(themeOf(id).has);

/** O palpite vale? `more` = o da direita tem valor maior (mais episódios / estreou depois). */
/**
 * A pergunta da carta do palpite, com o texto do modo (specs/mais-ou-menos/01, seção 9). `left` = a carta com o valor à
 * mostra, `right` = a do palpite.
 */
export function guessQuestion(cat: Category, left: Anime, right: Anime): string {
  const v = formatValue(valueOf(left, cat), cat);
  if (cat === "year") return `${right.title} estreou antes ou depois de ${v}?`;
  if (cat === "episodes") return `${right.title} tem mais ou menos episódios que ${left.title}?`;
  if (cat === "score") return `A nota de ${right.title} é maior ou menor que ${v}?`;
  if (cat === "members") return `${right.title} tem mais ou menos membros no MAL?`;
  return `${right.title} tem mais ou menos favoritos no AniList?`;
}

/**
 * Os botões com o texto do modo: `more` = o palpite "mais" (no ano, "Depois de <ano>": mais recente = valor maior) e
 * `less` = "menos" (no ano, "Antes de <ano>").
 */
export function guessLabels(cat: Category, left: Anime): { more: string; less: string } {
  if (cat === "year") {
    const y = formatValue(valueOf(left, cat), cat);
    return { more: `Depois de ${y}`, less: `Antes de ${y}` };
  }
  if (cat === "episodes") return { more: "Mais episódios", less: "Menos episódios" };
  if (cat === "score") return { more: "Nota maior", less: "Nota menor" };
  if (cat === "members") return { more: "Mais membros", less: "Menos membros" };
  return { more: "Mais favoritos", less: "Menos favoritos" };
}

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
// Um recorde por tema (as medalhas saem da sequência, então também são por tema): "Todos os animes" continua em
// "aknewme.hl" (quem já jogava mantém o recorde) e cada tema tem a sua chave, sem misturar.
const KEY = "aknewme.hl";
const THEME_KEY = "aknewme.hl.theme";
const keyOf = (theme: ThemeId) => (theme === "all" ? KEY : `${KEY}.${theme}`);
export type HLSave = { best: number; recent: boolean[] };

export function loadHL(theme: ThemeId = "all"): HLSave {
  try {
    const s = JSON.parse(localStorage.getItem(keyOf(theme)) ?? "{}");
    return {
      best: Number.isInteger(s?.best) && s.best > 0 ? s.best : 0,
      recent: Array.isArray(s?.recent) ? s.recent.filter((b: unknown) => typeof b === "boolean").slice(-10) : [],
    };
  } catch {
    return { best: 0, recent: [] };
  }
}

export function saveHL(s: HLSave, theme: ThemeId = "all") {
  try {
    localStorage.setItem(keyOf(theme), JSON.stringify(s));
  } catch {}
}

/** Tema escolhido da última vez (volta nele ao abrir o jogo). */
export function loadTheme(): ThemeId {
  try {
    return themeOf(localStorage.getItem(THEME_KEY)).id;
  } catch {
    return "all";
  }
}

export function saveTheme(theme: ThemeId) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}
