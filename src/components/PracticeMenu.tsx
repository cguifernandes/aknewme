"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { MODE_LABEL, MODE_PATH, type GameMode } from "@/lib/game";

const MODES: GameMode[] = ["emoji", "opening", "pistas"];

/** Botão "Treinar" com a lista dos modos de treino. Fecha ao clicar fora, com Esc ou ao escolher. */
export default function PracticeMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      {/* No celular vira só o ícone (o texto fica para leitores de tela) */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="flex size-12 items-center justify-center gap-2 rounded-full bg-grape-deep text-[15px] font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape sm:w-auto sm:px-5"
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          {/* halter */}
          <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
        </svg>
        <span className="max-sm:sr-only">Treinar</span>
      </button>

      {open && (
        <div id={menuId} className="absolute top-full right-0 z-20 mt-2 w-64 rounded-2xl bg-white p-2 text-left shadow-pop-lg">
          <p className="px-3 pt-2 pb-2 text-xs font-semibold text-muted">Partidas sem limite · não contam no desafio do dia</p>
          <ul>
            {MODES.map((m) => (
              <li key={m}>
                <Link
                  href={`${MODE_PATH[m]}/practice`}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 font-bold text-ink transition hover:bg-track focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
                >
                  Modo {MODE_LABEL[m]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
