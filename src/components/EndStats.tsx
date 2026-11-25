"use client";

import { useState } from "react";
import { dailyNumber, loadHistory, type GameMode } from "@/lib/game";
import { computeStats } from "@/lib/stats";

/**
 * Os quatro números do modo no fim de jogo (jogos, vitórias, sequência e recorde). São os jogos de verdade do
 * jogador, lidos do localStorage (o painel completo, com gráfico e histórico, é o StatsBoard da home).
 */
export default function EndStats({ mode }: { mode: GameMode }) {
  const [stats] = useState(() => computeStats(mode, loadHistory(mode), dailyNumber()));
  if (!stats.played) return null; // desafio do arquivo de quem nunca jogou o do dia: nada para mostrar

  return (
    <dl className="grid grid-cols-4 divide-x-2 divide-track rounded-2xl border-2 border-track py-2.5">
      {[
        ["Jogos", `${stats.played}`],
        ["Vitórias", `${stats.winPct}%`],
        ["Sequência", `${stats.current}`],
        ["Recorde", `${stats.max}`],
      ].map(([label, value]) => (
        // dt antes do dd (HTML válido); flex-col-reverse põe o número em cima
        <div key={label} className="flex flex-col-reverse px-1 text-center">
          <dt className="mt-0.5 text-[11px] font-semibold text-muted">{label}</dt>
          <dd className="font-display text-xl leading-none font-extrabold text-ink tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
