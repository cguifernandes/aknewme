"use client";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useId, useRef, useState } from "react";
import { dailyNumber, EPOCH_UTC, getDailyResult, getStreak, MODE_LABEL, playedSeed, type GameMode } from "@/lib/game";
import { loadPlayed, msToBrasiliaMidnight, weekDays } from "@/lib/streak";
import { Icon } from "../icons";
import { Tile } from "../ResultTiles";

const WEEK = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
/** O estado de cada dia da semana, como o leitor de tela fala. */
const STATE_LABEL = { played: "jogado", today: "hoje", upcoming: "ainda não", missed: "perdido" } as const;
const days = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
};

/**
 * Streak in the home header (specs/cabecalho): lime circle with the number (check in the corner once today's challenge
 * is played) and, on desktop, "day streak" / "done today" | "play today". Hovering it (mouse) or tapping it opens the
 * "Your streak" panel (specs/cabecalho/02-sequencia.md): best streak, this week's played days, a countdown to the next
 * challenge (midnight in Brasília) and one sign-in invite. Closes on mouse leave, Escape or a click outside.
 */
export default function StreakBadge() {
  const [streak, setStreak] = useState(0);
  /** Já leu o navegador? Até lá não mostra nada (evita piscar "0" antes do número de verdade). */
  const [ready, setReady] = useState(false);
  const [doneToday, setDoneToday] = useState(false);
  const [played, setPlayed] = useState<{ days: number[]; best: number }>({ days: [], best: 0 });
  const [today, setToday] = useState(0);
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    setStreak(getStreak());
    setDoneToday((Object.keys(MODE_LABEL) as GameMode[]).some((m) => getDailyResult(m)));
    setPlayed(loadPlayed(playedSeed()));
    setToday(dailyNumber());
    setReady(true);
  }, []);

  // Countdown to the next challenge, only while the panel is open and today is done
  useEffect(() => {
    if (!open || !doneToday) return;
    const tick = () => setLeft(msToBrasiliaMidnight());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [open, doneToday]);

  // Escape closes (focus back to the badge); a click or tap outside closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // Com sequência 0 o selo continua na home ("0 · Jogue hoje"): antes ele sumia, e quem não jogou ontem (ou abriu o
  // site num navegador sem histórico) achava que o selo tinha quebrado (09-menu-perfil.md, quarta rodada).
  if (!ready) return null;
  const status = doneToday ? "Hoje já foi" : "Jogue hoje";
  const inARow = streak === 1 ? "dia seguido" : "dias seguidos";
  const InARow = inARow[0].toUpperCase() + inARow.slice(1); // rótulo do cabeçalho com maiúscula inicial
  const playedSet = new Set(played.days);
  const best = Math.max(played.best, streak);

  return (
    <div
      ref={wrap}
      className="relative"
      // hover opens only for a mouse; on touch the tap (click) toggles
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape sm:bg-grape sm:pr-4 sm:pl-1.5"
      >
        <span className="sr-only">{`Sequência: ${streak} ${inARow}, ${status.toLowerCase()}. Ver sua sequência`}</span>
        <span aria-hidden="true" className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-lime font-display text-base font-extrabold text-ink sm:size-7 sm:text-sm">
          {streak}
          {doneToday && (
            <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border-2 border-paper bg-ink text-lime">
              <Icon icon={faCheck} className="text-[8px]" />
            </span>
          )}
        </span>
        {/* selo grape (02-sequencia.md, seção 6): branco 8,0:1 e lavender 5,5:1 sobre o grape; as duas linhas coladas.
            Bolinha de 28 px na pílula de 40 px: 6 px em cima, embaixo e à esquerda (09-menu-perfil.md, segunda rodada).
            No celular fica só a bolinha, maior (36 px), para o toque. */}
        <span aria-hidden="true" className="text-left whitespace-nowrap max-sm:hidden">
          <span className="block text-sm leading-4 font-bold text-white">{InARow}</span>
          <span className="block text-xs leading-3.5 font-semibold text-lavender">{status}</span>
        </span>
      </button>

      {open && (
        // pt-2 keeps the pointer inside while it moves from the badge to the panel (no gap that would close it)
        <div className="absolute top-full left-1/2 z-50 -translate-x-1/2 pt-2 max-sm:fixed max-sm:inset-x-4 max-sm:top-[4.25rem] max-sm:translate-x-0">
          <div
            id={id}
            role="dialog"
            aria-label="Sua sequência"
            // fundo branco, texto ink e link grape (02-sequencia.md, seção 5); sem título: começa no número
            className="w-80 origin-top animate-menu-in rounded-3xl border-2 border-mist bg-paper p-5 text-ink shadow-pop-lg max-sm:w-full"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-baseline gap-2">
                <span className="font-display text-5xl leading-none font-extrabold">{streak}</span>
                <span className="text-base font-bold">{inARow}</span>
              </p>
              <p className="text-right text-xs font-semibold text-muted">
                Recorde
                <span className="block font-display text-xl leading-tight font-extrabold text-ink">
                  {days(best)}
                </span>
              </p>
            </div>

            <ol className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Esta semana">
              {weekDays(today, EPOCH_UTC).map((day, i) => {
                const done = playedSet.has(day) || (day === today && doneToday);
                const state = done ? "played" : day === today ? "today" : day > today ? "upcoming" : "missed";
                // dia jogado = o quadradinho de acerto dos resultados (Tile 🟩: lime com o check do projeto)
                const box =
                  state === "today" ? "border-2 border-ink" : state === "upcoming" ? "border-2 border-dashed border-lavender" : "bg-track";
                return (
                  <li key={day} className="flex flex-col items-center gap-1">
                    {state === "played" ? (
                      <Tile t="🟩" className={`aspect-square w-full rounded-xl text-sm ${day === today ? "ring-2 ring-ink" : ""}`} />
                    ) : (
                      <span aria-hidden="true" className={`aspect-square w-full rounded-xl ${box}`} />
                    )}
                    <span className="text-xs font-semibold text-muted">
                      {WEEK[i]}
                      <span className="sr-only">: {STATE_LABEL[state]}</span>
                    </span>
                  </li>
                );
              })}
            </ol>

            {/* com sequência 0 e sem jogar hoje não há o que dizer: a caixa não aparece (02-sequencia.md, seção 7) */}
            {(doneToday || streak > 0) && (
            <p className="mt-4 rounded-2xl bg-track p-3 text-sm leading-snug" aria-live="off">
              {doneToday ? (
                <>
                  Você já jogou hoje. Volte amanhã e chegue a <strong>{days(streak + 1)}</strong>. Próximo desafio em{" "}
                  <strong className="tabular-nums">{clock(left)}</strong>.
                </>
              ) : (
                <>Jogue o desafio de hoje para manter sua sequência de {days(streak)}.</>
              )}
            </p>
            )}

            {/* sem convite de login: a sequência fica só no navegador, com ou sem conta (02-sequencia.md, decisão de 27/11) */}
          </div>
        </div>
      )}
    </div>
  );
}
