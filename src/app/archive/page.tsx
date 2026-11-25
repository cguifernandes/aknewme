"use client";

import { faCircleXmark, faShuffle } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AnimeImage from "@/components/AnimeImage";
import { CheckIcon, Icon, LockIcon, XLogo } from "@/components/icons";
import SiteHeader from "@/components/SiteHeader";
import { useFollowed } from "@/lib/follow";
import {
  dailyAnimes,
  dailyNumber,
  EPOCH_UTC,
  MODE_LABEL,
  MODE_PATH,
  playedDays,
  type GameMode,
} from "@/lib/game";
import { X_FOLLOW_URL, X_HANDLE } from "@/lib/site";

const MODES = Object.keys(MODE_LABEL) as GameMode[];
const PAGE = 14; // o arquivo vai só até as duas últimas semanas; desafios mais antigos saem da lista
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";

const date = (day: number) =>
  new Date(EPOCH_UTC + (day - 1) * 86_400_000).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
  });

/** Desafios anteriores (do mais recente ao #1), liberados para quem clica em seguir no X. */
export default function ArchivePage() {
  const [followed, follow] = useFollowed();
  const [today, setToday] = useState(0);
  const [played, setPlayed] = useState<Record<
    GameMode,
    Record<number, boolean>
  > | null>(null);
  const [filter, setFilter] = useState<"all" | "new" | "played">("all");
  const router = useRouter();

  // Só no cliente: o nº do dia não pode congelar no build e os jogados vêm do localStorage.
  useEffect(() => {
    setToday(dailyNumber());
    setPlayed({
      emoji: playedDays("emoji"),
      opening: playedDays("opening"),
      pistas: playedDays("pistas"),
    });
  }, []);

  const last = today - 1; // desafio mais recente do arquivo (ontem)
  const past = Math.max(0, Math.min(PAGE, last)); // quantos desafios o arquivo mostra
  const first = last - past + 1; // o mais antigo ainda no arquivo
  const isNew = (day: number, m: GameMode) => played?.[m][day] === undefined;
  /** Do mais recente ao #1; "new" = dias com algum modo por jogar, "played" = dias com algum modo jogado. */
  const days = Array.from({ length: past }, (_, i) => last - i).filter((d) =>
    filter === "all" ? true : MODES.some((m) => isNew(d, m) === (filter === "new")),
  );

  /** Sorteia um (dia, modo) ainda não jogado e abre. */
  function playRandom() {
    const open: [number, GameMode][] = [];
    for (let d = first; d <= last; d++) for (const m of MODES) if (isNew(d, m)) open.push([d, m]);
    if (!open.length) return;
    const [d, m] = open[Math.floor(Math.random() * open.length)];
    router.push(`${MODE_PATH[m]}?day=${d}`);
  }
  const hasNew = past > 0 && Array.from({ length: past }, (_, i) => first + i).some((d) => MODES.some((m) => isNew(d, m)));

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
      <SiteHeader />
      <main className="mt-6 animate-enter">
        <h1 className="mt-2 font-display text-4xl font-extrabold text-balance tracking-tight text-ink md:text-5xl">
          Desafios anteriores
        </h1>
        <p className="mt-2 text-lg leading-relaxed text-muted">
          Jogue os dias que você perdeu nas últimas duas semanas. Eles não contam nas estatísticas nem na sequência.
        </p>

        {/* Em espera (lendo o localStorage: seguiu? o que já jogou?): a mesma grade da lista, vazia e pulsando de leve.
            Sem isso a página abria em branco e a lista "pulava" para dentro. */}
        {(followed === null || (followed && !played)) && (
          <div aria-hidden="true" className="animate-pulse">
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <div className="h-12 w-80 rounded-full bg-white shadow-pop max-sm:h-17 max-sm:w-full" />
              <div className="h-11 w-52 rounded-full bg-track max-sm:w-full" />
            </div>
            <ol className="mt-6 grid gap-3 lg:grid-cols-2">
              {Array.from({ length: PAGE }, (_, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white px-4 py-3 shadow-pop sm:px-5">
                  <p className="w-28 font-display text-lg max-sm:w-full">&nbsp;</p>
                  <ul className="grid flex-1 grid-cols-3 gap-2 max-sm:basis-full">
                    {MODES.map((m) => (
                      <li key={m} className="h-11 rounded-xl bg-track max-sm:h-10" />
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        )}

        {followed === false && (
          <section className="mt-8 rounded-3xl bg-grape p-8 text-center text-white shadow-pop-lg">
            <p className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-grape">
              <LockIcon />
            </p>
            <h2 className="mt-4 font-display text-2xl font-extrabold">
              {past > 0
                ? `${past} dias de desafios, nos três modos`
                : "Todos os desafios, nos três modos"}
            </h2>
            <p className="mt-2 text-[15px] text-lavender">
              Siga @{X_HANDLE} no X para liberar todos.
            </p>
            <a
              href={X_FOLLOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={follow}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-x px-8 py-3.5 font-bold text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <XLogo /> Seguir e liberar
            </a>
          </section>
        )}

        {followed && played && (
          <>
            {past > 0 && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                {/* filtro segmentado: Todos · Não jogados · Jogados */}
                <div className="flex gap-1.5 rounded-full bg-white p-1.5 shadow-pop max-sm:w-full" role="group" aria-label="Filtrar desafios">
                  {(
                    [
                      ["all", "Todos"],
                      ["new", "Não jogados"],
                      ["played", "Jogados"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={filter === key}
                      onClick={() => {
                        setFilter(key);
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition max-sm:flex-1 ${FOCUS} ${
                        filter === key ? "bg-grape text-white" : "text-ink hover:bg-track"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={playRandom}
                  disabled={!hasNew}
                  className={`inline-flex items-center justify-center gap-2 rounded-full bg-grape px-6 py-3 text-sm font-bold text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink active:translate-y-0.5 disabled:opacity-50 max-sm:w-full ${FOCUS}`}
                >
                  <Icon icon={faShuffle} /> Jogar um aleatório
                </button>
              </div>
            )}
            {filter !== "all" && !days.length && past > 0 && (
              <p className="mt-8 text-muted">
                {filter === "new" ? "Você já jogou todos os desafios anteriores!" : "Você ainda não jogou nenhum desafio anterior."}
              </p>
            )}
            <ol className="mt-6 grid animate-enter gap-3 lg:grid-cols-2">
              {days.map((day) => (
                <li
                  key={day}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white px-4 py-3 shadow-pop sm:px-5"
                >
                  <p className="w-28 font-display text-lg font-extrabold text-ink max-sm:w-full">
                    #{day}{" "}
                    <span className="text-sm font-semibold text-muted">
                      · {date(day)}
                    </span>
                  </p>
                  <ul className="grid flex-1 grid-cols-3 gap-2 max-sm:basis-full">
                    {MODES.map((m) => {
                      const won = played[m][day]; // undefined = ainda não jogou
                      return (
                        <li key={m}>
                          <Link
                            href={`${MODE_PATH[m]}?day=${day}`}
                            aria-label={`Modo ${MODE_LABEL[m]}, desafio ${day}${won === undefined ? "" : won ? ": acertou" : ": errou"}`}
                            // jogado: miniatura do anime com borda verde (acertou) ou rosa (errou), um "álbum" do que você jogou.
                            // Não jogado: sem imagem (seria spoiler).
                            className={`group relative flex items-center justify-center overflow-hidden rounded-xl border-2 px-2 py-2.5 text-sm font-bold max-sm:text-xs ${FOCUS} ${
                              won === undefined
                                ? "border-track bg-white text-ink sweep-track"
                                : `bg-ink text-white ${won ? "border-lime" : "border-blush"}`
                            }`}
                          >
                            {won !== undefined && (
                              <>
                                <AnimeImage anime={dailyAnimes(m, day)[0]} sizes="256px" />
                                <span aria-hidden="true" className="absolute inset-0 bg-ink/55 transition-colors duration-300 group-hover:bg-ink/25 group-focus-visible:bg-ink/25" />
                              </>
                            )}
                            <span className={`relative flex items-center gap-1.5 ${won === undefined ? "" : won ? "[&>svg]:text-lime" : "[&>svg]:text-blush"}`}>
                              {won !== undefined && (won ? <CheckIcon /> : <Icon icon={faCircleXmark} className="text-base" />)}
                              {MODE_LABEL[m]}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
            {past < 1 && (
              <p className="mt-8 text-muted">
                Ainda não há desafios anteriores. Volte amanhã!
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
