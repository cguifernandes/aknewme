// Played days and best streak, in this browser only (specs/cabecalho/02-sequencia.md, "Your streak" panel).
// Stored as challenge day numbers (the daily challenge #, same as dailyNumber()). The current streak itself still
// lives in "aknewme.streak" (game.ts); this only adds the list of days and the best streak, without changing it.

const KEY = "aknewme.played";
const MAX_DAYS = 400;
const DAY_MS = 86_400_000;

type Saved = { days: number[]; best: number };

function read(): Saved | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return v && Array.isArray(v.days) ? { days: v.days.filter(Number.isInteger), best: Number(v.best) || 0 } : null;
  } catch {
    return null;
  }
}

function write(s: Saved) {
  try {
    const days = [...new Set(s.days)].sort((a, b) => a - b).slice(-MAX_DAYS);
    localStorage.setItem(KEY, JSON.stringify({ days, best: s.best }));
  } catch {}
}

/** Longest run of consecutive days in the list. */
export function longestRun(days: number[]): number {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  sorted.forEach((d, i) => {
    run = i > 0 && d === sorted[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

/**
 * Played days and best streak. The first time (no list saved yet) it is built from what this browser already has:
 * the days in each mode's history and the current streak counted back from its last day, so nothing is lost.
 */
export function loadPlayed(seed: { historyDays: number[]; streak: number; streakLastDay: number | null }): Saved {
  let saved = read();
  if (!saved) {
    const fromStreak = seed.streakLastDay ? Array.from({ length: seed.streak }, (_, i) => seed.streakLastDay! - i) : [];
    const days = [...seed.historyDays, ...fromStreak];
    saved = { days, best: Math.max(longestRun(days), seed.streak) };
    write(saved);
  }
  const days = [...new Set(saved.days)].sort((a, b) => a - b);
  return { days, best: Math.max(saved.best, longestRun(days), seed.streak) };
}

/** Marks a challenge day as played (called when a daily game ends) and keeps the best streak up to date. */
export function markPlayed(day: number, streak: number) {
  const saved = read() ?? { days: [], best: 0 };
  const days = [...saved.days, day];
  write({ days, best: Math.max(saved.best, longestRun(days), streak) });
}

/** The 7 challenge days (Monday to Sunday) of the week that contains `today`. */
export function weekDays(today: number, epochUtc: number): number[] {
  const weekday = new Date(epochUtc + (today - 1) * DAY_MS).getUTCDay(); // 0 = Sunday
  const monday = today - ((weekday + 6) % 7);
  return Array.from({ length: 7 }, (_, i) => monday + i);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * "AAAA-MM-DD" do dia local de quem joga, `offset` dias depois (a mesma meia-noite do dailyNumber no navegador).
 * A sequência ("aknewme.streak") usava a data em UTC: no Brasil, das 21:00 à meia-noite o "hoje" em UTC já é o dia
 * seguinte, então quem jogou ontem ficava com a sequência zerada e o selo sumia do cabeçalho até jogar de novo.
 */
export function localDate(now = new Date(), offset = 0): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * A sequência guardada ainda vale: o último jogo foi hoje ou ontem (dia local). Datas gravadas em UTC pelo código antigo
 * podem estar um dia à frente do dia local; elas também valem (comparação de texto AAAA-MM-DD).
 */
export const streakAlive = (last: string, now = new Date()) => last >= localDate(now, -1);

/** Milliseconds until the next midnight in Brasília (UTC−3, no daylight saving since 2019). */
export function msToBrasiliaMidnight(now = Date.now()): number {
  const brt = new Date(now - 3 * 3_600_000);
  const nextMidnightUtc = Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), brt.getUTCDate() + 1) + 3 * 3_600_000;
  return nextMidnightUtc - now;
}
