"use client";

import { faCheck, faCircleCheck, faCopy, faXmark } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useState } from "react";
import {
  dailyAnimes,
  dailyNumber,
  EPOCH_UTC,
  loadHistory,
  MODE_LABEL,
  MODE_PATH,
  type GameMode,
  type HistoryEntry,
} from "@/lib/game";
import { shareOrCopy } from "@/lib/share";
import { computeStats, DIST } from "@/lib/stats";
import AnimeImage from "./AnimeImage";
import { Icon } from "./icons";

const CARD = "rounded-2xl border-2 border-track p-4";
const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"]; // segunda a domingo
const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const days = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;

/** Anime do desafio do dia (no Emoji são cinco: o primeiro e "+4"). */
function titleOf(mode: GameMode, day: number): string {
  const animes = dailyAnimes(mode, day);
  return animes.length > 1 ? `${animes[0].title} +${animes.length - 1}` : animes[0].title;
}

/** Como o jogo terminou, no rótulo curto da lista de jogos recentes. */
function outcome(mode: GameMode, e: HistoryEntry): string {
  if (!e.won) return "Perdeu";
  if (mode === "emoji") return `${e.score}/5`;
  if (mode === "pistas") return `${e.score} pts`;
  return DIST.opening.buckets.find((b) => b.score === e.score)?.label ?? "";
}

const dateOf = (day: number) => new Date(EPOCH_UTC + (day - 1) * 86_400_000);
const dayMonth = (day: number) => dateOf(day).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
const MONTH = 30; // "último mês" = os 30 dias até hoje

/**
 * Calendário do último mês em semanas inteiras (seg → dom), da semana de 30 dias atrás até a de hoje.
 * `entry` undefined = não jogou; `off` = fora dos 30 dias (ou antes do desafio #1).
 */
function lastMonth(today: number, history: HistoryEntry[]) {
  const byDay = new Map(history.map((e) => [e.day, e]));
  const weekday = (day: number) => (dateOf(day).getUTCDay() + 6) % 7; // segunda = 0
  const first = today - MONTH + 1;
  const monday = first - weekday(first);
  const sunday = today + (6 - weekday(today));
  return Array.from({ length: sunday - monday + 1 }, (_, i) => {
    const day = monday + i;
    return { day, entry: byDay.get(day), off: day > today || day < first || day < 1 };
  });
}

/** Lado em que o balão do dia abre, pela coluna: nas pontas ele alinha à borda para não sair do card. */
const TIP_MID = "left-1/2 -translate-x-1/2";
const TIP_SIDE = ["left-0", "left-0", TIP_MID, TIP_MID, TIP_MID, "right-0", "right-0"];

/** Painel completo de estatísticas de um modo. Só renderiza no cliente (lê o localStorage). */
export default function StatsBoard({ mode }: { mode: GameMode }) {
  const [today] = useState(dailyNumber);
  const [history] = useState(() => loadHistory(mode).sort((a, b) => b.day - a.day)); // mais recente primeiro
  const [copied, setCopied] = useState(false);
  const stats = computeStats(mode, history, today);

  if (!stats.played)
    return (
      <div className="rounded-2xl bg-track px-6 py-8 text-center">
        <p className="font-display text-xl font-extrabold text-ink">Nada por aqui ainda</p>
        <p className="mt-1 text-sm text-pretty text-muted">
          Jogue o desafio de hoje do Modo {MODE_LABEL[mode]} para começar suas estatísticas.
        </p>
        <Link
          href={MODE_PATH[mode]}
          className="mt-5 inline-block rounded-full bg-lime px-6 py-3 text-sm font-bold text-ink sweep-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
        >
          Jogar agora
        </Link>
      </div>
    );

  const top = Math.max(1, ...stats.dist.map((b) => b.count));
  const last = history[0];

  async function share() {
    const text = [
      `📊 aknewme · Modo ${MODE_LABEL[mode]}`,
      `${stats.played} ${stats.played === 1 ? "jogo" : "jogos"} · ${stats.winPct}% de vitórias`,
      `Sequência: ${days(stats.current)} · Recorde: ${days(stats.max)}`,
      `👉 ${location.origin}${MODE_PATH[mode]}?utm_source=stats`,
    ].join("\n");
    if (await shareOrCopy(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <div className="flex items-end justify-between gap-4 rounded-2xl bg-grape p-4 text-white">
          <div>
            <p className="text-sm font-bold">Sequência atual</p>
            <p className="mt-1 text-sm font-bold">
              <span className="mr-1.5 font-display text-5xl leading-none font-extrabold tabular-nums">{stats.current}</span>
              {stats.current === 1 ? "dia" : "dias"}
            </p>
          </div>
          <p className="text-xs text-lavender">Recorde: {days(stats.max)}</p>
        </div>

        <dl className="grid grid-cols-3 gap-3">
          {[
            ["Jogos", nf.format(stats.played)],
            ["Pontos", nf.format(stats.points)],
            ["Vitórias", `${stats.winPct}%`],
          ].map(([label, value]) => (
            // dt antes do dd (HTML válido); flex-col-reverse põe o número em cima
            <div key={label} className={`${CARD} flex flex-col-reverse px-3 py-3`}>
              <dt className="mt-0.5 text-xs text-muted">{label}</dt>
              <dd className="font-display text-2xl leading-none font-extrabold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        <section className={CARD}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold">{DIST[mode].title}</h3>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className="size-3 rounded-sm bg-lime" aria-hidden="true" /> último jogo
            </p>
          </div>
          <ul className="space-y-2">
            {stats.dist.map((b) => (
              <li key={b.label} className="flex items-center gap-3 text-xs font-bold">
                <span className="w-7 shrink-0">{b.score === null ? <Icon icon={faXmark} /> : b.label}</span>
                <span className="h-4 flex-1 overflow-hidden rounded-full bg-track">
                  <span
                    className={`block h-full rounded-full ${b.score === last.score ? "bg-lime" : "bg-grape"}`}
                    style={{ width: `${b.count ? Math.max(8, (b.count / top) * 100) : 0}%` }}
                  />
                </span>
                <span className={`w-5 shrink-0 text-right tabular-nums ${b.count ? "" : "text-muted/50"}`}>{b.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="min-w-0 space-y-4">
        <section className={CARD}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h3 className="text-sm font-bold">Último mês</h3>
            <ul className="flex gap-3 text-xs text-muted">
              {[
                ["bg-lime", "Ganhou"],
                ["bg-blush", "Perdeu"],
                ["bg-track", "Não jogou"],
              ].map(([bg, label]) => (
                <li key={label} className="flex items-center gap-1.5">
                  <span className={`size-3 rounded-sm ${bg}`} aria-hidden="true" /> {label}
                </li>
              ))}
            </ul>
          </div>
          {/* visual (o balão de cada dia abre no hover); os jogos também estão em texto em "Jogos recentes" */}
          <div className="grid grid-cols-7 gap-1.5 text-center" aria-hidden="true">
            {WEEKDAYS.map((d, i) => (
              <span key={i} className="text-[11px] font-bold text-muted">
                {d}
              </span>
            ))}
            {lastMonth(today, history).map((c, i) => {
              const e = c.off ? undefined : c.entry;
              return (
                <span
                  key={c.day}
                  className={`group/day relative flex h-7 items-center justify-center rounded-lg text-[11px] ${
                    !e ? (c.off ? "bg-track/40" : "bg-track") : e.won ? "bg-lime" : "bg-blush"
                  } ${c.day === today ? "outline-2 outline-ink" : ""}`}
                >
                  {e && <Icon icon={e.won ? faCheck : faXmark} />}
                  {!c.off && (
                    <span
                      className={`pointer-events-none absolute bottom-full z-10 mb-1.5 hidden w-max max-w-52 rounded-xl bg-ink px-3 py-2 text-left text-xs leading-snug font-semibold text-white group-hover/day:block ${TIP_SIDE[i % 7]}`}
                    >
                      <span className="block text-lavender">
                        #{c.day} · {dayMonth(c.day)}
                      </span>
                      {/* o anime só aparece nos dias jogados: nos outros seria spoiler do arquivo */}
                      {e ? `${titleOf(mode, c.day)} · ${outcome(mode, e)}` : c.day === today ? "Ainda não jogou hoje" : "Não jogou"}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </section>

        <section className={CARD}>
          <h3 className="mb-1 text-sm font-bold">Jogos recentes</h3>
          <ul>
            {history.slice(0, 4).map((e) => (
              <li key={e.day} className="flex items-center gap-3 py-2 text-sm font-bold">
                {/* capa do anime (no Emoji, a do primeiro dos cinco) */}
                <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-track">
                  <AnimeImage anime={dailyAnimes(mode, e.day)[0]} kind="cover" sizes="64px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{titleOf(mode, e.day)}</span>
                  <span className="block text-xs font-semibold text-muted">
                    #{e.day} · {MODE_LABEL[mode]}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${e.won ? "bg-lime" : "bg-blush"}`}>
                  {outcome(mode, e)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <button
          type="button"
          onClick={share}
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-lime py-3.5 font-bold text-ink shadow-pop sweep-white active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
        >
          {copied ? "Copiado!" : "Compartilhar estatísticas"} <Icon icon={copied ? faCircleCheck : faCopy} />
        </button>
        <p aria-live="polite" className="sr-only">
          {copied ? "Estatísticas copiadas" : ""}
        </p>
      </div>
    </div>
  );
}
