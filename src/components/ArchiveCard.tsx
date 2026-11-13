"use client";

import { useEffect, useState } from "react";
import { dailyNumber, EPOCH_UTC, MODE_LABEL, playedDays, type GameMode } from "@/lib/game";
import GameCard from "./GameCard";

const MODES = Object.keys(MODE_LABEL) as GameMode[];
const DAYS = 7;

const weekday = (day: number) =>
  new Date(EPOCH_UTC + (day - 1) * 86_400_000).toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "short" }).replace(".", "");

/** Leque de folhinhas, da mais antiga (esquerda) a ontem (direita, por cima); no hover abre mais. */
const FAN = [
  "-translate-x-6 -rotate-10 group-hover:-translate-x-8 group-hover:-rotate-15 group-focus-visible:-translate-x-8 group-focus-visible:-rotate-15",
  "-translate-x-2 -rotate-3 group-hover:-translate-x-3 group-hover:-rotate-5 group-focus-visible:-translate-x-3 group-focus-visible:-rotate-5",
  "translate-x-2 rotate-3 group-hover:translate-x-3 group-hover:rotate-5 group-focus-visible:translate-x-3 group-focus-visible:rotate-5",
  "translate-x-6 rotate-10 group-hover:translate-x-8 group-hover:rotate-15 group-focus-visible:translate-x-8 group-focus-visible:rotate-15",
];

/** Card "Desafios anteriores" na seção "Mais jogos" da Home: leque de folhinhas dos últimos dias. Leva ao arquivo. */
export default function ArchiveCard() {
  // null enquanto lê data e localStorage: o leque e a linha em lime ficam invisíveis, ocupando o lugar.
  const [state, setState] = useState<{ yesterday: number; pending: number } | null>(null);
  useEffect(() => {
    const today = dailyNumber();
    const played = MODES.map(playedDays);
    const count = Math.min(DAYS, today - 1);
    // dia pendente = nenhum modo jogado nele
    const days = Array.from({ length: count }, (_, i) => today - 1 - i);
    setState({ yesterday: today - 1, pending: days.filter((d) => played.every((p) => p[d] === undefined)).length });
  }, []);

  const y = state?.yesterday ?? 0;
  const badge = !state ? "" : state.pending ? `${state.pending} para jogar` : "Tudo em dia";

  return (
    <GameCard
      href="/archive"
      label={`Desafios anteriores. ${badge}`}
      badge={badge}
      title="Desafios anteriores"
      description="Perdeu algum dia? Jogue os desafios que ficaram para trás."
      cta="Ver todos"
      kana="過去問"
      thumb={
        <div aria-hidden="true" className={`relative h-18 w-14 translate-y-1 max-sm:scale-140 transition-opacity duration-300 ${state && y > 0 ? "" : "opacity-0"}`}>
          {FAN.map((cls, i) => {
            const day = y - (FAN.length - 1 - i);
            return (
              day > 0 && (
                <div key={i} className={`absolute inset-0 flex origin-bottom flex-col overflow-hidden rounded-xl bg-grape shadow-pop ring-3 ring-grape-ink transition duration-500 ease-spring ${cls}`}>
                  <span className="bg-ink py-0.5 text-center text-[9px] font-bold tracking-wider text-lime uppercase">
                    {day === y ? "ontem" : weekday(day)}
                  </span>
                  <span className="flex flex-1 items-center justify-center font-display text-base font-extrabold text-white">#{day}</span>
                </div>
              )
            );
          })}
        </div>
      }
    />
  );
}
