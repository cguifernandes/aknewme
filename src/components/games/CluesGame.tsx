"use client";

import { useEffect, useState } from "react";
import EndCard from "@/components/EndCard";
import GameHeader from "@/components/GameHeader";
import GuessInput from "@/components/GuessInput";
import { LockIcon } from "@/components/icons";
import {
  dailyNumber,
  getDailyResult,
  isCorrectGuess,
  pickAnimes,
  randomSeed,
  recordPlay,
  saveDailyResult,
  shareText,
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

/** Modo Pistas. `practice`: anime aleatório, sem limite e sem salvar nada. */
export default function CluesGame({ practice = false }: { practice?: boolean }) {
  // No treino, "Jogar de novo" troca a key e remonta a partida do zero.
  const [match, setMatch] = useState(0);
  return <CluesMatch key={match} practice={practice} onRestart={() => setMatch((m) => m + 1)} />;
}

function CluesMatch({ practice, onRestart }: { practice: boolean; onRestart: () => void }) {
  const [day, setDay] = useState(0);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [revealed, setRevealed] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<DailyResult | null>(null);

  useEffect(() => {
    if (practice) {
      setAnime(pickAnimes(randomSeed(), 1)[0]);
      return;
    }
    const n = dailyNumber();
    setDay(n);
    // salt diferente dos outros modos
    setAnime(pickAnimes(n * 13 + 5, 1)[0]);
    // um jogo por dia: restaura o resultado se já jogou hoje
    setResult(getDailyResult("pistas"));
  }, [practice]);

  const header = (
    <GameHeader
      right={
        <>
          {/* celular: "Pistas 3/5" · resto: "Pistas usadas 3 de 5" */}
          Pistas<span className="max-sm:sr-only"> usadas</span> <strong className="font-bold text-white">{revealed}</strong>
          <span className="max-sm:sr-only"> de</span>
          <span className="sm:hidden" aria-hidden="true">/</span> {TOTAL_CLUES}
        </>
      }
    />
  );
  const intro = (
    <>
      <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">
        Modo Pistas · {practice ? "treino" : `desafio #${day || "…"}`}
      </span>
      <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
        Descubra com o mínimo de pistas.
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

  const list = clues(anime);
  const stake = TOTAL_CLUES + 1 - revealed; // 5..1
  const over = !!result;

  function endGame(kind: "won" | "lost") {
    const won = kind === "won";
    const grid = "🟪".repeat(revealed) + "⬜".repeat(TOTAL_CLUES - revealed);
    const pts = `+${stake} ${stake === 1 ? "ponto" : "pontos"}`;
    const line = !won
      ? `Nem com as ${TOTAL_CLUES} pistas eu descobri 😭`
      : revealed === 1
        ? `Descobri o anime com só 1 pista! 🧠🔥 (${pts})`
        : `Descobri o anime com ${revealed} pistas! 🧠 (${pts})`;
    const r = {
      won,
      answer: anime!.title,
      detail: won ? `${pts} · ${revealed} ${revealed === 1 ? "pista usada" : "pistas usadas"}` : undefined,
      share: shareText("pistas", won, line, grid),
      grid,
      score: won ? stake : null,
    };
    if (practice) {
      setResult({ day: 0, ...r });
      return;
    }
    setResult(saveDailyResult("pistas", r));
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
      setFeedback(`Não é ${guess}. Pista ${Math.min(revealed + 1, TOTAL_CLUES)} liberada.`);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 md:px-10">
      {header}

      <main className="mt-6">
        {intro}

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
                  <li key={c.label} className="flex items-center gap-4 rounded-2xl bg-grape px-4 py-4 shadow-pop">
                    {num}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-lavender">{c.label}</p>
                      <p className="font-bold text-white">{c.value}</p>
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
                      className="rounded-full bg-grape px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
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
            <div className="flex items-center justify-between gap-4 rounded-3xl bg-grape p-6 shadow-pop">
              <div>
                <p className="font-bold text-white">Pontos em jogo</p>
                <p className="mt-1 text-sm text-lavender">Cada pista a mais custa 1 ponto.</p>
              </div>
              <p className="font-display text-6xl font-extrabold text-lime" aria-label={`${stake} pontos em jogo`}>
                {stake}
              </p>
            </div>

            <p className="mt-6 mb-2 text-[15px] font-semibold text-ink">Seu palpite</p>
            <GuessInput onGuess={handleGuess} disabled={!!over} placeholder="Nome do anime..." stacked />
            {/* Sem texto na tela (a pista nova já mostra o erro), mas o leitor de tela ainda anuncia */}
            <p aria-live="polite" className="sr-only">
              {feedback}
            </p>
          </section>
        </div>
      </main>

      {result && (
        <EndCard
          mode="pistas"
          won={result.won}
          answer={result.answer}
          detail={result.detail}
          share={practice ? undefined : result.share}
          grid={result.grid}
          onRestart={practice ? onRestart : undefined}
        />
      )}
    </div>
  );
}
