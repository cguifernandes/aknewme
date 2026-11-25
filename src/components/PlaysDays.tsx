"use client";

import { useState } from "react";
import { MODE_LABEL, type GameMode } from "@/lib/game";

const MODES = Object.keys(MODE_LABEL) as GameMode[];
const FIRST = 7; // dias mostrados antes do "Ver os N dias"
const TH = "px-2 py-2 font-semibold";
const TD = "px-2 py-2.5 tabular-nums";

/** Um dia já resumido no servidor (o client component não recebe os contadores crus). */
export type DaySummary = {
  day: number;
  date: string;
  mobile: number;
  desktop: number;
  people: number;
  /** começaram, terminaram e acertaram em cada modo */
  modes: Record<GameMode, { start: number; done: number; won: number }>;
  follow: number;
  post: number;
};

/** Tabela "Dia a dia": visitas (celular × PC), quem jogou e, por modo, começaram→terminaram · % de acerto. */
export default function PlaysDays({ days }: { days: DaySummary[] }) {
  const [hideEmpty, setHideEmpty] = useState(true);
  const [all, setAll] = useState(false);
  // "sem movimento" = nenhuma visita e nenhum jogo
  const moving = (d: DaySummary) => d.mobile + d.desktop + d.people + MODES.reduce((t, m) => t + d.modes[m].start + d.modes[m].done, 0) > 0;
  const list = hideEmpty ? days.filter(moving) : days;
  const shown = all ? list : list.slice(0, FIRST);
  const top = Math.max(1, ...days.map((d) => d.mobile + d.desktop));

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Dia a dia</h2>
          <p className="mt-0.5 text-xs text-muted">Cada modo: começaram → terminaram · % de acerto</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} className="size-4 accent-grape" />
          Esconder dias sem movimento
        </label>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="border-b-2 border-track text-xs text-muted">
            <tr>
              <th className={TH}>Dia</th>
              <th className={TH}>Visitas</th>
              <th className={TH}>Jogaram</th>
              {MODES.map((m) => (
                <th key={m} className={TH}>
                  {MODE_LABEL[m]}
                </th>
              ))}
              <th className={TH}>Seguir</th>
              <th className={TH}>Post</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => {
              const v = d.mobile + d.desktop;
              return (
                <tr key={d.day} className="border-b border-track last:border-0">
                  <td className={TD}>
                    <strong>#{d.day}</strong> <span className="text-muted">· {d.date}</span>
                  </td>
                  <td className={TD}>
                    <div className="flex items-center gap-3">
                      <strong className="w-8">{v}</strong>
                      {/* barra na escala do dia mais visitado; a parte escura é celular, a clara é PC */}
                      <span className="flex h-2 w-24 overflow-hidden rounded-full bg-track" aria-hidden="true">
                        <span className="bg-grape" style={{ width: `${(100 * d.mobile) / top}%` }} />
                        <span className="bg-lavender" style={{ width: `${(100 * d.desktop) / top}%` }} />
                      </span>
                      <span className="text-xs text-muted">
                        cel {d.mobile} · pc {d.desktop}
                      </span>
                    </div>
                  </td>
                  <td className={`${TD} font-bold`}>{d.people}</td>
                  {MODES.map((m) => {
                    const { start, done, won } = d.modes[m];
                    if (!start && !done) return <td key={m} className={`${TD} text-muted`}>—</td>;
                    const rate = done ? Math.round((100 * won) / done) : 0;
                    return (
                      <td key={m} className={TD}>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${rate >= 40 ? "bg-lime/50" : "bg-track"}`}>
                          {/* dias antes do contador de "começaram": só os que terminaram */}
                          {start >= done && `${start}→`}
                          {done} · {done ? `${rate}%` : "—"}
                        </span>
                      </td>
                    );
                  })}
                  <td className={TD}>{d.follow}</td>
                  <td className={TD}>{d.post}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!list.length && <p className="mt-3 text-sm text-muted">Nenhum dia com movimento nesse período.</p>}

      {list.length > FIRST && (
        <button
          type="button"
          onClick={() => setAll(!all)}
          className="mx-auto mt-4 block rounded-full border-2 border-track bg-white px-6 py-2.5 text-sm font-bold text-ink sweep-track focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
        >
          {all ? `Ver só os ${FIRST} mais recentes` : `Ver os ${list.length} dias`}
        </button>
      )}
    </>
  );
}
