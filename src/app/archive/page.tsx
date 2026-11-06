"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckIcon, Icon, LockIcon, XLogo } from "@/components/icons";
import SiteHeader from "@/components/SiteHeader";
import { useFollowed } from "@/lib/follow";
import { dailyNumber, EPOCH_UTC, MODE_LABEL, MODE_PATH, playedDays, type GameMode } from "@/lib/game";
import { X_FOLLOW_URL, X_HANDLE } from "@/lib/site";

const MODES = Object.keys(MODE_LABEL) as GameMode[];
const PAGE = 30; // dias mostrados por vez
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";

const date = (day: number) =>
  new Date(EPOCH_UTC + (day - 1) * 86_400_000).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });

/** Desafios anteriores (do mais recente ao #1), liberados para quem clica em seguir no X. */
export default function ArchivePage() {
  const [followed, follow] = useFollowed();
  const [today, setToday] = useState(0);
  const [played, setPlayed] = useState<Record<GameMode, Record<number, boolean>> | null>(null);
  const [shown, setShown] = useState(PAGE);

  // Só no cliente: o nº do dia não pode congelar no build e os jogados vêm do localStorage.
  useEffect(() => {
    setToday(dailyNumber());
    setPlayed({ emoji: playedDays("emoji"), opening: playedDays("opening"), pistas: playedDays("pistas") });
  }, []);

  const past = today - 1; // quantos desafios anteriores existem
  const days = Array.from({ length: Math.min(shown, past) }, (_, i) => past - i);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
      <SiteHeader />
      <main className="mt-6">
        <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">Arquivo</span>
        <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
          Desafios anteriores
        </h1>
        <p className="mt-2 text-lg leading-relaxed text-muted">
          Jogue os dias que você perdeu. Eles não contam nas estatísticas nem na sequência.
        </p>

        {followed === false && (
          <section className="mt-8 rounded-3xl bg-grape p-8 text-center text-white shadow-pop-lg">
            <p className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-grape">
              <LockIcon />
            </p>
            <h2 className="mt-4 font-display text-2xl font-extrabold">
              {past > 0 ? `${past} dias de desafios, nos três modos` : "Todos os desafios, nos três modos"}
            </h2>
            <p className="mt-2 text-[15px] text-lavender">Siga @{X_HANDLE} no X para liberar todos.</p>
            <a
              href={X_FOLLOW_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={follow}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-x px-8 py-3.5 font-bold text-white shadow-pop transition hover:bg-x/85 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <XLogo /> Seguir e liberar
            </a>
          </section>
        )}

        {followed && played && (
          <>
            <ol className="mt-8 grid gap-3 lg:grid-cols-2">
              {days.map((day) => (
                <li key={day} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white px-5 py-3 shadow-pop">
                  <p className="w-28 font-display text-lg font-extrabold text-ink">
                    #{day} <span className="text-sm font-semibold text-muted">· {date(day)}</span>
                  </p>
                  <ul className="grid flex-1 grid-cols-3 gap-2">
                    {MODES.map((m) => {
                      const won = played[m][day]; // undefined = ainda não jogou
                      return (
                        <li key={m}>
                          <Link
                            href={`${MODE_PATH[m]}?day=${day}`}
                            aria-label={`Modo ${MODE_LABEL[m]}, desafio ${day}${won === undefined ? "" : won ? ": acertou" : ": errou"}`}
                            className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-bold text-ink transition hover:brightness-95 ${FOCUS} ${
                              won === undefined ? "bg-track" : won ? "bg-lime" : "bg-blush"
                            }`}
                          >
                            {won !== undefined && (won ? <CheckIcon /> : <Icon icon={faXmark} className="text-[11px]" />)}
                            {MODE_LABEL[m]}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
            {shown < past && (
              <button
                type="button"
                onClick={() => setShown((s) => s + PAGE)}
                className={`mx-auto mt-6 block rounded-full bg-grape px-7 py-3.5 font-bold text-white shadow-pop transition hover:brightness-110 active:translate-y-0.5 active:shadow-none ${FOCUS}`}
              >
                Mostrar mais dias
              </button>
            )}
            {past < 1 && <p className="mt-8 text-muted">Ainda não há desafios anteriores. Volte amanhã!</p>}
          </>
        )}
      </main>
    </div>
  );
}
