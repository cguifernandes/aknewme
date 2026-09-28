import { ANIMES, type Anime, type Opening } from "@/data/animes";

/** Normaliza para comparação: minúsculas, sem acentos, só letras/números. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isCorrectGuess(guess: string, anime: Anime): boolean {
  const g = normalize(guess);
  if (!g) return false;
  return g === normalize(anime.title) || anime.aliases.some((a) => normalize(a) === g);
}

// Título + apelidos normalizados de cada anime (busca e validação de palpite).
const SEARCH = ANIMES.map((a) => ({ title: a.title, keys: [a.title, ...a.aliases].map(normalize) }));

/** Sugestões pelo título ou apelido ("saint seiya" → Cavaleiros do Zodíaco); quem começa com o texto vem antes. */
export function suggestTitles(query: string, max = 6): string[] {
  const q = normalize(query);
  if (!q) return [];
  return SEARCH.filter((s) => s.keys.some((k) => k.includes(q)))
    .map((s) => ({ title: s.title, starts: s.keys.some((k) => k.startsWith(q)) }))
    .sort((a, b) => Number(b.starts) - Number(a.starts) || a.title.localeCompare(b.title, "pt-BR"))
    .slice(0, max)
    .map((s) => s.title);
}

/** Palpite é o título ou apelido de algum anime do banco? (evita gastar tentativa com texto incompleto) */
export function isKnownAnime(guess: string): boolean {
  const g = normalize(guess);
  return !!g && SEARCH.some((s) => s.keys.includes(g));
}

// --- Desafio diário -------------------------------------------------
// Época escolhida para o desafio de hoje bater com o nº do design (#142).
const EPOCH_UTC = Date.UTC(2026, 4, 10); // 2026-05-10 = desafio #1

export function dailyNumber(): number {
  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.floor((todayUTC - EPOCH_UTC) / 86_400_000) + 1);
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seed aleatória para o modo treino (não é segurança, só variedade). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Aberturas com áudio de um anime (as que podem ser sorteadas). */
const playable = (a: Anime) => a.openings.filter((o) => o.audioSrc);

/** Animes jogáveis no Modo Opening (com pelo menos uma abertura com áudio). */
export const OPENING_ANIMES = ANIMES.filter((a) => playable(a).length > 0);

/** Sorteia qual abertura do anime toca; mesma seed, mesma abertura (desafio do dia igual para todos). */
export function pickOpening(anime: Anime, seed: number): Opening {
  const list = playable(anime);
  return list[Math.floor(mulberry32(seed)() * list.length)];
}

/** Sorteia `count` animes distintos, determinístico para uma mesma seed. */
export function pickAnimes(seed: number, count: number, from: Anime[] = ANIMES): Anime[] {
  const rng = mulberry32(seed);
  const pool = [...from];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

// --- Resultado diário por modo: um jogo a cada 24h -------------------
export type GameMode = "emoji" | "opening" | "pistas";
export const MODE_LABEL: Record<GameMode, string> = { emoji: "Emoji", opening: "Opening", pistas: "Pistas" };
export const MODE_PATH: Record<GameMode, string> = { emoji: "/emoji", opening: "/opening", pistas: "/clues" };
const MODE_ICON: Record<GameMode, string> = { emoji: "🎭", opening: "🎵", pistas: "🔎" };

/** Texto de compartilhar (sem spoiler). O link entra na hora de compartilhar, depois do "👉". */
export function shareText(mode: GameMode, won: boolean, line: string, grid: string): string {
  return [
    `${MODE_ICON[mode]} aknewme #${dailyNumber()} · Modo ${MODE_LABEL[mode]}`,
    line,
    "",
    grid,
    "",
    won ? "Consegue fazer melhor?" : "Será que você acerta?",
  ].join("\n");
}

export type DailyResult = {
  day: number;
  won: boolean;
  answer?: string;
  detail?: string;
  /** Texto para compartilhar (sem spoiler), sem o link */
  share?: string;
  /** Só os quadradinhos, para a prévia no fim de jogo */
  grid?: string;
  /** Emoji: pontos · Opening: tentativa do acerto · Pistas: pontos · null = perdeu */
  score?: number | null;
};

/** Resultado do desafio de HOJE, ou null se o modo ainda não foi jogado. */
export function getDailyResult(mode: GameMode): DailyResult | null {
  try {
    const raw = localStorage.getItem(`aknewme.result.${mode}`);
    if (!raw) return null;
    const r = JSON.parse(raw) as DailyResult;
    return r.day === dailyNumber() ? r : null;
  } catch {
    return null;
  }
}

export function saveDailyResult(mode: GameMode, r: Omit<DailyResult, "day">): DailyResult {
  const full = { day: dailyNumber(), ...r };
  try {
    localStorage.setItem(`aknewme.result.${mode}`, JSON.stringify(full));
  } catch {}
  addHistory(mode, { day: full.day, won: full.won, score: full.score ?? null });
  return full;
}

// --- Histórico por modo (base das estatísticas) ----------------------
export type HistoryEntry = { day: number; won: boolean; score: number | null };

const isEntry = (e: unknown): e is HistoryEntry =>
  typeof e === "object" && e !== null &&
  typeof (e as HistoryEntry).day === "number" &&
  typeof (e as HistoryEntry).won === "boolean" &&
  ((e as HistoryEntry).score === null || typeof (e as HistoryEntry).score === "number");

/** Histórico do modo; entradas malformadas (localStorage editado à mão) são descartadas. */
export function loadHistory(mode: GameMode): HistoryEntry[] {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(`aknewme.history.${mode}`) ?? "[]");
    return Array.isArray(list) ? list.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function addHistory(mode: GameMode, entry: HistoryEntry) {
  try {
    const list = loadHistory(mode).filter((e) => e.day !== entry.day);
    localStorage.setItem(`aknewme.history.${mode}`, JSON.stringify([...list, entry]));
  } catch {}
}

// --- Sequência de dias (streak), em localStorage ---------------------
const STREAK_KEY = "aknewme.streak";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getStreak(): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    const { last, count } = JSON.parse(raw) as { last: string; count: number };
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    if (last === todayStr() || last === yesterday) return count;
    return 0;
  } catch {
    return 0;
  }
}

/** Registra que o jogador completou um jogo hoje; devolve a streak atual. */
export function recordPlay(): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    let count = 1;
    if (raw) {
      const prev = JSON.parse(raw) as { last: string; count: number };
      if (prev.last === todayStr()) count = prev.count;
      else if (prev.last === yesterday) count = prev.count + 1;
    }
    localStorage.setItem(STREAK_KEY, JSON.stringify({ last: todayStr(), count }));
    return count;
  } catch {
    return 0;
  }
}
