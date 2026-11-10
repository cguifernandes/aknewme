"use client";

import { faArrowRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { closeOnBackdrop } from "@/lib/dialog";
import { HL_PATH, loadHL, MEDALS } from "@/lib/higherLower";
import { Icon } from "./icons";
import VsPreview from "./VsPreview";

const SEEN_KEY = "aknewme.hl.promo";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";

const STEPS: [string, string][] = [
  ["Veja um anime", " e o número dele: episódios, ano, nota ou popularidade."],
  ["Chute", " se o próximo tem mais ou menos."],
  ["Acerte em sequência", " e ganhe medalhas. Errou, zera."],
];

/**
 * Janela de lançamento do Mais ou Menos. Abre sozinha, uma única vez por navegador, quando `when`
 * vira true — e só para quem ainda não jogou o modo. Onde aparece:
 *  - Home: logo ao chegar;
 *  - jogos diários: ao fechar o resultado (EndCard), a hora em que o desafio do dia acabou.
 */
export default function NewModeDialog({ when, delay = 700 }: { when: boolean; delay?: number }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!when) return;
    try {
      // ?promo na URL força a janela (para testar e gravar material do lançamento)
      const forced = new URLSearchParams(location.search).has("promo");
      if (!forced && (localStorage.getItem(SEEN_KEY) || loadHL().best > 0)) return;
    } catch {
      return; // sem localStorage não dá para lembrar: melhor não mostrar do que mostrar sempre
    }
    const t = setTimeout(() => {
      if (document.querySelector("dialog[open]")) return; // outra janela aberta: fica para a próxima
      ref.current?.showModal();
      ref.current?.focus(); // foco na janela, não no "Fechar": o Tab segue dali e o Enter não fecha sem querer
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {}
    }, delay);
    return () => clearTimeout(t);
  }, [when, delay]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="newmode-title"
      tabIndex={-1}
      onClick={closeOnBackdrop}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-white text-ink shadow-pop-lg outline-none backdrop:bg-ink/60"
    >
      <div className="relative flex justify-center bg-lime px-5 pt-16 pb-8">
        <span className="absolute top-4 left-4 rounded-full bg-ink px-3 py-1 text-[11px] font-bold tracking-wider text-lime uppercase">
          Novo modo
        </span>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Fechar"
          className={`absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-white text-grape transition hover:rotate-90 hover:bg-track ${FOCUS}`}
        >
          <Icon icon={faXmark} className="text-lg" />
        </button>
        <VsPreview float />
      </div>

      <div className="p-5 sm:p-6">
        <h2 id="newmode-title" className="text-center font-display text-2xl leading-tight font-extrabold sm:text-3xl">
          Chegou o Mais ou Menos!
        </h2>
        <p className="mt-1 text-center text-sm text-muted">
          Um modo infinito para quando os desafios do dia acabarem.
        </p>

        <ol className="mt-5 space-y-2.5">
          {STEPS.map(([bold, rest], i) => (
            <li
              key={i}
              style={{ animationDelay: `${150 + i * 90}ms` }}
              className="flex animate-toast-in items-center gap-3 text-sm leading-snug"
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-grape font-display font-extrabold text-white"
              >
                {i + 1}
              </span>
              <span>
                <strong>{bold}</strong>
                {rest}
              </span>
            </li>
          ))}
        </ol>

        <ul className="mt-5 flex flex-wrap justify-center gap-1.5" aria-label="Medalhas por acertos seguidos">
          {MEDALS.map((m, i) => (
            <li
              key={m.name}
              style={{ animationDelay: `${450 + i * 70}ms` }}
              className="flex animate-pop items-center gap-1.5 rounded-full bg-track py-1 pr-2.5 pl-1.5 text-xs font-bold"
            >
              <span aria-hidden="true" className={`size-4 rounded-full ${m.bg}`} />
              {m.name} <span className="font-extrabold">{m.at}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex gap-3">
          <Link
            href={HL_PATH}
            className={`group flex flex-1 items-center justify-center gap-2.5 rounded-full bg-lime py-3.5 font-bold text-ink shadow-pop sweep-white active:translate-y-0.5 active:shadow-none ${FOCUS}`}
          >
            Jogar agora
            <Icon icon={faArrowRight} className="text-[13px] transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className={`rounded-full bg-track px-6 py-3.5 font-bold text-ink sweep-lavender ${FOCUS}`}
          >
            Depois
          </button>
        </div>
      </div>
    </dialog>
  );
}
