"use client";

import { faForwardStep, faPlay, faStop } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import EndCard from "@/components/EndCard";
import SiteHeader from "@/components/SiteHeader";
import GuessInput from "@/components/GuessInput";
import Truncate from "@/components/Truncate";
import { Icon } from "@/components/icons";
import VolumeControl from "@/components/VolumeControl";
import {
  playDay,
  getDailyResult,
  isCorrectGuess,
  dailyAnimes,
  pickOpening,
  recordPlay,
  saveDailyResult,
  trackStart,
  shareText,
  type DailyResult,
} from "@/lib/game";
import { playOpening, type Playback, type Sound } from "@/lib/audio";
import type { Anime, Opening } from "@/data/animes";

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

/** Modo Opening: desafio do dia, um jogo por dia. */
export default function OpeningGame() {
  const [day, setDay] = useState(0);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [opening, setOpening] = useState<Opening | null>(null); // qual das aberturas do anime toca
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<DailyResult | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [sound, setSound] = useState<Sound>({ volume: 0.8, muted: false });
  const playbackRef = useRef<Playback | null>(null);

  useEffect(() => {
    setSound(loadSound());
    const n = playDay();
    setDay(n);
    // salt diferente do modo emoji para os modos não repetirem o mesmo anime
    const a = dailyAnimes("opening", n)[0];
    setAnime(a);
    setOpening(pickOpening(a, n * 31 + 11)); // mesma abertura para todo mundo no dia
    // um jogo por dia: restaura o resultado se já jogou hoje
    setResult(getDailyResult("opening"));
    return () => playbackRef.current?.stop();
  }, []);

  // Trocou de janela (alt+tab) ou escondeu a aba: para o trecho.
  useEffect(() => {
    const stop = () => {
      if (!playbackRef.current) return;
      playbackRef.current.stop();
      playbackRef.current = null;
      setPlaying(false);
      setElapsed(0);
    };
    const onVisibility = () => document.hidden && stop();
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const header = <SiteHeader />;
  const intro = (
    <>
      <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">
        Modo Opening · desafio #{day || "…"}
      </span>
      <h1 className="mt-5 font-display text-4xl font-extrabold text-balance tracking-tight text-ink md:text-5xl">
        De qual anime é essa abertura?
      </h1>
    </>
  );
  // Enquanto sorteia o desafio, cabeçalho e título já saem no HTML (SEO, sem tela em branco/salto).
  if (!anime || !opening)
    return (
      <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
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
      opening!.audioSrc!, // pickOpening só sorteia aberturas com áudio
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

  /** `tried` = tentativas erradas/puladas até o fim da partida */
  function endGame(kind: "won" | "lost", tried: Attempt[]) {
    stopPlayback();
    setElapsed(0);
    const won = kind === "won";
    const squares: string[] = tried.map((a) => (a.kind === "skip" ? "⬛" : "🟥"));
    if (won) squares.push("🟩");
    const grid = squares.join("") + "⬜".repeat(STAGES.length - squares.length);
    const secs = STAGES[tried.length];
    const line = !won
      ? "Essa abertura me pegou 😵"
      : secs === 1
        ? "Reconheci a abertura em 1 segundo! 🎧🔥"
        : `Reconheci a abertura em ${secs} segundos! 🎧`;
    const r = {
      won,
      answer: anime!.title,
      detail: `"${opening!.name}" · ${opening!.artist}`, // a tentativa já aparece nos quadradinhos
      share: shareText("opening", won, line, grid),
      grid,
      score: won ? tried.length + 1 : null,
    };
    setResult(saveDailyResult("opening", r));
    recordPlay();
  }

  function advance(entry: Attempt) {
    if (over) return;
    trackStart("opening");
    stopPlayback();
    setElapsed(0);
    const next = [...attempts, entry];
    setAttempts(next);
    if (next.length >= STAGES.length) endGame("lost", next);
  }

  function handleGuess(guess: string) {
    if (over) return;
    trackStart("opening");
    if (isCorrectGuess(guess, anime!)) endGame("won", attempts);
    else advance({ kind: "wrong", guess });
  }

  // Larguras dos segmentos proporcionais ao tempo que cada tentativa adiciona.
  const deltas = STAGES.map((s, i) => (i === 0 ? s : s - STAGES[i - 1]));

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
      {header}

      <main className="mt-6">
        {intro}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Player */}
          <section className="rounded-3xl bg-grape p-6 text-white shadow-pop-lg sm:p-8" aria-label="Player da abertura">
            <div className="relative isolate mx-auto size-36 sm:size-60">
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
                className={`motion-always relative flex size-full animate-spin-slow items-center justify-center rounded-full bg-vinyl ring-6 ring-white/8 ${playing ? "" : "[animation-play-state:paused]"}`}
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

            <div className="mt-6 flex gap-1.5 sm:mt-8" aria-hidden="true">
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
                className="flex size-14 items-center justify-center rounded-full bg-lime text-ink sweep-white active:scale-95 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {playing ? (
                  <Icon icon={faStop} className="text-[15px]" />
                ) : (
                  <Icon icon={faPlay} className="text-[17px]" />
                )}
              </button>
              {nextDelta > 0 && (
                <button
                  type="button"
                  onClick={() => advance({ kind: "skip" })}
                  disabled={!!over}
                  className="flex items-center gap-2 rounded-full border-2 border-white/40 px-6 py-3 font-bold text-white hover:border-white/70 sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Icon icon={faForwardStep} className="text-[15px]" />
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
            <GuessInput onGuess={handleGuess} disabled={!!over} placeholder="Nome do anime..." />

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
                          ⏭️ Pulou
                        </span>
                      ) : (
                        <Truncate text={past.guess} className="line-through decoration-blush decoration-2">
                          <span className="sr-only">Errou: </span>
                        </Truncate>
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
          mode="opening"
          won={result.won}
          answer={result.answer}
          detail={result.detail}
          share={result.share}
          grid={result.grid}
          score={result.score}
        />
      )}
    </div>
  );
}
