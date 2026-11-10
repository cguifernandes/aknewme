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

/** Os dias do card (do mais antigo para ontem): só depende da data, não do localStorage. */
function lastDays(): number[] {
  const today = dailyNumber();
  const count = Math.min(DAYS, today - 1);
  return Array.from({ length: count }, (_, i) => today - count + i);
}

/**
 * Mesma conta de lastDays/weekday, rodando direto no HTML: preenche "qua / #178" nos quadradinhos antes de o React
 * carregar, para eles não aparecerem vazios e ganharem texto depois. Só a cor (jogado ou não) espera o localStorage.
 */
// ponytail: supõe os 7 quadradinhos do HTML do servidor; na 1ª semana do site (menos de 7 dias) sobrariam alguns.
const DAYS_SCRIPT = `(function(){var t=new Date(),n=Math.floor((Date.UTC(t.getFullYear(),t.getMonth(),t.getDate())-${EPOCH_UTC})/864e5)+1,l=document.currentScript.previousElementSibling.children;for(var i=0;i<l.length;i++){var d=n-l.length+i,s=l[i].children;s[0].textContent=new Date(${EPOCH_UTC}+(d-1)*864e5).toLocaleDateString("pt-BR",{timeZone:"UTC",weekday:"short"}).replace(".","");s[1].textContent="#"+d}})()`;

/** Card "Desafios anteriores" da Home: os últimos 7 dias e quantos ainda faltam jogar. Leva ao arquivo. */
export default function ArchiveCard() {
  // Os dias já nascem certos no navegador (no HTML do servidor quem preenche é o DAYS_SCRIPT);
  // `played` = null enquanto lê o localStorage: até lá os quadradinhos ficam sem cor e o subtítulo, invisível.
  const [range] = useState<number[] | null>(() => (typeof window === "undefined" ? null : lastDays()));
  const [played, setPlayed] = useState<Record<number, boolean>[] | null>(null);
  useEffect(() => setPlayed(MODES.map(playedDays)), []);

  const days: Day[] | null =
    range && played
      ? range.map((day) => {
          const results = played.map((p) => p[day]).filter((w) => w !== undefined);
          return { day, won: results.length ? results.every(Boolean) : undefined };
        })
      : null;
  /** O que cada quadradinho mostra: os dias (com ou sem cor); só no HTML do servidor ficam vazios. */
  const tiles: (Day | null)[] = days ?? range?.map((day) => ({ day })) ?? Array.from({ length: DAYS }, () => null);

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
          {/* em espera o subtítulo fica invisível (ocupando o lugar): não troca de texto quando os dados chegam */}
          <p className={`mt-0.5 text-sm font-semibold text-muted transition-opacity duration-300 ${days ? "" : "opacity-0"}`}>{subtitle}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-grape text-white transition duration-300 ease-spring group-hover:translate-x-1 group-hover:bg-ink group-focus-visible:translate-x-1 group-focus-visible:bg-ink">
          <Icon icon={faArrowRight} className="text-sm" />
        </span>
      </div>
      <ol className="flex gap-1.5" aria-hidden="true">
        {tiles.map((d, i) => (
          <li
            key={i}
            style={{ animationDelay: `${i * 50}ms` }}
            className={`min-w-0 flex-1 rounded-lg border-2 py-1.5 text-center leading-tight text-ink transition-colors duration-300 group-hover:animate-pop group-focus-visible:animate-pop ${
              d?.won === undefined
                ? "border-dashed border-grape/40 bg-track"
                : d.won
                  ? "border-transparent bg-lime"
                  : "border-transparent bg-blush"
            }`}
          >
            <span suppressHydrationWarning className="block text-[10px] font-semibold">{d ? weekday(d.day) : " "}</span>
            <span suppressHydrationWarning className="block text-xs font-extrabold">{d ? `#${d.day}` : " "}</span>
          </li>
        ))}
      </ol>
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: DAYS_SCRIPT }} />
    </Link>
  );
}
