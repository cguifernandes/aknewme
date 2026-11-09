// Estatísticas derivadas do histórico. Função pura (só imports de tipo),
// testada por scripts/check-stats.mjs.
import type { GameMode, HistoryEntry } from "./game";

type Bucket = { label: string; score: number | null };

/** Faixas do gráfico de distribuição (score null = perdeu). */
export const DIST: Record<GameMode, { title: string; buckets: Bucket[] }> = {
  emoji: { title: "Pontos por jogo", buckets: [0, 1, 2, 3, 4, 5].map((n) => ({ label: `${n}`, score: n })) },
  opening: {
    title: "Segundos até acertar",
    // score = nº da tentativa; o rótulo é quanto da abertura já tinha tocado nela (STAGES do OpeningGame)
    buckets: [...[1, 2, 4, 7, 11, 16].map((s, i) => ({ label: `${s}s`, score: i + 1 })), { label: "✗", score: null }],
  },
  pistas: {
    title: "Pontos por jogo",
    buckets: [...[5, 4, 3, 2, 1].map((n) => ({ label: `${n}`, score: n })), { label: "✗", score: null }],
  },
};

/** Nota comparável entre jogadores do mesmo modo: maior = melhor, 0 = perdeu. */
export function rank(mode: GameMode, score: number | null): number {
  if (score === null) return 0;
  return mode === "opening" ? 7 - score : score; // Opening: acertar em menos tentativas vale mais
}

export type Standing = { total: number; better: number; winPct: number };

/**
 * Posição entre os jogadores do dia, pelos contadores "modo:rN" do Redis (api/played):
 * `better` = % que foi pior que esta nota, `winPct` = % que acertou. null = pouca gente ainda.
 */
export function standing(mode: GameMode, counts: Record<string, string>, score: number | null, min = 10): Standing | null {
  const mine = rank(mode, score);
  let total = 0;
  let worse = 0;
  let wins = 0;
  for (let r = 0; r <= 6; r++) {
    const n = Number(counts[`${mode}:r${r}`] ?? 0);
    total += n;
    if (r < mine) worse += n;
    if (r > 0) wins += n;
  }
  if (total < min) return null;
  // teto de 99: o próprio jogador pode ainda não estar na contagem
  return { total, better: Math.min(99, Math.round((100 * worse) / total)), winPct: Math.round((100 * wins) / total) };
}

export type Stats = {
  played: number;
  wins: number;
  winPct: number;
  /** Soma das notas (`rank`): Emoji e Pistas = pontos do jogo; Opening = 6 na 1ª tentativa até 1 na 6ª, 0 se perdeu */
  points: number;
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
    wins,
    points: h.reduce((sum, e) => sum + rank(mode, e.score), 0),
    winPct: h.length ? Math.round((wins / h.length) * 100) : 0,
    current: last && last.day >= today - 1 ? run : 0,
    max,
    dist: DIST[mode].buckets.map((b) => ({ ...b, count: h.filter((e) => e.score === b.score).length })),
  };
}
