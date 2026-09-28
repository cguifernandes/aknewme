"use client";

import { useEffect, useRef, useState } from "react";
import EndCard from "@/components/EndCard";
import GameHeader from "@/components/GameHeader";
import GuessInput from "@/components/GuessInput";
import {
  dailyNumber,
  getDailyResult,
  isCorrectGuess,
  pickAnimes,
  recordPlay,
  saveDailyResult,
  type DailyResult,
} from "@/lib/game";
import { playOpening, type StopFn } from "@/lib/audio";
import type { Anime } from "@/data/animes";

/** Segundos liberados em cada tentativa. */
const STAGES = [1, 2, 4, 7, 11, 16];

type Attempt = { kind: "wrong"; guess: string } | { kind: "skip" };

function fmt(s: number): string {
  return `0:${String(Math.floor(s)).padStart(2, "0")}`;
}

export default function OpeningPage() {
  const [day, setDay] = useState(0);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<DailyResult | null>(null);
  const stopRef = useRef<StopFn | null>(null);

  useEffect(() => {
    const n = dailyNumber();
    setDay(n);
    // salt diferente do modo emoji para os modos não repetirem o mesmo anime
    setAnime(pickAnimes(n * 7 + 3, 1)[0]);
    // um jogo por dia: restaura o resultado se já jogou hoje
    setResult(getDailyResult("opening"));
    return () => stopRef.current?.();
  }, []);

  if (!anime) return null;
  const over = !!result;

  const attempt = Math.min(attempts.length, STAGES.length - 1);
  const unlocked = STAGES[attempt];
  const nextDelta = attempt < STAGES.length - 1 ? STAGES[attempt + 1] - STAGES[attempt] : 0;

  function stopPlayback() {
    stopRef.current?.();
    stopRef.current = null;
    setPlaying(false);
  }

  function togglePlay() {
    if (playing) {
      stopPlayback();
      setElapsed(0);
      return;
    }
    setPlaying(true);
    stopRef.current = playOpening(
      anime!.opening,
      unlocked,
      (e) => setElapsed(e),
      () => {
        setPlaying(false);
        setElapsed(0);
        stopRef.current = null;
      },
    );
  }

  function endGame(kind: "won" | "lost") {
    stopPlayback();
    setElapsed(0);
    setResult(
      saveDailyResult("opening", {
        won: kind === "won",
        answer: anime!.title,
        detail:
          kind === "won"
            ? `Acertou na tentativa ${attempts.length + 1} (${unlocked}s de abertura) · ${anime!.opening.name}`
            : `A abertura era "${anime!.opening.name}".`,
      }),
    );
    recordPlay();
  }

  function advance(entry: Attempt) {
    if (over) return;
    stopPlayback();
    setElapsed(0);
    if (attempts.length + 1 >= STAGES.length) {
      setAttempts((a) => [...a, entry]);
      endGame("lost");
    } else {
      setAttempts((a) => [...a, entry]);
    }
  }

  function handleGuess(guess: string) {
    if (over) return;
    if (isCorrectGuess(guess, anime!)) endGame("won");
    else advance({ kind: "wrong", guess });
  }

  // Larguras dos segmentos proporcionais ao tempo que cada tentativa adiciona.
  const deltas = STAGES.map((s, i) => (i === 0 ? s : s - STAGES[i - 1]));

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 md:px-10">
      <GameHeader
        right={
          <>
            Tentativa <strong className="font-bold text-white">{Math.min(attempts.length + 1, STAGES.length)}</strong> de{" "}
            {STAGES.length}
          </>
        }
      />

      <main className="mt-6">
        <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">
          Modo Opening · desafio #{day}
        </span>
        <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-white md:text-5xl">
          De qual anime é essa abertura?
        </h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Player */}
          <section className="rounded-3xl bg-white p-8 shadow-pop-lg" aria-label="Player da abertura">
            <div
              className={`relative mx-auto flex size-60 items-center justify-center rounded-full bg-grape-ink ${playing ? "animate-spin-slow" : ""}`}
            >
              <span className="absolute inset-6 rounded-full border border-white/10" aria-hidden="true" />
              <span className="absolute inset-12 rounded-full border border-white/10" aria-hidden="true" />
              <span className="flex size-20 items-center justify-center rounded-full bg-lime text-lg font-bold text-ink">
                OP
              </span>
            </div>

            <div className="mt-8 flex gap-1.5" aria-hidden="true">
              {deltas.map((d, i) => {
                const start = i === 0 ? 0 : STAGES[i - 1];
                const fill =
                  i < STAGES.length && elapsed > start
                    ? Math.min(1, (elapsed - start) / d)
                    : 0;
                return (
                  <div
                    key={i}
                    style={{ flexGrow: d }}
                    className={`h-2.5 overflow-hidden rounded-full ${i <= attempt ? "bg-lavender" : "bg-track"}`}
                  >
                    <div className="h-full rounded-full bg-grape" style={{ width: `${fill * 100}%` }} />
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-between text-sm text-[#8b7fc4]">
              <span>
                {fmt(elapsed)} / {fmt(unlocked)}
              </span>
              <span>
                {unlocked} {unlocked === 1 ? "segundo liberado" : "segundos liberados"}
              </span>
            </div>

            <div className="mt-6 flex items-center gap-5">
              <button
                type="button"
                onClick={togglePlay}
                disabled={!!over}
                aria-label={playing ? "Parar" : "Tocar trecho"}
                className="flex size-14 items-center justify-center rounded-full bg-grape text-white shadow-pop transition hover:brightness-110 active:translate-y-0.5 active:shadow-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
              >
                {playing ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                    <rect width="14" height="14" rx="2" />
                  </svg>
                ) : (
                  <svg width="14" height="16" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
                    <path d="M0 0L12 7L0 14Z" />
                  </svg>
                )}
              </button>
              {nextDelta > 0 && (
                <button
                  type="button"
                  onClick={() => advance({ kind: "skip" })}
                  disabled={!!over}
                  className="flex items-center gap-2 rounded-full border-2 border-grape px-6 py-3 font-bold text-grape transition hover:bg-track disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
                >
                  <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor" aria-hidden="true">
                    <path d="M0 0L8 6L0 12Z" />
                    <rect x="10" width="3" height="12" rx="1" />
                  </svg>
                  Pular +{nextDelta}s
                </button>
              )}
            </div>
          </section>

          {/* Palpite + tentativas */}
          <section>
            <p className="mb-2 text-[15px] font-semibold text-white">Seu palpite</p>
            <GuessInput onGuess={handleGuess} disabled={!!over} placeholder="Nome do anime...">
              <button
                type="submit"
                disabled={!!over}
                className="rounded-full bg-lime px-8 py-4 font-bold text-ink shadow-pop transition hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Chutar
              </button>
            </GuessInput>

            <ol className="mt-6 space-y-3">
              {STAGES.map((s, i) => {
                const past = attempts[i];
                const current = i === attempts.length && !over;
                if (past) {
                  return (
                    <li
                      key={s}
                      className="flex items-center gap-4 rounded-2xl bg-grape-deep/70 px-6 py-4 text-[15px] text-lavender"
                    >
                      <span className="w-8 shrink-0 text-sm font-bold">{s}s</span>
                      {past.kind === "skip" ? (
                        <span>⏭️ Pulou</span>
                      ) : (
                        <span className="truncate">
                          <span className="text-blush">✗</span> {past.guess}
                        </span>
                      )}
                    </li>
                  );
                }
                if (current) {
                  return (
                    <li key={s} className="flex items-center gap-4 rounded-2xl bg-white px-6 py-4 shadow-pop">
                      <span className="w-8 shrink-0 text-sm font-bold text-grape">{s}s</span>
                      <span className="font-bold text-ink">Sua vez</span>
                    </li>
                  );
                }
                return (
                  <li
                    key={s}
                    className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-white/30 px-6 py-3.75 text-sm font-bold text-white/80"
                  >
                    {s}s
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </main>

      {result && <EndCard won={result.won} answer={result.answer} detail={result.detail} />}
    </div>
  );
}
