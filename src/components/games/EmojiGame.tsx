"use client";

import { useEffect, useState } from "react";
import EndCard from "@/components/EndCard";
import SiteHeader from "@/components/SiteHeader";
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
  shareText,
  type DailyResult,
} from "@/lib/game";
import type { Anime } from "@/data/animes";

const TOTAL_ROUNDS = 5;
const MAX_LIVES = 3;

type Feedback = { kind: "wrong" | "right" | "skip"; text: string } | null;

/** Modo Emoji: desafio do dia, um jogo por dia. */
export default function EmojiGame() {
  const [rounds, setRounds] = useState<Anime[] | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [points, setPoints] = useState(0);
  const [wrongInRound, setWrongInRound] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [locked, setLocked] = useState(false); // trava input na transição de rodada
  const [result, setResult] = useState<DailyResult | null>(null);
  /** Quadradinho de cada rodada, para compartilhar: 🟩 de primeira · 🟨 com erro · ⬛ pulou · 🟥 perdeu */
  const [log, setLog] = useState<string[]>([]);

  // Sorteio no cliente para evitar mismatch de hidratação.
  // Desafio do dia: um jogo por dia; se já jogou hoje, restaura o resultado salvo.
  useEffect(() => {
    setRounds(pickAnimes(dailyNumber(), TOTAL_ROUNDS));
    setResult(getDailyResult("emoji"));
  }, []);

  const header = <SiteHeader />;
  const intro = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">
          Modo Emoji · rodada {roundIdx + 1}/{TOTAL_ROUNDS}
        </span>
        <div className="flex h-9 items-center gap-1.5 rounded-full bg-grape-deep px-4 text-sm font-medium whitespace-nowrap text-lavender">
          Pontos <strong className="font-bold text-white">{points}</strong>
          <span className="ml-1 flex items-center gap-1.5" aria-label={`${lives} de ${MAX_LIVES} vidas`}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <span key={i} className={i >= lives ? "text-white/25" : "text-blush"}>
                <HeartIcon />
              </span>
            ))}
          </span>
        </div>
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

  function endGame(kind: "won" | "lost", pts: number, livesLeft: number, finalLog: string[]) {
    const hearts = "❤️".repeat(livesLeft) + "🖤".repeat(MAX_LIVES - livesLeft);
    const grid = `${finalLog.join("")}${"⬜".repeat(TOTAL_ROUNDS - finalLog.length)}\n${hearts}`;
    const line =
      pts === TOTAL_ROUNDS
        ? `Gabaritei! Acertei os ${pts} animes só pelos emojis 🔥`
        : pts > 0
          ? `Acertei ${pts} de ${TOTAL_ROUNDS} animes só pelos emojis!`
          : "Os emojis me venceram hoje 😵";
    const r = {
      won: kind === "won",
      answer: kind === "lost" ? anime.title : undefined,
      detail: `${pts} de ${TOTAL_ROUNDS} pontos`,
      share: shareText("emoji", kind === "won", line, grid),
      grid,
      score: pts,
    };
    setResult(saveDailyResult("emoji", r));
    recordPlay();
  }

  function nextRound(pointsNow: number, logNow: string[]) {
    if (roundIdx + 1 >= TOTAL_ROUNDS) {
      endGame(pointsNow > 0 ? "won" : "lost", pointsNow, lives, logNow);
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
      const newLog = [...log, wrongInRound === 0 ? "🟩" : "🟨"];
      setPoints(p);
      setLog(newLog);
      setFeedback({ kind: "right", text: `✅ Acertou! Era ${anime.title}.` });
      setLocked(true);
      setTimeout(() => nextRound(p, newLog), 1100);
    } else {
      const left = loseLife();
      setWrongInRound((w) => w + 1);
      if (left <= 0) endGame("lost", points, 0, [...log, "🟥"]);
      else
        setFeedback({
          kind: "wrong",
          text: `❌ Não é "${guess}". ${wrongInRound < 2 ? "Pista liberada!" : "Tente de novo."}`,
        });
    }
  }

  function handleSkip() {
    if (locked || over) return;
    const left = loseLife();
    if (left <= 0) {
      endGame("lost", points, 0, [...log, "🟥"]);
      return;
    }
    const newLog = [...log, "⬛"];
    setLog(newLog);
    setFeedback({ kind: "skip", text: `⏭️ Pulou — era ${anime.title}.` });
    setLocked(true);
    setTimeout(() => nextRound(points, newLog), 1100);
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
            type="button"
            onClick={handleSkip}
            disabled={locked || !!over}
            className="rounded-full bg-grape-deep px-6 py-4 text-sm font-bold whitespace-nowrap text-white shadow-pop transition hover:brightness-110 active:translate-y-0.5 active:shadow-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape max-sm:flex-1"
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

      {result && (
        <EndCard
          mode="emoji"
          won={result.won}
          answer={result.answer}
          detail={result.detail}
          share={result.share}
          grid={result.grid}
        />
      )}
    </div>
  );
}
