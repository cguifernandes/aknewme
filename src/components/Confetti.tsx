"use client";

import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "@/components/icons";

/** Quanto tempo o confete fica na tela (os pedacinhos da canvas-confetti caem em ~3s). */
const DURATION = 3500;

/** Quanto tempo o "Acertou!" + confete ficam sozinhos antes de abrir a janela de resultado. */
const HOLD_RESULT = 2200;

/**
 * Comemoração do acerto nos jogos diários: `celebrate(endsGame)` dispara o confete; se o acerto encerra o jogo,
 * `hold` fica true por um tempo — o jogo esconde a janela de resultado enquanto isso (`result && !hold`).
 * Resultado restaurado (já tinha jogado) não passa por aqui: a janela abre na hora.
 */
export function useWinCelebration() {
  const [shot, setShot] = useState(0);
  const [hold, setHold] = useState(false);
  function celebrate(endsGame: boolean) {
    setShot((n) => n + 1);
    if (!endsGame) return;
    setHold(true);
    setTimeout(() => setHold(false), HOLD_RESULT);
  }
  return { shot, hold, celebrate };
}

/**
 * Confete do acerto (canvas-confetti) em tela cheia. Cada vez que `shot` muda (e é > 0), dispara de novo.
 * `label`: selo grande no meio ("Acertou!"); sem ele, só o confete (fim de jogo, que já tem a janela).
 */
export default function Confetti({ shot, label }: { shot: number; label?: string }) {
  const [live, setLive] = useState(0);
  useEffect(() => {
    if (!shot) return;
    setLive(shot);
    const t = setTimeout(() => setLive(0), DURATION);
    return () => clearTimeout(t);
  }, [shot]);
  return live ? <Burst key={live} label={label} /> : null;
}

/**
 * A canvas-confetti, sozinha, desenha num canvas com z-index no body, que fica ATRÁS da janela de fim de jogo
 * (<dialog> modal fica na camada do topo). Por isso o canvas é nosso, dentro de um popover="manual": aberto depois
 * da janela, fica por cima dela. pointer-events-none: não atrapalha cliques.
 */
function Burst({ label }: { label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    try {
      ref.current?.showPopover();
    } catch {} // navegador sem popover: fica fixed no fluxo normal (aparece, só não por cima da janela)
    const fire = confetti.create(canvasRef.current!, { resize: true });
    // Cores do tema (globals.css), sem hex solto
    const css = getComputedStyle(document.documentElement);
    const colors = ["grape", "lime", "blush", "sun", "lavender"].map((c) => css.getPropertyValue(`--color-${c}`).trim()).filter(Boolean);
    const base = { colors, disableForReducedMotion: true };
    // Estouro no meio + dois canhões nas laterais
    fire({ ...base, particleCount: 120, spread: 100, startVelocity: 45, origin: { x: 0.5, y: 0.55 } });
    fire({ ...base, particleCount: 70, angle: 60, spread: 60, startVelocity: 60, origin: { x: 0, y: 0.8 } });
    fire({ ...base, particleCount: 70, angle: 120, spread: 60, startVelocity: 60, origin: { x: 1, y: 0.8 } });
    return () => fire.reset();
  }, []);

  return (
    <div
      ref={ref}
      popover="manual"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0"
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      {label && (
        <span className="absolute top-[42%] left-1/2 flex -translate-1/2 animate-celebrate items-center gap-2.5 rounded-full bg-lime px-7 py-3.5 font-display text-2xl font-extrabold whitespace-nowrap text-ink shadow-pop-lg">
          <span className="flex size-8 items-center justify-center rounded-full bg-ink text-base text-lime">
            <Icon icon={faCheck} />
          </span>
          {label}
        </span>
      )}
    </div>
  );
}
