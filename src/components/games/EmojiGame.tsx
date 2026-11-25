"use client";

import { useEffect, useState } from "react";
import Confetti, { useWinCelebration } from "@/components/Confetti";
import DuelBar from "@/components/DuelBar";
import EndCard from "@/components/EndCard";
import SiteHeader from "@/components/SiteHeader";
import GuessInput from "@/components/GuessInput";
import { faCheck, faForwardStep, faXmark } from "@fortawesome/free-solid-svg-icons";
import { HeartIcon, Icon, LockIcon } from "@/components/icons";
import { CELL, compare, type Cell } from "@/lib/compare";
import { LEVEL_TAG } from "@/lib/difficulty";
import {
  playDay,
  getDailyResult,
  isCorrectGuess,
  dailyAnimes,
  dayLevel,
  animeByTitle,
  loadProgress,
  saveProgress,
  recordPlay,
  saveDailyResult,
  shareText,
  trackStart,
  type DailyResult,
} from "@/lib/game";
import { ANIMES, type Anime } from "@/data/animes";

const TOTAL_ROUNDS = 5;
const MAX_LIVES = 3;

type Feedback = { kind: "wrong" | "right" | "skip"; text: string } | null;
const FEEDBACK_ICON = { right: faCheck, wrong: faXmark, skip: faForwardStep };
/** Partida em andamento salva (a rodada atual é log.length) */
type EmojiProgress = { log: string[]; lives: number; points: number; guesses: string[]; letters: boolean };

/** Ano + estúdio numa cor só: os dois iguais = verde; algum igual ou perto = amarelo; nenhum = vermelho. */
function pairState(cells: Cell[]): Cell["state"] {
  const s = cells.filter((c) => c.label === "Ano" || c.label === "Estúdio").map((c) => c.state);
  if (s.every((x) => x === "ok")) return "ok";
  return s.some((x) => x === "ok" || x === "partial") ? "partial" : "no";
}

/** Modo Emoji: desafio do dia, um jogo por dia. */
export default function EmojiGame() {
  const [day, setDay] = useState(0);
  const [rounds, setRounds] = useState<Anime[] | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [points, setPoints] = useState(0);
  /** Chutes errados da rodada, do 1º ao último (o GuessInput só envia animes do banco) */
  const [guesses, setGuesses] = useState<Anime[]>([]);
  /** Abriu a primeira letra do nome nesta rodada (Dica 3) */
  const [letters, setLetters] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const { shot, hold, celebrate } = useWinCelebration(); // confete a cada acerto
  const [locked, setLocked] = useState(false); // trava input na transição de rodada
  const [result, setResult] = useState<DailyResult | null>(null);
  /** Quadradinho de cada rodada, para compartilhar: 🟩 de primeira · 🟨 com erro · ⬛ pulou · 🟥 perdeu */
  const [log, setLog] = useState<string[]>([]);

  // Sorteio no cliente para evitar mismatch de hidratação.
  // Desafio do dia: um jogo por dia; se já jogou hoje, restaura o resultado salvo.
  useEffect(() => {
    const n = playDay();
    setDay(n);
    setRounds(dailyAnimes("emoji", n));
    setResult(getDailyResult("emoji"));
    // Partida pela metade: volta na rodada em que parou, com as vidas, os pontos e os chutes dela.
    // ponytail: saiu no 1,1s depois de fechar a última rodada (antes do fim de jogo) = recomeça do zero.
    const p = loadProgress<EmojiProgress>("emoji");
    if (p && p.log.length < TOTAL_ROUNDS) {
      setLog(p.log);
      setRoundIdx(p.log.length);
      setLives(p.lives);
      setPoints(p.points);
      setGuesses(p.guesses.map(animeByTitle).filter((a) => !!a));
      setLetters(p.letters);
    }
  }, []);

  // Salva a cada jogada. Na transição de rodada (locked) já salva como a rodada seguinte: vidas cheias, sem os chutes desta.
  useEffect(() => {
    if (!rounds || result || (!log.length && lives === MAX_LIVES)) return;
    saveProgress("emoji", {
      log,
      lives: locked ? MAX_LIVES : lives,
      points,
      guesses: locked ? [] : guesses.map((g) => g.title),
      letters: locked ? false : letters,
    } satisfies EmojiProgress);
  }, [rounds, result, log, lives, points, guesses, letters, locked]);

  const level = day ? dayLevel(day) : null;
  const header = (
    <>
      <SiteHeader />
      <DuelBar />
    </>
  );
  const intro = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">
            <span className="max-sm:hidden">Modo </span>Emoji · rodada {roundIdx + 1}/{TOTAL_ROUNDS}
          </span>
          {level && (
            <span className={`rounded-full px-4 py-1.5 text-sm font-bold text-ink ${LEVEL_TAG[level].className}`}>
              {LEVEL_TAG[level].label}
            </span>
          )}
        </div>
        <div className="flex h-9 items-center gap-1.5 rounded-full bg-grape-deep px-4 text-sm font-medium whitespace-nowrap text-lavender">
          Pontos <strong className="font-bold text-white">{points}</strong>
          <span className="ml-1 flex items-center gap-1.5" aria-label={`${lives} de ${MAX_LIVES} vidas nesta rodada`}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <span key={i} className={i >= lives ? "text-white/40" : "text-blush"}>
                <HeartIcon lost={i >= lives} />
              </span>
            ))}
          </span>
        </div>
      </div>

      <h1 className="mt-5 font-display text-4xl font-extrabold text-balance tracking-tight text-ink md:text-5xl">
        Que anime é esse?
      </h1>
    </>
  );
  // Enquanto sorteia o desafio, cabeçalho e título já saem no HTML (SEO, sem tela em branco/salto).
  if (!rounds)
    return (
      <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
        {header}
        <main className="mt-6 animate-enter">{intro}</main>
      </div>
    );
  const anime = rounds[roundIdx];
  const wrong = guesses.length;
  const over = !!result;

  // Dicas que abrem com os erros da rodada: gênero no 1º, ano e estúdio no 2º; a primeira letra pode ser aberta a qualquer momento.
  // As duas primeiras ganham, e mantêm, a cor do chute que as abriu: Dica 1 = 1º erro, Dica 2 = 2º erro.
  const [first, second] = guesses;
  const hints: { label: string; value: string; open: boolean; state?: Cell["state"] }[] = [
    {
      label: "Dica 1 · Gênero",
      value: anime.genre.replaceAll(" / ", " · "),
      open: !!first,
      state: first && compare(first, anime).find((c) => c.label === "Gênero")?.state,
    },
    {
      label: "Dica 2 · Ano e estúdio",
      value: `${anime.year} · ${anime.studio}`,
      open: !!second,
      state: second && pairState(compare(second, anime)),
    },
    { label: "Dica 3 · Primeira letra", value: `Começa com “${anime.title[0]}”`, open: letters },
  ];

  function endGame(kind: "won" | "lost", pts: number, finalLog: string[]) {
    const grid = finalLog.join("") + "⬜".repeat(TOTAL_ROUNDS - finalLog.length);
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
      endGame(pointsNow > 0 ? "won" : "lost", pointsNow, logNow);
      return;
    }
    setRoundIdx((i) => i + 1);
    setLives(MAX_LIVES); // vidas são por rodada
    setGuesses([]);
    setLetters(false);
    setFeedback(null);
    setLocked(false);
  }

  /** Fecha a rodada (acerto, pulo ou vidas acabaram): mostra o recado e passa para a próxima. */
  function closeRound(square: string, pointsNow: number, fb: Feedback) {
    const newLog = [...log, square];
    setLog(newLog);
    setFeedback(fb);
    setLocked(true);
    setTimeout(() => nextRound(pointsNow, newLog), 1100);
  }

  function handleGuess(guess: string) {
    if (locked || over) return;
    trackStart("emoji");
    if (isCorrectGuess(guess, anime)) {
      setPoints(points + 1);
      celebrate(roundIdx + 1 >= TOTAL_ROUNDS); // acerto da última rodada segura a janela de resultado
      closeRound(wrong === 0 ? "🟩" : "🟨", points + 1, { kind: "right", text: `Acertou! Era ${anime.title}.` });
      return;
    }
    const left = lives - 1;
    setLives(left);
    const g = ANIMES.find((a) => isCorrectGuess(guess, a));
    if (g) setGuesses((list) => [...list, g]);
    if (left <= 0) closeRound("🟥", points, { kind: "wrong", text: `Acabaram as vidas desta rodada — era ${anime.title}.` });
    else setFeedback({ kind: "wrong", text: `Não é "${guess}". ${wrong < 2 ? "Dica liberada!" : "Tente de novo."}` });
  }

  function handleSkip() {
    if (locked || over) return;
    trackStart("emoji");
    closeRound("⬛", points, { kind: "skip", text: `Pulou — era ${anime.title}.` });
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
      {header}

      <main className="mt-6 animate-enter">
        {intro}

        <div
          key={roundIdx}
          className="mt-7 flex items-center justify-center gap-5 rounded-3xl bg-grape px-4 py-12 shadow-pop-lg sm:gap-8 sm:px-6 sm:py-16 md:gap-16"
        >
          {anime.emojis.map((e, i) => (
            <span key={i} className="animate-pop text-5xl md:text-6xl" style={{ animationDelay: `${i * 80}ms` }} aria-hidden="true">
              {e}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {hints.map((h, i) =>
            h.open ? (
              <div
                key={i}
                className={`animate-pop rounded-2xl px-5 py-4 shadow-pop transition-colors duration-300 ${h.state ? CELL[h.state] : "bg-track text-ink"}`}
              >
                <p className="text-xs font-bold tracking-wide uppercase opacity-70">{h.label}</p>
                <p className="mt-1 text-lg font-bold">{h.value}</p>
              </div>
            ) : i === 2 ? (
              <button
                key={i}
                type="button"
                onClick={() => setLetters(true)}
                disabled={locked || over}
                className="rounded-2xl border-2 border-dashed border-grape/50 px-5 py-4 text-left text-[15px] font-bold text-grape hover:border-grape hover:bg-track disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
              >
                Dica 3 · Ver a primeira letra (quando quiser)
              </button>
            ) : (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-2xl border-2 border-dashed border-grape/30 px-5 py-4 text-[15px] text-muted"
              >
                <LockIcon />
                Dica {i + 1} · libera após {i + 1} {i === 0 ? "erro" : "erros"}
              </div>
            ),
          )}
        </div>

        <div className="mt-6">
          <div>
            <p className="mb-2 text-[15px] font-semibold text-ink">Seu palpite</p>
            <GuessInput onGuess={handleGuess} disabled={locked || !!over} guessed={guesses.map((g) => g.title)}>
              <button
                type="button"
                onClick={handleSkip}
                disabled={locked || !!over}
                className={`flex h-14 items-center justify-center gap-2 rounded-full bg-grape-deep px-6 font-bold whitespace-nowrap text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink active:translate-y-0.5 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape max-sm:flex-1`}
              >
                <Icon icon={faForwardStep} className="text-[15px]" />
                Pular rodada
              </button>
            </GuessInput>

            <p
              aria-live="polite"
              className={`mt-4 min-h-6 text-[15px] font-semibold ${
                feedback?.kind === "wrong" ? "animate-shake text-danger" : "text-grape-deep"
              }`}
            >
              {feedback && <Icon icon={FEEDBACK_ICON[feedback.kind]} className="mr-1.5" />}
              {feedback?.text}
            </p>
          </div>

        </div>
      </main>

      {/* Acerto na hora: primeiro o "Acertou!" com confete, a janela vem depois (hold) */}
      {result && !hold && (
        <EndCard
          mode="emoji"
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
