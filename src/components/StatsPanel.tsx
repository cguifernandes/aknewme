"use client";

import { useState } from "react";
import { dailyNumber, loadHistory, type GameMode } from "@/lib/game";
import { computeStats } from "@/lib/stats";

/** Só os quatro números do modo, para o fim de jogo (o painel completo é o StatsBoard). Lê o localStorage. */
export default function StatsPanel({ mode }: { mode: GameMode }) {
  const [stats] = useState(() => computeStats(mode, loadHistory(mode), dailyNumber()));
  if (!stats.played) return null;

  return (
    <dl className="grid grid-cols-4 divide-x-2 divide-track">
      {[
        ["Jogos", `${stats.played}`],
        ["Vitórias", `${stats.winPct}%`],
        ["Sequência", `${stats.current}`],
        ["Recorde", `${stats.max}`],
      ].map(([label, value]) => (
        // dt antes do dd (HTML válido); flex-col-reverse põe o número em cima
        <div key={label} className="flex flex-col-reverse px-1 text-center">
          <dt className="mt-0.5 text-[11px] font-semibold text-muted">{label}</dt>
          <dd className="font-display text-2xl leading-none font-extrabold text-ink tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
