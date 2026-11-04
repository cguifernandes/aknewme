"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { closeOnBackdrop } from "@/lib/dialog";
import { dailyNumber, getStreak, MODE_PATH, type GameMode } from "@/lib/game";
import { mangaFor } from "@/lib/support";
import { Emoji, EmojiText } from "./Emoji";
import { Icon } from "./icons";
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

/** Logo do X (não está no Font Awesome free-solid). */
function XLogo() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M18.9 1.2h3.7l-8 9.2L24 22.8h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2L6.5 3.3H4.3l13.3 17.3Z" />
    </svg>
  );
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
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const primaryRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const countdown = useCountdown();
  const [copied, setCopied] = useState(false);
  const [choosing, setChoosing] = useState(false); // "Compartilhar" aberto: X ou copiar/menu nativo
  const [open, setOpen] = useState(true);
  const manga = mangaFor(answer);

  function show() {
    if (!ref.current?.open) ref.current?.showModal();
    primaryRef.current?.focus(); // showModal focaria o "Fechar"; o certo é a ação principal
    setOpen(true);
  }

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
    primaryRef.current?.focus();
  }, []);

  /** Texto final: resultado + streak (gancho pra voltar) + link com nº do dia (prévia do X muda por dia) e origem. */
  function fullText(source: string) {
    const streak = getStreak();
    const fire = streak >= 2 ? `🔥 ${streak} dias seguidos\n` : "";
    return `${share}\n${fire}👉 ${location.origin}${MODE_PATH[mode]}?d=${dailyNumber()}&utm_source=${source}`;
  }

  async function shareResult() {
    const text = fullText("share");
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
            <Icon icon={faXmark} className="text-lg" />
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
              {/* momento em que a pessoa acabou de descobrir o anime: link do mangá */}
              {manga && (
                <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-semibold">
                  <Emoji e="📚" /> Ler o mangá:
                  <a
                    href={manga.amazon}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    aria-label={`${manga.name} na Amazon (abre em nova aba)`}
                    className={`rounded font-bold text-grape underline decoration-2 underline-offset-2 hover:text-grape-deep ${FOCUS}`}
                  >
                    Amazon
                  </a>
                  <span aria-hidden="true">·</span>
                  <a
                    href={manga.mercadoLivre}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    aria-label={`${manga.name} no Mercado Livre (abre em nova aba)`}
                    className={`rounded font-bold text-grape underline decoration-2 underline-offset-2 hover:text-grape-deep ${FOCUS}`}
                  >
                    Mercado Livre
                  </a>
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
              {choosing ? (
                <div className="mt-4 flex gap-3">
                  <a
                    href={`https://x.com/intent/post?text=${encodeURIComponent(fullText("x"))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${BTN} ${PRESS} inline-flex items-center justify-center gap-2 bg-x text-white hover:bg-x/85`}
                  >
                    <XLogo /> Postar no X
                  </a>
                  <button type="button" onClick={shareResult} className={BTN_PRIMARY}>
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              ) : (
                <button
                  ref={primaryRef}
                  type="button"
                  onClick={() => setChoosing(true)}
                  className={`${BTN_PRIMARY} mt-4`}
                >
                  Compartilhar resultado
                </button>
              )}
              <p aria-live="polite" className="sr-only">
                {copied ? "Resultado copiado" : ""}
              </p>
            </>
          )}

          {/* só os números; o gráfico fica na janela de estatísticas da home */}
          <div className="mt-5">
            <StatsPanel mode={mode} compact />
          </div>

          <Link
            ref={share ? undefined : primaryRef}
            href="/"
            className={`${BTN_BACK} mt-5`}
          >
            Voltar
          </Link>

          <p className="mt-4 text-sm text-muted">
            Próximo desafio em{" "}
            <strong className="font-display text-base font-extrabold text-ink tabular-nums">
              {countdown}
            </strong>
          </p>
          <Link
            href="/support"
            className={`mt-2 inline-flex items-center gap-1.5 rounded text-sm font-bold text-grape underline-offset-4 hover:underline ${FOCUS}`}
          >
            Curtiu o jogo? Apoie o aknewme <Emoji e="💜" />
          </Link>
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
