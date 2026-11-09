"use client";

import Link from "next/link";
import { faArrowRight, faXmark } from "@fortawesome/free-solid-svg-icons";
import { MODE_LABEL, type DailyResult, type GameMode } from "@/lib/game";
import { CheckIcon, Icon } from "./icons";
import ResultTiles, { splitGrid } from "./ResultTiles";

/** Legenda acima do título no card jogado: como foi o acerto. */
function caption(mode: GameMode, r: DailyResult, tried: number): string {
  if (!r.won) return "Não foi dessa vez — era";
  if (mode === "emoji") return "Acertou";
  if (mode === "opening") return `Acertou na ${tried}ª tentativa`;
  return `Acertou com ${tried} ${tried === 1 ? "pista" : "pistas"}`;
}

/** Card de um modo na Home. Jogado hoje, a prévia dá lugar ao resultado: anime, quadradinhos e pontos. */
export default function ModeCard({
  mode,
  href,
  badge,
  description,
  preview,
  result,
}: {
  mode: GameMode;
  href: string;
  badge: string;
  description: string;
  preview: React.ReactNode;
  /** null = ainda não jogou hoje */
  result: DailyResult | null;
}) {
  const title = MODE_LABEL[mode];
  const won = result?.won;
  const { tiles, tried } = splitGrid(result?.grid);
  // Emoji ganho não guarda um anime (são 5 rodadas): vira "N de 5 animes".
  const answer = result && (result.answer ?? `${result.score ?? 0} de 5 animes`);
  return (
    // O card inteiro é o link: hover em qualquer parte dispara as transições.
    <Link
      href={href}
      aria-label={
        result
          ? `Modo ${title}: feito hoje (${won ? "acertou" : "errou"}), ver resultado`
          : `Jogar modo ${title}`
      }
      className="group flex flex-col rounded-[28px] bg-grape p-4 pb-5 shadow-pop transition duration-300 ease-out hover:-translate-y-2 hover:shadow-pop-lg active:translate-y-0 active:duration-75 focus-visible:-translate-y-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-grape"
    >
      {/* prévia sempre branca; jogado, um véu pastel por cima: verde ganhou, rosa perdeu */}
      <div className="relative flex min-h-[clamp(7.5rem,16vh,11rem)] flex-col rounded-2xl bg-white p-4 shadow-pop">
        {result && (
          <span aria-hidden="true" className={`absolute inset-0 rounded-2xl ${won ? "bg-lime/40" : "bg-blush/35"}`} />
        )}
        <span className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
          {result && (won ? <CheckIcon /> : <Icon icon={faXmark} />)}
          {result ? (won ? "Acertou hoje" : "Jogado hoje") : badge}
        </span>
        {result ? (
          <div className="relative mt-auto pt-8">
            <p className="text-xs font-semibold text-ink/70">{caption(mode, result, tried)}</p>
            <p className="truncate font-display text-2xl leading-tight font-extrabold text-ink">{answer}</p>
            {tiles.length > 0 && (
              <ResultTiles tiles={tiles} size="size-6 rounded-md text-xs" hoverClass="group-hover:animate-pop group-focus-visible:animate-pop" className="mt-2 gap-1.5" />
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center pt-6">{preview}</div>
        )}
      </div>
      <div className="mt-[clamp(0.75rem,2vh,1.25rem)] flex items-baseline justify-between px-2">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-white">{title}</h2>
        {result && mode !== "opening" && (
          <span className={`font-display text-xl font-extrabold ${won ? "text-lime" : "text-lavender/60"}`}>
            {won ? `+${result.score ?? 0}` : "0"}
          </span>
        )}
      </div>
      <p className="mt-2 min-h-[2lh] flex-1 px-2 text-[15px] leading-relaxed text-lavender short:mt-1 short:leading-snug">
        {result?.detail ?? description}
      </p>
      {/* "botão" visual — o clique é do card inteiro */}
      <span
        className={`relative mt-[clamp(0.75rem,2.5vh,1.5rem)] flex items-center justify-center overflow-hidden rounded-full py-3.5 font-bold text-ink transition duration-300 ease-out short:py-3 group-active:translate-y-0.5 group-active:duration-75 ${
          won ? "bg-lime" : "bg-white"
        }`}
      >
        {/* preenchimento que varre da esquerda para a direita */}
        <span
          aria-hidden="true"
          className={`absolute inset-0 -translate-x-full rounded-full transition-transform duration-500 ease-out group-hover:translate-x-0 group-focus-visible:translate-x-0 ${
            won ? "bg-white" : "bg-lime"
          }`}
        />
        {won && (
          <span className="relative mr-2 flex">
            <CheckIcon />
          </span>
        )}
        <span className="relative">{result ? "Ver resultado" : "Jogar"}</span>
        {/* seta que desliza para dentro */}
        <span
          aria-hidden="true"
          className="relative flex w-0 justify-center overflow-hidden opacity-0 transition-[width,margin,opacity] duration-300 ease-out group-hover:ml-2 group-hover:w-4 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:w-4 group-focus-visible:opacity-100"
        >
          <Icon icon={faArrowRight} className="text-[13px]" />
        </span>
      </span>
    </Link>
  );
}
