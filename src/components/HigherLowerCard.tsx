"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HL_PATH, loadHL } from "@/lib/higherLower";
import { Icon } from "./icons";
import VsPreview from "./VsPreview";

/** Card do Mais ou Menos na Home (largo, em lime): prévia, chamada e o recorde do jogador. */
export default function HigherLowerCard() {
  // null = ainda lendo o localStorage: a linha do recorde fica invisível (ocupando o lugar) em vez de trocar de texto
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => setBest(loadHL().best), []);

  return (
    // O card inteiro é o link, como os cards dos modos diários.
    <Link
      href={HL_PATH}
      aria-label="Jogar Mais ou Menos, modo infinito"
      className="group flex flex-col items-center gap-5 rounded-[28px] bg-lime p-5 shadow-pop transition duration-300 ease-out hover:-translate-y-2 hover:shadow-pop-lg active:translate-y-0 active:duration-75 focus-visible:-translate-y-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-grape sm:flex-row sm:gap-6 sm:px-7 lg:col-span-2"
    >
      <VsPreview />
      <div className="min-w-0 flex-1 max-sm:text-center">
        <h2 className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-3xl font-extrabold tracking-tight text-ink max-sm:justify-center">
          Mais ou Menos
          <span className="rounded-full bg-ink px-3 py-1 font-sans text-[11px] font-bold tracking-wider text-lime uppercase">
            Novo · infinito
          </span>
        </h2>
        <p className="mt-1 text-[15px] leading-snug text-ink">
          Mais episódios? Estreou antes? Nota maior? Vá até errar.
        </p>
        <p className={`mt-1.5 text-sm text-ink/80 transition-opacity duration-300 ${best === null ? "opacity-0" : ""}`}>
          {best ? (
            <>
              Seu recorde: <strong className="text-ink">{best} {best === 1 ? "seguido" : "seguidos"}</strong>
            </>
          ) : (
            "Quantos você acerta em sequência?"
          )}
        </p>
      </div>
      {/* "botão" visual — o clique é do card inteiro */}
      <span className="relative flex shrink-0 items-center justify-center gap-2.5 overflow-hidden rounded-full bg-ink px-6 py-3.5 font-bold text-white transition duration-300 group-active:translate-y-0.5 group-active:duration-75 max-sm:w-full">
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full rounded-full bg-grape transition-transform duration-500 ease-out group-hover:translate-x-0 group-focus-visible:translate-x-0"
        />
        <span className="relative">Jogar agora</span>
        <Icon
          icon={faArrowRight}
          className="relative text-[13px] transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1"
        />
      </span>
    </Link>
  );
}
