"use client";

import { faChartSimple } from "@fortawesome/free-solid-svg-icons";
import { useRef, useState } from "react";
import { closeOnBackdrop } from "@/lib/dialog";
import { loadHistory, MODE_LABEL, type GameMode } from "@/lib/game";
import CloseButton from "./CloseButton";
import { Icon } from "./icons";
import StatsBoard from "./StatsBoard";

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
        title="Estatísticas"
        className="flex size-10 items-center justify-center rounded-full bg-grape-deep text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
      >
        <Icon icon={faChartSimple} className="text-base" />
      </button>

      <dialog
        ref={ref}
        aria-labelledby="stats-title"
        onClose={() => setOpen(false)}
        onClick={closeOnBackdrop}
        className="m-auto max-h-[90dvh] w-[min(46rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-white p-6 text-ink shadow-pop-lg backdrop:bg-ink/60 sm:p-7"
      >
        {/* título · abas · fechar numa linha; no celular as abas descem para a linha de baixo */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-4">
          <h2 id="stats-title" className="flex-1 font-display text-3xl font-extrabold">
            Estatísticas
          </h2>
          <div
            ref={tabsRef}
            role="tablist"
            aria-label="Modo de jogo"
            onKeyDown={onTabKey}
            // p-1.5: a sombra de 5px da aba escolhida cabe dentro do trilho
            className="grid grid-cols-3 gap-1 rounded-full bg-track p-1.5 max-sm:order-last max-sm:w-full"
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
                className={`rounded-full px-5 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape ${
                  tab === m ? "bg-grape text-white" : "text-grape sweep-lavender"
                }`}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>
          <CloseButton onClick={() => ref.current?.close()} />
        </div>


        <div id="stats-panel" role="tabpanel" aria-labelledby={`stats-tab-${tab}`} className="mt-6">
          {open && <StatsBoard key={tab} mode={tab} />}
        </div>
      </dialog>
    </>
  );
}
