import { ANIMES, type Anime } from "@/data/animes";

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

export const ALL_TITLES = ANIMES.map((a) => a.title).sort((a, b) => a.localeCompare(b, "pt-BR"));

export function suggestTitles(query: string, max = 6): string[] {
  const q = normalize(query);
  if (!q) return [];
  return ALL_TITLES.filter((t) => normalize(t).includes(q)).slice(0, max);
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

/** Animes jogáveis no Modo Opening (com áudio). */
export const OPENING_ANIMES = ANIMES.filter((a) => a.opening.audioSrc);

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
export type DailyResult = { day: number; won: boolean; answer?: string; detail?: string };

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
  return full;
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
