"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { dailyNumber, EPOCH_UTC, MODE_LABEL, playedDays, type GameMode } from "@/lib/game";
import { Icon } from "./icons";

const MODES = Object.keys(MODE_LABEL) as GameMode[];
const DAYS = 7;

const weekday = (day: number) =>
  new Date(EPOCH_UTC + (day - 1) * 86_400_000)
    .toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "short" })
    .replace(".", "");

/** won: undefined = nenhum modo jogado nesse dia; true = acertou todos os que jogou; false = errou algum. */
type Day = { day: number; won?: boolean };

/** Card "Desafios anteriores" da Home: os últimos 7 dias e quantos ainda faltam jogar. Leva ao arquivo. */
export default function ArchiveCard() {
  // null = ainda lendo o localStorage (mostra os 7 quadradinhos vazios, sem salto de layout)
  const [days, setDays] = useState<Day[] | null>(null);

  useEffect(() => {
    const today = dailyNumber();
    const count = Math.min(DAYS, today - 1);
    const played = MODES.map(playedDays);
    setDays(
      Array.from({ length: count }, (_, i) => {
        const day = today - count + i;
        const results = played.map((p) => p[day]).filter((w) => w !== undefined);
        return { day, won: results.length ? results.every(Boolean) : undefined };
      }),
    );
  }, []);

  const pending = days?.filter((d) => d.won === undefined).length ?? 0;
  const subtitle = !days
    ? `Últimos ${DAYS} dias`
    : !days.length
      ? "O primeiro chega amanhã"
      : `Últimos ${days.length} dias · ${pending ? `${pending} ${pending === 1 ? "pendente" : "pendentes"}` : "tudo jogado"}`;

  return (
    <Link
      href="/archive"
      aria-label={`Desafios anteriores. ${subtitle}`}
      className="group flex flex-col justify-between gap-4 rounded-[28px] border-2 border-lavender bg-white p-5 shadow-pop transition duration-300 ease-out hover:-translate-y-2 hover:border-grape hover:shadow-pop-lg active:translate-y-0 active:duration-75 focus-visible:-translate-y-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-grape"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Desafios anteriores</h2>
          <p className="mt-0.5 text-sm font-semibold text-muted">{subtitle}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-grape text-white transition duration-300 ease-spring group-hover:translate-x-1 group-hover:bg-ink group-focus-visible:translate-x-1 group-focus-visible:bg-ink">
          <Icon icon={faArrowRight} className="text-sm" />
        </span>
      </div>
      <ol className="flex gap-1.5" aria-hidden="true">
        {(days ?? Array.from({ length: DAYS }, (): Day | null => null)).map((d, i) => (
          <li
            key={i}
            style={{ animationDelay: `${i * 50}ms` }}
            className={`min-w-0 flex-1 rounded-lg border-2 py-1.5 text-center leading-tight text-ink group-hover:animate-pop group-focus-visible:animate-pop ${
              d?.won === undefined
                ? "border-dashed border-grape/40 bg-track"
                : d.won
                  ? "border-transparent bg-lime"
                  : "border-transparent bg-blush"
            }`}
          >
            <span className="block text-[10px] font-semibold">{d ? weekday(d.day) : " "}</span>
            <span className="block text-xs font-extrabold">{d ? `#${d.day}` : " "}</span>
          </li>
        ))}
      </ol>
    </Link>
  );
}
