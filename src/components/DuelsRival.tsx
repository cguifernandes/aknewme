"use client";

import { initials, outcome, type DuelRecord, type Rival } from "@/lib/challenge";
import { dailyAnimes } from "@/lib/game";
import { DuelAccordion, short, when } from "./DuelResult";

// Lado direito da janela "Duelos" com um rival aberto e cada duelo da lista (saiu de DuelsDialog.tsx pelo limite de
// 500 linhas por arquivo).

export const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
export const TONES = ["bg-sun", "bg-blush", "bg-lavender", "bg-lime"];
/** Cor do avatar pelo apelido: a mesma pessoa tem sempre a mesma cor. */
export const tone = (nick: string) =>
  TONES[[...nick].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];

export const first = (nick: string) => nick.split(" ")[0];
/** Quem vai melhor contra quem ("Você lidera", "Empatados", "Ana lidera"). */
export const lead = (r: Rival) =>
  r.wins > r.losses
    ? "Você lidera"
    : r.wins < r.losses
      ? `${first(r.nick)} lidera`
      : "Empatados";

/** Lado direito com um rival aberto: quem lidera, o placar grande, os duelos um a um e "Desafiar de novo". */
export function RivalView({
  rival: r,
  today,
  onChallenge,
}: {
  rival: Rival;
  today: number;
  onChallenge: () => void;
}) {
  const title =
    r.wins > r.losses
      ? "Você está na frente"
      : r.wins < r.losses
        ? `${first(r.nick)} está na frente`
        : "Vocês estão empatados";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 pr-10">
        <span
          aria-hidden="true"
          className={`flex size-12 shrink-0 items-center justify-center rounded-full font-extrabold text-ink ${tone(r.nick)}`}
        >
          {initials(r.nick)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold tracking-wider text-muted uppercase">
            Você x {r.nick}
          </p>
          <h2
            id="duels-title"
            className="font-display text-2xl leading-tight font-extrabold sm:text-3xl"
          >
            {title}
          </h2>
        </div>
      </div>

      {/* três colunas fixas (lados iguais, "x" no meio): trocar de rival com nome curto ou longo não mexe no placar */}
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)] items-center rounded-2xl bg-track px-4 py-4">
        {/* nome em cima e número embaixo, centralizados um com o outro */}
        <p className="flex min-w-0 flex-col items-center">
          <span className="text-xs font-bold text-muted">Você</span>
          <span className="font-display text-5xl leading-none font-extrabold">
            {r.wins}
          </span>
        </p>
        {/* o "x" no meio; os empates, quando há, logo embaixo dele */}
        <span className="flex flex-col items-center">
          <span
            aria-hidden="true"
            className="font-display text-lg font-extrabold text-lavender"
          >
            x
          </span>
          {r.ties > 0 && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-muted">
              {r.ties} {r.ties === 1 ? "empate" : "empates"}
            </span>
          )}
        </span>
        <p className="flex min-w-0 flex-col items-center">
          <span className="max-w-full truncate text-xs font-bold text-muted">
            {first(r.nick)}
          </span>
          <span className="font-display text-5xl leading-none font-extrabold">
            {r.losses}
          </span>
        </p>
      </div>

      <p className="mt-5 text-[11px] font-bold tracking-wider text-muted uppercase">
        Duelos
      </p>
      {/* cada duelo abre (um por vez) o "Rodada a rodada" do fim de jogo */}
      <ul className="mt-2 space-y-2">
        {r.duels.map((d) => (
          <DuelRow key={`${d.mode}:${d.day}`} d={d} rival={r} today={today} />
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={onChallenge}
          className={`w-full truncate rounded-full bg-grape px-4 py-3 text-sm font-bold text-white shadow-pop sweep-ink active:translate-y-0.5 ${FOCUS}`}
        >
          Desafiar {first(r.nick)} de novo
        </button>
      </div>
    </div>
  );
}

/** Um duelo da lista: a linha (modo, quando, placar, desfecho) e, aberta, o resultado completo (DuelResult). */
export function DuelRow({ d, rival: r, today }: { d: DuelRecord; rival: Rival; today: number }) {
  // duelo guardado antes de as jogadas serem salvas: só a linha, sem abrir
  const rounds = d.me && d.them ? { mine: { tiles: d.me }, rival: { nick: r.nick, tiles: d.them }, animes: dailyAnimes(d.mode, d.day) } : null;
  return (
    <DuelAccordion
      name="duel"
      mode={d.mode}
      day={d.day}
      sub={when(d, today)}
      me={d.me ? short(d.mode, d.me, !!d.mw) : null}
      them={d.them ? short(d.mode, d.them, !!d.tw) : null}
      outcome={d.outcome}
      rounds={rounds}
    />
  );
}
