"use client";

import { useRef, useState } from "react";
import { closeOnBackdrop } from "@/lib/dialog";
import { loadHistory, MODE_LABEL, type GameMode } from "@/lib/game";
import StatsPanel from "./StatsPanel";

const MODES: GameMode[] = ["emoji", "opening", "pistas"];

/** Botão + janela de estatísticas com uma aba por modo. Usa <dialog> nativo (foco preso, Esc fecha). */
export default function StatsDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false); // o painel só monta aberto (lê o localStorage)
  const [tab, setTab] = useState<GameMode>("emoji");

  function show() {
    // abre no primeiro modo que já tem jogos (ou Emoji)
    setTab(MODES.find((m) => loadHistory(m).length) ?? "emoji");
    setOpen(true);
    ref.current?.showModal();
  }

  // Setas ←/→ trocam de aba (padrão de acessibilidade para tabs)
  function onTabKey(e: React.KeyboardEvent) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = MODES[(MODES.indexOf(tab) + step + MODES.length) % MODES.length];
    setTab(next);
    tabsRef.current?.querySelector<HTMLButtonElement>(`#stats-tab-${next}`)?.focus();
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="Estatísticas"
        className="flex size-12 items-center justify-center rounded-full bg-grape-deep text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
      >
        <svg width="20" height="20" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
          <rect x="1" y="9" width="4" height="8" rx="1.5" />
          <rect x="7" y="4" width="4" height="13" rx="1.5" />
          <rect x="13" y="1" width="4" height="16" rx="1.5" />
        </svg>
      </button>

      <dialog
        ref={ref}
        aria-labelledby="stats-title"
        onClose={() => setOpen(false)}
        onClick={closeOnBackdrop}
        className="m-auto max-h-[90dvh] w-[min(26rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-white p-6 text-ink shadow-pop-lg backdrop:bg-ink/60 sm:p-7"
      >
        <div className="flex items-center justify-between">
          <h2 id="stats-title" className="font-display text-3xl font-extrabold">
            Estatísticas
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Fechar"
            className="flex size-10 items-center justify-center rounded-full text-grape transition hover:bg-track focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M2 2l10 10M12 2 2 12" />
            </svg>
          </button>
        </div>

        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Modo de jogo"
          onKeyDown={onTabKey}
          className="mt-5 grid grid-cols-3 gap-1 rounded-full bg-track p-1"
        >
          {MODES.map((m) => (
            <button
              key={m}
              id={`stats-tab-${m}`}
              type="button"
              role="tab"
              aria-selected={tab === m}
              aria-controls="stats-panel"
              tabIndex={tab === m ? 0 : -1}
              onClick={() => setTab(m)}
              // sem transition: a aba certa já aparece selecionada ao abrir (sem "deslizar" da anterior)
              className={`rounded-full py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape ${
                tab === m ? "bg-grape text-white" : "text-grape hover:bg-white/70"
              }`}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>

        <div id="stats-panel" role="tabpanel" aria-labelledby={`stats-tab-${tab}`} className="mt-6">
          {open && <StatsPanel key={tab} mode={tab} />}
        </div>
      </dialog>
    </>
  );
}
