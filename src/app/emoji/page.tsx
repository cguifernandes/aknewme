"use client";

import { useEffect, useState } from "react";
import EndCard from "@/components/EndCard";
import GameHeader from "@/components/GameHeader";
import GuessInput from "@/components/GuessInput";
import { Emoji, EmojiText } from "@/components/Emoji";
import { HeartIcon, LockIcon } from "@/components/icons";
import {
  dailyNumber,
  getDailyResult,
  isCorrectGuess,
  pickAnimes,
  recordPlay,
  saveDailyResult,
  type DailyResult,
} from "@/lib/game";
import type { Anime } from "@/data/animes";

const TOTAL_ROUNDS = 5;
const MAX_LIVES = 3;

type Feedback = { kind: "wrong" | "right" | "skip"; text: string } | null;

export default function EmojiPage() {
  const [rounds, setRounds] = useState<Anime[] | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [wrongInRound, setWrongInRound] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [locked, setLocked] = useState(false); // trava input na transição de rodada
  const [result, setResult] = useState<DailyResult | null>(null);

  // Sorteio no cliente (desafio do dia) para evitar mismatch de hidratação.
  // Um jogo por dia: se já jogou hoje, restaura o resultado salvo.
  useEffect(() => {
    setRounds(pickAnimes(dailyNumber(), TOTAL_ROUNDS));
    setResult(getDailyResult("emoji"));
  }, []);

  const header = (
    <GameHeader
      right={
        <>
          <span className="max-sm:sr-only">Pontos</span> <strong className="font-bold text-white">{points}</strong>
          <span className="sm:hidden" aria-hidden="true">pts</span>
          <span className="ml-1 flex items-center gap-1.5" aria-label={`${lives} de ${MAX_LIVES} vidas`}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <HeartIcon key={i} dim={i >= lives} />
            ))}
          </span>
        </>
      }
    />
  );
  const intro = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">
          Modo Emoji · rodada {roundIdx + 1}/{TOTAL_ROUNDS}
        </span>
        <p className="text-sm text-muted">
          Sequência de acertos: <strong className="font-bold text-ink">{streak}</strong>
        </p>
      </div>

      <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
        Que anime é esse?
      </h1>
    </>
  );
  // Enquanto sorteia o desafio, cabeçalho e título já saem no HTML (SEO, sem tela em branco/salto).
  if (!rounds)
    return (
      <div className="mx-auto max-w-6xl px-6 pb-16 md:px-10">
        {header}
        <main className="mt-6">{intro}</main>
      </div>
    );
  const anime = rounds[roundIdx];
  const cluesOpen = Math.min(wrongInRound, 2);
  const over = !!result;

  function endGame(kind: "won" | "lost", pts: number) {
    setResult(
      saveDailyResult("emoji", {
        won: kind === "won",
        answer: kind === "lost" ? anime.title : undefined,
        detail: `Você fez ${pts} ${pts === 1 ? "ponto" : "pontos"} em ${TOTAL_ROUNDS} rodadas.`,
      }),
    );
    recordPlay();
  }

  function nextRound(pointsNow: number) {
    if (roundIdx + 1 >= TOTAL_ROUNDS) {
      endGame(pointsNow > 0 ? "won" : "lost", pointsNow);
      return;
    }
    setRoundIdx((i) => i + 1);
    setWrongInRound(0);
    setFeedback(null);
    setLocked(false);
  }

  function loseLife(): number {
    const left = lives - 1;
    setLives(left);
    return left;
  }

  function handleGuess(guess: string) {
    if (locked || over) return;
    if (isCorrectGuess(guess, anime)) {
      const p = points + 1;
      setPoints(p);
      setStreak((s) => s + 1);
      setFeedback({ kind: "right", text: `✅ Acertou! Era ${anime.title}.` });
      setLocked(true);
      setTimeout(() => nextRound(p), 1100);
    } else {
      setStreak(0);
      const left = loseLife();
      setWrongInRound((w) => w + 1);
      if (left <= 0) endGame("lost", points);
      else
        setFeedback({
          kind: "wrong",
          text: `❌ Não é "${guess}". ${wrongInRound < 2 ? "Pista liberada!" : "Tente de novo."}`,
        });
    }
  }

  function handleSkip() {
    if (locked || over) return;
    setStreak(0);
    const left = loseLife();
    if (left <= 0) {
      endGame("lost", points);
      return;
    }
    setFeedback({ kind: "skip", text: `⏭️ Pulou — era ${anime.title}.` });
    setLocked(true);
    setTimeout(() => nextRound(points), 1100);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 md:px-10">
      {header}

      <main className="mt-6">
        {intro}

        <div
          key={roundIdx}
          className="mt-7 flex items-center justify-center gap-5 rounded-3xl bg-grape px-4 py-12 shadow-pop-lg sm:gap-8 sm:px-6 sm:py-16 md:gap-16"
        >
          {anime.emojis.map((e, i) => (
            <span key={i} className="text-5xl md:text-6xl" aria-hidden="true">
              <Emoji e={e} />
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {anime.emojiClues.map((clue, i) =>
            i < cluesOpen ? (
              <div key={i} className="rounded-2xl bg-white px-5 py-4 text-[15px] font-medium text-ink shadow-pop">
                <span className="font-bold text-grape">Pista {i + 1}</span> · {clue}
              </div>
            ) : (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-2xl border-2 border-dashed border-grape/30 px-5 py-4 text-[15px] text-muted"
              >
                <LockIcon />
                Pista {i + 1} · libera após {i + 1} {i === 0 ? "erro" : "erros"}
              </div>
            ),
          )}
        </div>

        <p className="mt-6 mb-2 text-[15px] font-semibold text-ink">Seu palpite</p>
        <GuessInput onGuess={handleGuess} disabled={locked || !!over}>
          <button
            type="submit"
            disabled={locked || !!over}
            className="rounded-full bg-lime px-8 py-4 font-bold text-ink shadow-pop max-sm:flex-1 transition hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
          >
            Chutar
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={locked || !!over}
            className="rounded-full bg-grape-deep px-6 py-4 text-sm font-bold text-white shadow-pop transition hover:brightness-110 active:translate-y-0.5 active:shadow-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape max-sm:flex-1"
          >
            Pular (−1 vida)
          </button>
        </GuessInput>

        <p
          aria-live="polite"
          className={`mt-4 min-h-6 text-[15px] font-semibold ${
            feedback?.kind === "wrong" ? "animate-shake text-danger" : "text-grape-deep"
          }`}
        >
          {feedback && <EmojiText text={feedback.text} />}
        </p>
      </main>

      {result && <EndCard won={result.won} answer={result.answer} detail={result.detail} />}
    </div>
  );
}
