"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { closeOnBackdrop } from "@/lib/dialog";
import { MODE_PATH, type GameMode } from "@/lib/game";
import { Emoji, EmojiText } from "./Emoji";
import StatsPanel from "./StatsPanel";

type Props = {
  mode: GameMode;
  won: boolean;
  /** Resposta a revelar (omitida quando não faz sentido, ex.: vitória multi-rodada). */
  answer?: string;
  /** Uma linha: fica junto da resposta, ou sozinha abaixo do título */
  detail?: string;
  /** Texto de compartilhar (desafio do dia), sem o link */
  share?: string;
  /** Só os quadradinhos, mostrados como prévia */
  grid?: string;
  /** Presente = modo treino: troca estatísticas/contagem por "Jogar de novo" */
  onRestart?: () => void;
};

/** Contagem regressiva até a meia-noite local (próximo desafio). */
function useCountdown(): string {
  const [left, setLeft] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const s = Math.max(
        0,
        Math.floor((midnight.getTime() - now.getTime()) / 1000),
      );
      const pad = (n: number) => String(n).padStart(2, "0");
      setLeft(
        `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const BTN = `block w-full rounded-full py-3.5 font-bold transition ${FOCUS}`;
const PRESS = "shadow-pop active:translate-y-0.5 active:shadow-none";
const BTN_PRIMARY = `${BTN} ${PRESS} bg-lime text-ink hover:brightness-105`;
const BTN_BACK = `${BTN} ${PRESS} bg-track text-ink hover:brightness-95`;

/**
 * Janela de fim de jogo (<dialog> nativo: foco preso, Esc e clique fora fecham).
 * Fechada, vira o botão "Ver resultado" — o jogo por trás fica travado.
 */
export default function EndCard({
  mode,
  won,
  answer,
  detail,
  share,
  grid,
  onRestart,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const primaryRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const countdown = useCountdown();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(true);
  const practice = !!onRestart;

  function show() {
    if (!ref.current?.open) ref.current?.showModal();
    primaryRef.current?.focus(); // showModal focaria o "Fechar"; o certo é a ação principal
    setOpen(true);
  }

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
    primaryRef.current?.focus();
  }, []);

  async function shareResult() {
    const text = `${share}\n👉 ${location.origin}${MODE_PATH[mode]}`;
    try {
      // celular: menu nativo de compartilhar · computador: copia
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // usuário cancelou o compartilhamento — nada a fazer
    }
  }

  return (
    <>
      <dialog
        ref={ref}
        aria-labelledby="end-title"
        onClose={() => setOpen(false)}
        onClick={closeOnBackdrop}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(27rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-white text-ink shadow-pop-lg backdrop:bg-ink/60"
      >
        <div className="relative p-6 text-center sm:p-8">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Fechar"
            className={`absolute top-3 right-3 flex size-10 items-center justify-center rounded-full text-grape transition hover:bg-track ${FOCUS}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M2 2l10 10M12 2 2 12" />
            </svg>
          </button>

          <p className="text-5xl" aria-hidden="true">
            <Emoji e={won ? "🎉" : "💔"} />
          </p>
          <h2
            id="end-title"
            className="mt-2 font-display text-3xl font-extrabold"
          >
            {won ? "Acertou!" : "Fim de jogo"}
          </h2>

          {answer ? (
            <div className="mt-5 rounded-2xl bg-track px-5 py-4">
              <p className="text-xs font-bold tracking-wider text-muted uppercase">
                A resposta era
              </p>
              <p className="mt-1 font-display text-2xl leading-tight font-extrabold">
                {answer}
              </p>
              {detail && (
                <p className="mt-1.5 text-sm font-semibold text-grape">
                  {detail}
                </p>
              )}
            </div>
          ) : (
            detail && (
              <p className="mt-2 text-[15px] font-semibold text-grape">
                {detail}
              </p>
            )
          )}

          {practice ? (
            <div className="mt-6 space-y-3">
              <button
                ref={primaryRef}
                type="button"
                onClick={onRestart}
                className={BTN_PRIMARY}
              >
                Jogar de novo
              </button>
              <Link href="/" className={BTN_BACK}>
                Voltar
              </Link>
            </div>
          ) : (
            <>
              {share && (
                <>
                  {/* prévia dos quadradinhos que vão no compartilhamento */}
                  {grid && (
                    <p
                      className="mt-5 text-xl leading-snug tracking-wider whitespace-pre-line"
                      aria-hidden="true"
                    >
                      <EmojiText text={grid} />
                    </p>
                  )}
                  <button
                    ref={primaryRef}
                    type="button"
                    onClick={shareResult}
                    className={`${BTN_PRIMARY} mt-4`}
                  >
                    {copied
                      ? "Copiado! Cole onde quiser"
                      : "Compartilhar resultado"}
                  </button>
                  <p aria-live="polite" className="sr-only">
                    {copied ? "Resultado copiado" : ""}
                  </p>
                </>
              )}

              {/* só os números; o gráfico fica na janela de estatísticas da home */}
              <div className="mt-5">
                <StatsPanel mode={mode} compact />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link
                  href={`${MODE_PATH[mode]}/practice`}
                  className={`${BTN} ${PRESS} bg-grape text-white hover:brightness-110`}
                >
                  Treinar
                </Link>
                <Link
                  ref={share ? undefined : primaryRef}
                  href="/"
                  className={BTN_BACK}
                >
                  Voltar
                </Link>
              </div>

              <p className="mt-4 text-sm text-muted">
                Próximo desafio em{" "}
                <strong className="font-display text-base font-extrabold text-ink tabular-nums">
                  {countdown}
                </strong>
              </p>
            </>
          )}
        </div>
      </dialog>

      {!open && (
        <button
          type="button"
          onClick={show}
          className={`fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full bg-lime px-7 py-3.5 font-bold text-ink hover:brightness-105 ${PRESS} ${FOCUS}`}
        >
          Ver resultado
        </button>
      )}
    </>
  );
}
