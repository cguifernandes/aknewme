// Estatísticas derivadas do histórico. Função pura (só imports de tipo),
// testada por scripts/check-stats.mjs.
import type { GameMode, HistoryEntry } from "./game";

type Bucket = { label: string; score: number | null };

/** Faixas do gráfico de distribuição (score null = perdeu). */
export const DIST: Record<GameMode, { title: string; buckets: Bucket[] }> = {
  emoji: { title: "Pontos por jogo", buckets: [0, 1, 2, 3, 4, 5].map((n) => ({ label: `${n}`, score: n })) },
  opening: {
    title: "Acertou na tentativa",
    buckets: [...[1, 2, 3, 4, 5, 6].map((n) => ({ label: `${n}`, score: n })), { label: "✗", score: null }],
  },
  pistas: {
    title: "Pontos por jogo",
    buckets: [...[5, 4, 3, 2, 1].map((n) => ({ label: `${n}`, score: n })), { label: "✗", score: null }],
  },
};

export type Stats = {
  played: number;
  winPct: number;
  /** Vitórias em dias seguidos até hoje (ou ontem, se hoje ainda não jogou) */
  current: number;
  max: number;
  dist: (Bucket & { count: number })[];
};

export function computeStats(mode: GameMode, history: HistoryEntry[], today: number): Stats {
  const h = [...history].sort((a, b) => a.day - b.day);
  let run = 0;
  let max = 0;
  let prevDay = -Infinity;
  for (const e of h) {
    run = e.won ? (e.day === prevDay + 1 ? run + 1 : 1) : 0;
    max = Math.max(max, run);
    prevDay = e.day;
  }
  const last = h.at(-1);
  const wins = h.filter((e) => e.won).length;
  return {
    played: h.length,
    winPct: h.length ? Math.round((wins / h.length) * 100) : 0,
    current: last && last.day >= today - 1 ? run : 0,
    max,
    dist: DIST[mode].buckets.map((b) => ({ ...b, count: h.filter((e) => e.score === b.score).length })),
  };
}
