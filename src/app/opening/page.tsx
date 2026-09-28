"use client";

import { useEffect, useRef, useState } from "react";
import EndCard from "@/components/EndCard";
import GameHeader from "@/components/GameHeader";
import GuessInput from "@/components/GuessInput";
import { Emoji } from "@/components/Emoji";
import {
  dailyNumber,
  getDailyResult,
  isCorrectGuess,
  OPENING_ANIMES,
  pickAnimes,
  recordPlay,
  saveDailyResult,
  type DailyResult,
} from "@/lib/game";
import VolumeControl from "@/components/VolumeControl";
import { playOpening, type Playback, type Sound } from "@/lib/audio";
import type { Anime } from "@/data/animes";

/** Segundos liberados em cada tentativa. */
const STAGES = [1, 2, 4, 7, 11, 16];

type Attempt = { kind: "wrong"; guess: string } | { kind: "skip" };

// Volume salvo só neste navegador (conveniência; se falhar, usa o padrão).
const SOUND_KEY = "aknewme.sound";
function loadSound(): Sound {
  try {
    const s = JSON.parse(localStorage.getItem(SOUND_KEY) ?? "null");
    if (typeof s?.volume === "number" && s.volume >= 0 && s.volume <= 1) return { volume: s.volume, muted: !!s.muted };
  } catch {}
  return { volume: 0.8, muted: false };
}

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
  const [audioError, setAudioError] = useState(false);
  const [sound, setSound] = useState<Sound>({ volume: 0.8, muted: false });
  const playbackRef = useRef<Playback | null>(null);

  useEffect(() => {
    const n = dailyNumber();
    setDay(n);
    // salt diferente do modo emoji para os modos não repetirem o mesmo anime
    setAnime(pickAnimes(n * 7 + 3, 1, OPENING_ANIMES)[0]);
    // um jogo por dia: restaura o resultado se já jogou hoje
    setResult(getDailyResult("opening"));
    setSound(loadSound());
    return () => playbackRef.current?.stop();
  }, []);

  const header = (
    <GameHeader
      right={
        <>
          {/* celular: "3/6" · resto: "Tentativa 3 de 6" (leitor de tela sempre ouve a frase inteira) */}
          <span className="max-sm:sr-only">Tentativa</span>{" "}
          <strong className="font-bold text-white">{Math.min(attempts.length + 1, STAGES.length)}</strong>
          <span className="max-sm:sr-only"> de</span>
          <span className="sm:hidden" aria-hidden="true">/</span> {STAGES.length}
        </>
      }
    />
  );
  const intro = (
    <>
      <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">
        Modo Opening · desafio #{day || "…"}
      </span>
      <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
        De qual anime é essa abertura?
      </h1>
    </>
  );
  // Enquanto sorteia o desafio, cabeçalho e título já saem no HTML (SEO, sem tela em branco/salto).
  if (!anime)
    return (
      <div className="mx-auto max-w-6xl px-6 pb-16 md:px-10">
        {header}
        <main className="mt-6">{intro}</main>
      </div>
    );
  const over = !!result;

  const attempt = Math.min(attempts.length, STAGES.length - 1);
  const unlocked = STAGES[attempt];
  const nextDelta = attempt < STAGES.length - 1 ? STAGES[attempt + 1] - STAGES[attempt] : 0;

  function stopPlayback() {
    playbackRef.current?.stop();
    playbackRef.current = null;
    setPlaying(false);
  }

  function changeSound(next: Sound) {
    setSound(next);
    playbackRef.current?.setSound(next); // vale na hora, mesmo tocando
    try {
      localStorage.setItem(SOUND_KEY, JSON.stringify(next));
    } catch {}
  }

  function togglePlay() {
    if (playing) {
      stopPlayback();
      setElapsed(0);
      return;
    }
    const done = () => {
      setPlaying(false);
      setElapsed(0);
      playbackRef.current = null;
    };
    setAudioError(false);
    setPlaying(true);
    playbackRef.current = playOpening(
      anime!.opening.audioSrc!, // OPENING_ANIMES só tem animes com áudio
      unlocked,
      sound,
      (e) => setElapsed(e),
      done,
      () => {
        done();
        setAudioError(true);
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
            ? `Acertou na tentativa ${attempts.length + 1} (${unlocked}s de abertura) · "${anime!.opening.name}" — ${anime!.opening.artist}`
            : `A abertura era "${anime!.opening.name}" — ${anime!.opening.artist}.`,
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
      {header}

      <main className="mt-6">
        {intro}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Player */}
          <section className="rounded-3xl bg-grape p-8 text-white shadow-pop-lg" aria-label="Player da abertura">
            <div className="relative isolate mx-auto size-44 sm:size-60">
              {/* Ondas sonoras saindo do disco enquanto toca */}
              {playing &&
                [0, 0.6, 1.2].map((delay) => (
                  <span
                    key={delay}
                    aria-hidden="true"
                    className="motion-always absolute inset-0 -z-10 animate-sonar rounded-full border-2 border-lime"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              {/* O disco gira sempre e só pausa: ao parar, fica no ângulo em que estava */}
              <div
                className={`motion-always relative flex size-full animate-spin-slow items-center justify-center rounded-full bg-vinyl shadow-[0_0_0_6px_rgb(255_255_255/0.08)] ${playing ? "" : "[animation-play-state:paused]"}`}
              >
                <span className="absolute inset-6 rounded-full border border-white/10" aria-hidden="true" />
                <span className="absolute inset-12 rounded-full border border-white/10" aria-hidden="true" />
                <span
                  className={`motion-always relative flex size-16 items-center justify-center rounded-full bg-lime text-base font-bold text-ink ring-4 ring-grape-ink sm:size-20 sm:text-lg ${playing ? "animate-beat" : ""}`}
                >
                  OP
                </span>
              </div>
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
                    className={`h-2.5 overflow-hidden rounded-full ${i <= attempt ? "bg-white/45" : "bg-white/15"}`}
                  >
                    <div className="h-full rounded-full bg-lime" style={{ width: `${fill * 100}%` }} />
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-between text-sm text-lavender">
              <span>
                {fmt(elapsed)} / {fmt(unlocked)}
              </span>
              <span>
                {unlocked} {unlocked === 1 ? "segundo liberado" : "segundos liberados"}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <button
                type="button"
                onClick={togglePlay}
                disabled={!!over}
                aria-label={playing ? "Parar" : "Tocar trecho"}
                className="flex size-14 items-center justify-center rounded-full bg-lime text-ink shadow-pop transition hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
                  className="flex items-center gap-2 rounded-full border-2 border-white px-6 py-3 font-bold text-white transition hover:bg-white/10 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor" aria-hidden="true">
                    <path d="M0 0L8 6L0 12Z" />
                    <rect x="10" width="3" height="12" rx="1" />
                  </svg>
                  Pular +{nextDelta}s
                </button>
              )}
              <div className="ml-auto">
                <VolumeControl sound={sound} onChange={changeSound} />
              </div>
            </div>
            {audioError && (
              <p role="alert" className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-danger">
                Não foi possível tocar o áudio. Verifique sua conexão e tente de novo.
              </p>
            )}
          </section>

          {/* Palpite + tentativas */}
          <section>
            <p className="mb-2 text-[15px] font-semibold text-ink">Seu palpite</p>
            <GuessInput onGuess={handleGuess} disabled={!!over} placeholder="Nome do anime...">
              <button
                type="submit"
                disabled={!!over}
                className="rounded-full bg-lime px-8 py-4 font-bold text-ink shadow-pop max-sm:flex-1 transition hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
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
                      className="flex items-center gap-4 rounded-2xl bg-grape-deep px-6 py-4 text-[15px] text-lavender"
                    >
                      <span className="w-8 shrink-0 text-sm font-bold">{s}s</span>
                      {past.kind === "skip" ? (
                        <span>
                          <Emoji e="⏭️" /> Pulou
                        </span>
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
                    className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-grape/30 px-6 py-3.75 text-sm font-bold text-grape"
                  >
                    {s}s
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </main>

      {result && (
        <EndCard
          won={result.won}
          answer={result.answer}
          detail={result.detail}
          // Os termos da Apple pedem link para a música ao usar a prévia deles.
          link={anime.opening.appleMusic ? { href: anime.opening.appleMusic, label: "Ouvir no Apple Music" } : undefined}
        />
      )}
    </div>
  );
}
