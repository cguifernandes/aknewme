"use client";

import { useEffect, useState } from "react";
import AnimeImage from "@/components/AnimeImage";
import Confetti, { useWinCelebration } from "@/components/Confetti";
import DuelBar from "@/components/DuelBar";
import EndCard from "@/components/EndCard";
import SiteHeader from "@/components/SiteHeader";
import GuessInput from "@/components/GuessInput";
import { LockIcon } from "@/components/icons";
import GuessCard, { GuessLegend } from "@/components/GuessCard";
import {
  playDay,
  getDailyResult,
  isCorrectGuess,
  dailyAnimes,
  animeByTitle,
  animeClues,
  loadProgress,
  saveProgress,
  recordPlay,
  saveDailyResult,
  trackStart,
  shareText,
  type DailyResult,
} from "@/lib/game";
import { ANIMES, type Anime } from "@/data/animes";
import { recordMove } from "@/lib/moves";
import { BADGE } from "@/components/badge";

const TOTAL_CLUES = 5;

/** Modo Pistas: desafio do dia, um jogo por dia. */
export default function CluesGame() {
  const [day, setDay] = useState(0);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [revealed, setRevealed] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [wrong, setWrong] = useState<Anime[]>([]); // palpites errados, do mais recente ao primeiro
  const [result, setResult] = useState<DailyResult | null>(null);
  const { shot, hold, celebrate } = useWinCelebration(); // só no acerto na hora; resultado restaurado não dispara

  useEffect(() => {
    const n = playDay();
    setDay(n);
    // salt diferente dos outros modos
    setAnime(dailyAnimes("pistas", n)[0]);
    // um jogo por dia: restaura o resultado se já jogou hoje
    setResult(getDailyResult("pistas"));
    // Partida pela metade: volta com as pistas abertas e os palpites errados
    const p = loadProgress<{ revealed: number; wrong: string[] }>("pistas");
    if (p) {
      setRevealed(Math.min(Math.max(1, p.revealed), TOTAL_CLUES));
      setWrong(p.wrong.map(animeByTitle).filter((a) => !!a));
    }
  }, []);

  // Salva a cada pista aberta ou palpite errado
  useEffect(() => {
    if (anime && !result && revealed > 1) saveProgress("pistas", { revealed, wrong: wrong.map((a) => a.title) });
  }, [anime, result, revealed, wrong]);

  const header = (
    <>
      <SiteHeader />
      <DuelBar />
    </>
  );
  const intro = (
    <>
      <span className={`block w-fit ${BADGE} bg-lime text-ink`}>
        Modo Pistas · desafio #{day || "…"}
      </span>
      <h1 className="mt-5 font-display text-4xl font-extrabold text-balance tracking-tight text-ink md:text-5xl">
        Descubra com o mínimo de pistas.
      </h1>
    </>
  );
  // Enquanto sorteia o desafio, cabeçalho e título já saem no HTML (SEO, sem tela em branco/salto).
  if (!anime)
    return (
      <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
        {header}
        <main className="mt-6 animate-enter">{intro}</main>
      </div>
    );

  const list = animeClues(anime);
  const stake = TOTAL_CLUES + 1 - revealed; // 5..1
  const over = !!result;

  function endGame(kind: "won" | "lost") {
    if (kind === "won") celebrate(true);
    const won = kind === "won";
    // pistas usadas em roxo; a última é a do desfecho: verde se acertou nela, vermelha se errou com todas abertas
    const grid = "🟪".repeat(revealed - 1) + (won ? "🟩" : "🟥") + "⬜".repeat(TOTAL_CLUES - revealed);
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
    setResult(saveDailyResult("pistas", r));
    recordPlay();
  }

  function reveal() {
    if (over) return;
    trackStart("pistas");
    setRevealed((r) => Math.min(r + 1, TOTAL_CLUES));
  }

  function handleGuess(guess: string) {
    if (over) return;
    trackStart("pistas");
    recordMove("pistas", { t: "guess", g: guess });
    if (isCorrectGuess(guess, anime!)) {
      endGame("won");
    } else if (revealed >= TOTAL_CLUES) {
      endGame("lost");
    } else {
      const g = ANIMES.find((a) => isCorrectGuess(guess, a));
      if (g) setWrong((w) => [g, ...w]);
      reveal();
      setFeedback(`Não é ${guess}. Pista ${Math.min(revealed + 1, TOTAL_CLUES)} liberada.`);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
      {header}

      <main className="mt-6 animate-enter">
        {intro}

        <div className="mt-8 grid items-start gap-6 sm:gap-8 lg:grid-cols-[1.25fr_1fr]">
          {/* Pistas */}
          <ol className="space-y-2.5 sm:space-y-4">
            {list.map((c, i) => {
              const num = (
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg font-display text-base font-extrabold sm:size-12 sm:rounded-xl sm:text-xl ${
                    // revelada: grape-ink, porque fica dentro do cartão grape (a mesma cor sumiria); por revelar: o roxo base
                    i < revealed ? "bg-grape-ink text-white" : "bg-grape text-lavender"
                  }`}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
              );
              if (i < revealed) {
                return (
                  <li key={c.label} className="flex animate-pop items-center gap-4 rounded-2xl bg-grape px-4 py-2.5 shadow-pop sm:py-4">
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
                  className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-grape/30 px-4 py-2.5 sm:py-4"
                >
                  {num}
                  <p className="flex flex-1 items-center gap-2 text-[15px] font-medium text-muted">
                    <LockIcon /> {c.label}
                  </p>
                  {isNext && !over && (
                    <button
                      type="button"
                      onClick={() => {
                        recordMove("pistas", { t: "reveal" });
                        reveal();
                      }}
                      className="rounded-full bg-grape px-5 py-2.5 text-sm font-bold text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
                    >
                      Revelar (−1 pt)
                    </button>
                  )}
                </li>
              );
            })}
          </ol>

          {/* Anime do dia + pontos + palpite */}
          <section>
            {/* Um cartão só: o anime do dia ("? ? ?") e quanto ele vale agora. A barra tem um degrau por ponto e apaga
                um a cada pista aberta. Quando o jogo termina, o cartão vira a imagem do anime. */}
            <div
              className={`relative flex flex-col justify-end overflow-hidden rounded-3xl bg-grape p-4 text-white shadow-pop sm:p-5 ${over ? "min-h-44" : ""}`}
            >
              {over && (
                <>
                  <AnimeImage anime={anime} sizes="828px" />
                  <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink via-ink/45 to-transparent" />
                </>
              )}
              <div className="relative flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-wider text-lime uppercase">Anime do dia</p>
                  <p className="font-display text-2xl leading-tight font-extrabold text-balance">{over ? anime.title : "? ? ?"}</p>
                </div>
                {!over && (
                  <p className="shrink-0 text-right text-xs font-semibold text-lavender" aria-label={`Vale ${stake} ${stake === 1 ? "ponto" : "pontos"} agora`}>
                    Vale agora
                    <strong key={stake} className="block animate-pop font-display text-4xl leading-none font-extrabold text-lime tabular-nums">
                      {stake}
                      <span className="ml-1 text-sm text-white">{stake === 1 ? "pt" : "pts"}</span>
                    </strong>
                  </p>
                )}
              </div>
              {!over && (
                <>
                  <div className="relative mt-4 flex gap-1.5" aria-hidden="true">
                    {Array.from({ length: TOTAL_CLUES }, (_, i) => (
                      <span key={i} className={`h-2 flex-1 rounded-full transition-colors duration-300 ${i < stake ? "bg-lime" : "bg-white/15"}`} />
                    ))}
                  </div>
                  <p className="relative mt-2 text-xs text-lavender">Cada pista que você abre tira 1 ponto.</p>
                </>
              )}
            </div>

            <p className="mt-6 mb-2 text-[15px] font-semibold text-ink">Seu palpite</p>
            <GuessInput plain onGuess={handleGuess} disabled={!!over} guessed={wrong.map((a) => a.title)} />
            {/* Sem texto na tela (a pista nova já mostra o erro), mas o leitor de tela ainda anuncia */}
            <p aria-live="polite" className="sr-only">
              {feedback}
            </p>

            {wrong.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[15px] font-semibold text-ink">Seus palpites vs. anime do dia</p>
                  <GuessLegend />
                </div>
                <ol className="space-y-3">
                  {wrong.map((g, i) => (
                    <GuessCard key={wrong.length - i} guess={g} answer={anime} n={wrong.length - i} />
                  ))}
                </ol>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Acerto na hora: primeiro o "Acertou!" com confete, a janela vem depois (hold) */}
      {result && !hold && (
        <EndCard
          mode="pistas"
          won={result.won}
          answer={result.answer}
          detail={result.detail}
          share={result.share}
          grid={result.grid}
          score={result.score}
        />
      )}
      <Confetti shot={shot} label="Acertou!" />
    </div>
  );
}
