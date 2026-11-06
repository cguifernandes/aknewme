"use client";

import Link from "next/link";
import { useState } from "react";
import { dailyNumber, loadHistory, MODE_LABEL, MODE_PATH, type GameMode } from "@/lib/game";
import { computeStats, DIST } from "@/lib/stats";

type Props = {
  mode: GameMode;
  /** Só os números, sem gráfico nem estado vazio (fim de jogo) */
  compact?: boolean;
};

/** Números do modo + gráfico de distribuição. Só renderiza no cliente (lê o localStorage). */
export default function StatsPanel({ mode, compact = false }: Props) {
  const [stats] = useState(() => computeStats(mode, loadHistory(mode), dailyNumber()));

  if (!stats.played) {
    if (compact) return null;
    return (
      <div className="rounded-2xl bg-track px-6 py-8 text-center">
        <p className="font-display text-xl font-extrabold text-ink">Nada por aqui ainda</p>
        <p className="mt-1 text-sm text-muted">
          Jogue o desafio de hoje do Modo {MODE_LABEL[mode]} para começar suas estatísticas.
        </p>
        <Link
          href={MODE_PATH[mode]}
          className="mt-5 inline-block rounded-full bg-lime px-6 py-3 text-sm font-bold text-ink transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
        >
          Jogar agora
        </Link>
      </div>
    );
  }

  const tiles = (
    <dl className={`grid grid-cols-4 ${compact ? "divide-x-2 divide-track" : "gap-2"}`}>
      {[
        ["Jogos", `${stats.played}`],
        ["Vitórias", `${stats.winPct}%`],
        ["Sequência", `${stats.current}`],
        ["Recorde", `${stats.max}`],
      ].map(([label, value]) => (
        // dt antes do dd (HTML válido); flex-col-reverse põe o número em cima
        <div key={label} className={`flex flex-col-reverse px-1 text-center ${compact ? "" : "rounded-2xl bg-track py-2.5"}`}>
          <dt className="mt-0.5 text-[11px] font-semibold text-muted">{label}</dt>
          <dd className="font-display text-2xl leading-none font-extrabold text-ink tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
  if (compact) return tiles;

  const top = Math.max(1, ...stats.dist.map((b) => b.count));
  return (
    <div>
      {tiles}

      <p className="mt-5 mb-2 text-left text-xs font-bold tracking-wider text-muted uppercase">{DIST[mode].title}</p>
      <ul className="space-y-1.5">
        {stats.dist.map((b) => {
          return (
            <li key={b.label} className="flex items-center gap-3 text-xs">
              <span className="w-3 shrink-0 text-right font-bold text-ink">{b.label}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-track">
                <span
                  className="block h-full rounded-full bg-grape"
                  style={{ width: `${b.count ? Math.max(6, (b.count / top) * 100) : 0}%` }}
                />
              </span>
              <span className={`w-5 shrink-0 text-right font-bold tabular-nums ${b.count ? "text-ink" : "text-muted/50"}`}>
                {b.count}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
