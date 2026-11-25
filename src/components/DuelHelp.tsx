"use client";

import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import { useId } from "react";
import { Icon } from "./icons";

const STEPS = [
  "Você põe seu apelido e gera o link.",
  "Seu amigo joga o mesmo desafio, sem ver as suas jogadas.",
  "No fim, os dois placares aparecem lado a lado.",
  "O link vale por 14 dias: depois disso, os placares do duelo somem.",
];

/**
 * Ícone "?" do duelo, do mesmo tamanho do "Fechar": abre o passo a passo num balão escuro.
 * Só CSS: abre com o mouse em cima ou com o foco no botão (que é o que o toque dá). Sem animação: aparece e some na hora.
 */
export default function DuelHelp({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <div className={`group/how ${className || "relative"}`}>
      <button
        type="button"
        aria-label="Como funciona o duelo"
        aria-describedby={id}
        className="flex size-8 items-center justify-center rounded-full border-2 border-track bg-white text-grape group-focus-within/how:border-ink group-focus-within/how:bg-ink group-focus-within/how:text-white group-hover/how:border-ink group-hover/how:bg-ink group-hover/how:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
      >
        <Icon icon={faQuestion} className="text-sm" />
      </button>
      <ol
        id={id}
        role="tooltip"
        className="absolute top-full right-0 z-20 mt-2 hidden w-72 max-w-[calc(100vw-4rem)] space-y-2.5 rounded-2xl bg-ink p-4 text-left shadow-pop group-focus-within/how:block group-hover/how:block"
      >
        {STEPS.map((text, i) => (
          <li key={text} className="flex items-start gap-3 text-xs leading-snug text-white">
            <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lime text-[10px] font-bold text-ink">
              {i + 1}
            </span>
            {text}
          </li>
        ))}
      </ol>
    </div>
  );
}
