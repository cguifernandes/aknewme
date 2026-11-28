"use client";

import { useRef, useState, type ReactNode } from "react";
import { loadHistory, MODE_LABEL, type GameMode } from "@/lib/game";
import StatsBoard from "./StatsBoard";
import StatsCompact from "./StatsCompact";

const MODES: GameMode[] = ["emoji", "opening", "pistas"];

/**
 * Estatísticas com uma aba por modo: o título, as abas (Emoji, Opening, Pistas) e o painel do modo escolhido
 * (StatsBoard). É o mesmo conteúdo no diálogo "Estatísticas" (sem conta) e no cartão "Estatísticas" da janela Meu
 * perfil (com conta; specs/login-duelo/09-menu-perfil.md). Lê o localStorage ao montar: monte só com a janela aberta.
 * `id`: prefixo dos ids (as duas janelas podem estar na mesma página). `title`: o título, à esquerda das abas.
 * `trailing`: o que vem depois das abas (o botão de fechar do diálogo). `compact`: abas menores e o painel resumido
 * (StatsCompact), para o cartão do perfil ao lado da Conta (09-menu-perfil.md, "Estatísticas compactas no perfil").
 */
export default function StatsTabs({ id, title, trailing, compact = false }: { id: string; title: ReactNode; trailing?: ReactNode; compact?: boolean }) {
  const tabsRef = useRef<HTMLDivElement>(null);
  // abre no primeiro modo que já tem jogos (ou Emoji)
  const [tab, setTab] = useState<GameMode>(() => MODES.find((m) => loadHistory(m).length) ?? "emoji");

  // Setas ←/→ trocam de aba (padrão de acessibilidade para tabs)
  function onTabKey(e: React.KeyboardEvent) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = MODES[(MODES.indexOf(tab) + step + MODES.length) % MODES.length];
    setTab(next);
    tabsRef.current?.querySelector<HTMLButtonElement>(`#${id}-tab-${next}`)?.focus();
  }

  return (
    <>
      {/* título · abas · (fechar) numa linha; no celular as abas descem para a linha de baixo */}
      <div className={`flex flex-wrap items-center gap-x-3 ${compact ? "gap-y-3" : "gap-y-4"}`}>
        <div className="min-w-0 flex-1">{title}</div>
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Modo de jogo"
          onKeyDown={onTabKey}
          // p-1.5: a sombra de 5px da aba escolhida cabe dentro do trilho
          className={`grid grid-cols-3 gap-1 rounded-full bg-track max-sm:order-last max-sm:w-full ${compact ? "p-1" : "p-1.5"}`}
        >
          {MODES.map((m) => (
            <button
              key={m}
              id={`${id}-tab-${m}`}
              type="button"
              role="tab"
              aria-selected={tab === m}
              aria-controls={`${id}-panel`}
              tabIndex={tab === m ? 0 : -1}
              onClick={() => setTab(m)}
              // hover simples (sem sweep): a aba não escolhida ganha fundo lavender numa transição curta; a escolhida não muda.
              // A escolhida não tem transição: já aparece selecionada ao abrir. Foco de teclado: contorno grape.
              className={`rounded-full font-bold focus-visible:outline-2 ${compact ? "px-3.5 py-1 text-xs" : "px-5 py-2 text-sm"} focus-visible:outline-offset-2 focus-visible:outline-grape ${
                tab === m ? "bg-grape text-white" : "text-grape transition-colors duration-150 hover:bg-lavender/70"
              }`}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
        {trailing}
      </div>

      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${tab}`} className={compact ? "mt-4" : "mt-6"}>
        {compact ? <StatsCompact key={tab} mode={tab} /> : <StatsBoard key={tab} mode={tab} />}
      </div>
    </>
  );
}
