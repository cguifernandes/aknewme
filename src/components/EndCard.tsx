"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Emoji } from "./Emoji";

type Props = {
  won: boolean;
  /** Resposta a revelar (omitida quando não faz sentido, ex.: vitória multi-rodada). */
  answer?: string;
  detail?: string;
  /** Link externo opcional (ex.: a música no Apple Music). */
  link?: { href: string; label: string };
};

/** Contagem regressiva até a meia-noite local (próximo desafio). */
function useCountdown(): string {
  const [left, setLeft] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
      const pad = (n: number) => String(n).padStart(2, "0");
      setLeft(`${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

/** Painel de fim de jogo. O modo fica travado até o desafio do dia seguinte. */
export default function EndCard({ won, answer, detail, link }: Props) {
  const backRef = useRef<HTMLAnchorElement>(null);
  const countdown = useCountdown();

  useEffect(() => {
    backRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={won ? "Você acertou" : "Fim de jogo"}
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/60"
    >
      {/* min-h-full: centraliza quando cabe e rola quando não cabe (celular deitado) */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-pop-lg sm:p-8">
          <p className="text-6xl" aria-hidden="true">
            <Emoji e={won ? "🎉" : "💔"} />
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-ink">
            {won ? "Acertou!" : "Fim de jogo"}
          </h2>
          {answer && (
            <p className="mt-3 text-[15px] text-grape-ink">
              {won ? "A resposta era mesmo" : "A resposta era"}{" "}
              <strong className="font-display text-lg font-extrabold">{answer}</strong>.
            </p>
          )}
          {detail && <p className="mt-2 text-[15px] font-semibold text-grape">{detail}</p>}
          {link && (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-bold text-grape underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
            >
              {link.label} ↗
            </a>
          )}

          <div className="mt-6 rounded-2xl bg-track px-5 py-4">
            <p className="text-sm font-semibold text-grape">Novo desafio em</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink tabular-nums">{countdown}</p>
          </div>

          <Link
            ref={backRef}
            href="/"
            className="mt-6 block w-full rounded-full bg-lime py-3.5 font-bold text-ink shadow-pop transition hover:brightness-105 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
          >
            Voltar aos modos
          </Link>
        </div>
      </div>
    </div>
  );
}
