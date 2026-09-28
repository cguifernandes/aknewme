"use client";

import { useEffect, useState } from "react";
import EndCard from "@/components/EndCard";
import GameHeader from "@/components/GameHeader";
import GuessInput from "@/components/GuessInput";
import { EmojiText } from "@/components/Emoji";
import { LockIcon } from "@/components/icons";
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

const TOTAL_CLUES = 5;

function clues(a: Anime): { label: string; value: string }[] {
  return [
    { label: "Ano de estreia", value: String(a.year) },
    { label: "Estúdio", value: a.studio },
    { label: "Gênero", value: a.genre },
    { label: "Episódios", value: a.episodes },
    { label: "Sinopse", value: a.synopsis },
  ];
}

export default function PistasPage() {
  const [day, setDay] = useState(0);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [revealed, setRevealed] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<DailyResult | null>(null);

  useEffect(() => {
    const n = dailyNumber();
    setDay(n);
    // salt diferente dos outros modos
    setAnime(pickAnimes(n * 13 + 5, 1)[0]);
    // um jogo por dia: restaura o resultado se já jogou hoje
    setResult(getDailyResult("pistas"));
  }, []);

  if (!anime) return null;

  const list = clues(anime);
  const stake = TOTAL_CLUES + 1 - revealed; // 5..1
  const over = !!result;

  function endGame(kind: "won" | "lost") {
    setResult(
      saveDailyResult("pistas", {
        won: kind === "won",
        answer: anime!.title,
        detail:
          kind === "won"
            ? `+${stake} ${stake === 1 ? "ponto" : "pontos"} · ${revealed} ${revealed === 1 ? "pista usada" : "pistas usadas"}`
            : "Todas as pistas foram usadas.",
      }),
    );
    recordPlay();
  }

  function reveal() {
    if (over) return;
    setRevealed((r) => Math.min(r + 1, TOTAL_CLUES));
  }

  function handleGuess(guess: string) {
    if (over) return;
    if (isCorrectGuess(guess, anime!)) {
      endGame("won");
    } else if (revealed >= TOTAL_CLUES) {
      endGame("lost");
    } else {
      reveal();
      setFeedback(`❌ Não é "${guess}" — pista ${Math.min(revealed + 1, TOTAL_CLUES)} liberada.`);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 md:px-10">
      <GameHeader
        right={
          <>
            Pistas usadas <strong className="font-bold text-white">{revealed}</strong> de {TOTAL_CLUES}
          </>
        }
      />

      <main className="mt-6">
        <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">
          Modo Pistas · desafio #{day}
        </span>
        <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
          Descubra com o mínimo de pistas.
        </h1>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.55fr_1fr]">
          {/* Pistas */}
          <ol className="space-y-4">
            {list.map((c, i) => {
              const num = (
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl font-display text-xl font-extrabold ${
                    i < revealed ? "bg-grape-ink text-white" : "bg-grape-deep text-lavender"
                  }`}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
              );
              if (i < revealed) {
                return (
                  <li key={c.label} className="flex items-center gap-4 rounded-2xl bg-white px-4 py-4 shadow-pop">
                    {num}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-grape">{c.label}</p>
                      <p className="font-bold text-ink">{c.value}</p>
                    </div>
                  </li>
                );
              }
              const isNext = i === revealed;
              return (
                <li
                  key={c.label}
                  className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-grape/30 px-4 py-4"
                >
                  {num}
                  <p className="flex flex-1 items-center gap-2 text-[15px] font-medium text-muted">
                    <LockIcon /> {c.label}
                  </p>
                  {isNext && !over && (
                    <button
                      type="button"
                      onClick={reveal}
                      className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink shadow-pop transition hover:brightness-105 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
                    >
                      Revelar (−1 pt)
                    </button>
                  )}
                </li>
              );
            })}
          </ol>

          {/* Pontos + palpite */}
          <section>
            <div className="flex items-center justify-between gap-4 rounded-3xl bg-grape-deep p-6">
              <div>
                <p className="font-bold text-white">Pontos em jogo</p>
                <p className="mt-1 text-sm text-lavender">Cada pista a mais custa 1 ponto.</p>
              </div>
              <p className="font-display text-6xl font-extrabold text-lime" aria-label={`${stake} pontos em jogo`}>
                {stake}
              </p>
            </div>

            <p className="mt-6 mb-2 text-[15px] font-semibold text-ink">Seu palpite</p>
            <GuessInput onGuess={handleGuess} disabled={!!over} placeholder="Nome do anime..." stacked>
              <button
                type="submit"
                disabled={!!over}
                className="w-full rounded-full bg-lime py-4 font-bold text-ink shadow-pop transition hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
              >
                Chutar
              </button>
            </GuessInput>
            <p aria-live="polite" className="mt-3 min-h-5 text-sm text-muted">
              <EmojiText text={feedback || "Errou? A próxima pista abre sozinha."} />
            </p>
          </section>
        </div>
      </main>

      {result && <EndCard won={result.won} answer={result.answer} detail={result.detail} />}
    </div>
  );
}
