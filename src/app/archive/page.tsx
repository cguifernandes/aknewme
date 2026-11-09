"use client";

import { faCircleXmark, faShuffle } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckIcon, Icon, LockIcon, XLogo } from "@/components/icons";
import SiteHeader from "@/components/SiteHeader";
import { useFollowed } from "@/lib/follow";
import {
  dailyNumber,
  EPOCH_UTC,
  MODE_LABEL,
  MODE_PATH,
  playedDays,
  type GameMode,
} from "@/lib/game";
import { X_FOLLOW_URL, X_HANDLE } from "@/lib/site";

const MODES = Object.keys(MODE_LABEL) as GameMode[];
const PAGE = 30; // dias mostrados por vez
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
  const [shown, setShown] = useState(PAGE);
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

  const past = today - 1; // quantos desafios anteriores existem
  const isNew = (day: number, m: GameMode) => played?.[m][day] === undefined;
  /** Do mais recente ao #1; "new" = dias com algum modo por jogar, "played" = dias com algum modo jogado. */
  const all = Array.from({ length: past }, (_, i) => past - i).filter((d) =>
    filter === "all" ? true : MODES.some((m) => isNew(d, m) === (filter === "new")),
  );
  const days = all.slice(0, shown);

  /** Sorteia um (dia, modo) ainda não jogado e abre. */
  function playRandom() {
    const open: [number, GameMode][] = [];
    for (let d = 1; d <= past; d++) for (const m of MODES) if (isNew(d, m)) open.push([d, m]);
    if (!open.length) return;
    const [d, m] = open[Math.floor(Math.random() * open.length)];
    router.push(`${MODE_PATH[m]}?day=${d}`);
  }
  const hasNew = past > 0 && Array.from({ length: past }, (_, i) => i + 1).some((d) => MODES.some((m) => isNew(d, m)));

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
      <SiteHeader />
      <main className="mt-6">
        <h1 className="mt-2 font-display text-4xl font-extrabold text-balance tracking-tight text-ink md:text-5xl">
          Desafios anteriores
        </h1>
        <p className="mt-2 text-lg leading-relaxed text-muted">
          Jogue os dias que você perdeu. Eles não contam nas estatísticas nem na
          sequência.
        </p>

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
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-x px-8 py-3.5 font-bold text-white shadow-pop sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
                <div className="flex gap-1.5 rounded-full bg-white p-1.5 shadow-pop" role="group" aria-label="Filtrar desafios">
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
                        setShown(PAGE);
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition ${FOCUS} ${
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
                  className={`inline-flex items-center gap-2 rounded-full bg-grape px-6 py-3 text-sm font-bold text-white shadow-pop sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink active:translate-y-0.5 active:shadow-none disabled:opacity-50 ${FOCUS}`}
                >
                  <Icon icon={faShuffle} /> Jogar um aleatório
                </button>
              </div>
            )}
            {filter !== "all" && !all.length && past > 0 && (
              <p className="mt-8 text-muted">
                {filter === "new" ? "Você já jogou todos os desafios anteriores!" : "Você ainda não jogou nenhum desafio anterior."}
              </p>
            )}
            <ol className="mt-6 grid gap-3 lg:grid-cols-2">
              {days.map((day) => (
                <li
                  key={day}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white px-5 py-3 shadow-pop"
                >
                  <p className="w-28 font-display text-lg font-extrabold text-ink">
                    #{day}{" "}
                    <span className="text-sm font-semibold text-muted">
                      · {date(day)}
                    </span>
                  </p>
                  <ul className="grid flex-1 grid-cols-3 gap-2">
                    {MODES.map((m) => {
                      const won = played[m][day]; // undefined = ainda não jogou
                      return (
                        <li key={m}>
                          <Link
                            href={`${MODE_PATH[m]}?day=${day}`}
                            aria-label={`Modo ${MODE_LABEL[m]}, desafio ${day}${won === undefined ? "" : won ? ": acertou" : ": errou"}`}
                            className={`flex items-center justify-center gap-1.5 rounded-full border border-ink/15 px-3 py-2.5 text-sm font-bold text-ink ${FOCUS} ${
                              won === undefined
                                ? "bg-track sweep-lavender"
                                : won
                                  ? "bg-lime sweep-white"
                                  : "bg-blush sweep-danger hover:text-white focus-visible:text-white"
                            }`}
                          >
                            {won !== undefined &&
                              (won ? (
                                <CheckIcon />
                              ) : (
                                <Icon
                                  icon={faCircleXmark}
                                  className="text-base"
                                />
                              ))}
                            {MODE_LABEL[m]}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
            {shown < all.length && (
              <button
                type="button"
                onClick={() => setShown((s) => s + PAGE)}
                className={`mx-auto mt-6 block rounded-full bg-grape px-7 py-3.5 font-bold text-white shadow-pop sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink active:translate-y-0.5 active:shadow-none ${FOCUS}`}
              >
                Mostrar mais
              </button>
            )}
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
