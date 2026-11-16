import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import Truncate from "@/components/Truncate";
import { Icon } from "@/components/icons";
import { CELL, compare } from "@/lib/compare";
import type { Anime } from "@/data/animes";

/** Legenda das cores da comparação. */
export function GuessLegend() {
  return (
    <ul className="flex flex-wrap gap-1.5 text-[11px] font-bold leading-none" aria-label="Legenda">
      <li className={`rounded-full px-2.5 py-1.5 ${CELL.ok}`}>Certo</li>
      <li className={`rounded-full px-2.5 py-1.5 ${CELL.partial}`}>Parcial</li>
      <li className={`rounded-full px-2.5 py-1.5 ${CELL.no}`}>Diferente</li>
      <li className="rounded-full border border-grape/30 bg-paper px-2.5 py-1.5 text-ink">↑↓ Dica</li>
    </ul>
  );
}

/**
 * Card de um palpite errado comparado com o anime do dia: cada campo vira uma célula
 * verde (certo), amarela (parcial / ano perto), vermelha (diferente) ou neutra com a direção (↑↓). Modo Pistas.
 */
export default function GuessCard({ guess, answer, n }: { guess: Anime; answer: Anime; n: number }) {
  const cells = compare(guess, answer);
  return (
    <li className="animate-pop rounded-2xl bg-grape p-4 shadow-pop">
      <p className="flex items-center gap-2 font-bold text-white">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-paper text-xs font-extrabold text-grape" aria-hidden="true">
          {n}
        </span>
        <s className="text-lavender">{guess.title}</s>
      </p>
      <ul className={`mt-3 grid gap-2 ${cells.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        {cells.map((c) => (
          <li key={c.label} className={`min-w-0 rounded-xl px-3 py-2 ${CELL[c.state]}`}>
            <p className="text-[11px] font-semibold opacity-70">{c.label}</p>
            <Truncate text={c.value} className="text-sm font-bold" />
            <p className="mt-0.5 text-xs font-semibold whitespace-nowrap">
              {c.state === "ok" && <Icon icon={faCheck} className="mr-1" />}
              {c.state === "no" && <Icon icon={faXmark} className="mr-1" />}
              {c.note}
            </p>
          </li>
        ))}
      </ul>
    </li>
  );
}
