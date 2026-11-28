"use client";

import Link from "next/link";
import { useState } from "react";
import { dailyNumber, loadHistory, MODE_LABEL, MODE_PATH, type GameMode } from "@/lib/game";
import { computeStats } from "@/lib/stats";
import { CARD, MonthCard, outcome, titleOf } from "./StatsBoard";

const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
/** Jogos na lista "Jogos recentes" da versão compacta. */
const RECENT = 3;

/**
 * Estatísticas de um modo em versão compacta, para o cartão da janela Meu perfil ao lado da Conta
 * (specs/login-duelo/09-menu-perfil.md, "Estatísticas compactas no perfil"): os números numa faixa curta, o "Último mês"
 * e os jogos recentes em uma linha cada. Sem a distribuição de pontos e sem o "Compartilhar": esses ficam no diálogo
 * completo (StatsBoard). Só renderiza no cliente (lê o localStorage).
 */
export default function StatsCompact({ mode }: { mode: GameMode }) {
  const [today] = useState(dailyNumber);
  const [history] = useState(() => loadHistory(mode).sort((a, b) => b.day - a.day)); // mais recente primeiro
  const stats = computeStats(mode, history, today);

  if (!stats.played)
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-track px-4 py-3">
        <p className="min-w-0 flex-1 text-sm text-pretty text-muted">
          <span className="block font-display text-base font-extrabold text-ink">Nada por aqui ainda</span>
          Jogue o desafio de hoje do Modo {MODE_LABEL[mode]}.
        </p>
        <Link
          href={MODE_PATH[mode]}
          className="shrink-0 rounded-full bg-lime px-4 py-2 text-sm font-bold text-ink sweep-lime-deep active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
        >
          Jogar agora
        </Link>
      </div>
    );

  const numbers: [string, string][] = [
    ["Sequência", nf.format(stats.current)],
    ["Recorde", nf.format(stats.max)],
    ["Jogos", nf.format(stats.played)],
    ["Vitórias", `${stats.winPct}%`],
  ];

  return (
    <div className="space-y-3">
      {/* faixa curta: 4 números numa linha (2 × 2 no celular estreito, para não apertar) */}
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {numbers.map(([label, value], i) => (
          // dt antes do dd (HTML válido); flex-col-reverse põe o número em cima
          <div key={label} className={`flex flex-col-reverse rounded-xl px-3 py-2 ${i === 0 ? "bg-grape text-white" : "bg-track"}`}>
            <dt className={`text-xs ${i === 0 ? "text-lavender" : "text-muted"}`}>{label}</dt>
            <dd className="font-display text-xl leading-tight font-extrabold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-3 sm:grid-cols-2">
        <MonthCard mode={mode} today={today} history={history} compact />

        <section className={`${CARD} min-w-0 p-3`}>
          <h3 className="mb-1 text-sm font-bold">Jogos recentes</h3>
          <ul className="divide-y divide-track">
            {history.slice(0, RECENT).map((e) => (
              <li key={e.day} className="flex items-center gap-2 py-1.5 text-sm">
                <span className="shrink-0 text-xs font-semibold text-muted tabular-nums">#{e.day}</span>
                <span className="min-w-0 flex-1 truncate font-bold">{titleOf(mode, e.day)}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${e.won ? "bg-lime" : "bg-blush"}`}>{outcome(mode, e)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
