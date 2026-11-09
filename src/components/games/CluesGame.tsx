"use client";

import { useEffect, useState } from "react";
import EndCard from "@/components/EndCard";
import SiteHeader from "@/components/SiteHeader";
import GuessInput from "@/components/GuessInput";
import Truncate from "@/components/Truncate";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Icon, LockIcon } from "@/components/icons";
import {
  playDay,
  getDailyResult,
  isCorrectGuess,
  normalize,
  dailyAnimes,
  recordPlay,
  saveDailyResult,
  trackStart,
  shareText,
  type DailyResult,
} from "@/lib/game";
import { ANIMES, type Anime } from "@/data/animes";

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

/** Célula da comparação: certo (verde), parcial (amarelo), dica de direção ou diferente. */
type Cell = { label: string; value: string; note: string; state: "ok" | "partial" | "hint" | "no" };

/** Como o anime do dia se compara a um palpite errado (ano, estúdio, gênero, episódios). */
function compare(guess: Anime, answer: Anime): Cell[] {
  const num = (label: string, value: string, g: number, a: number, more: string, less: string): Cell =>
    g === a ? { label, value, note: "Igual", state: "ok" } : { label, value, note: a > g ? `↑ ${more}` : `↓ ${less}`, state: "hint" };
  // "Madhouse / J.C.Staff" e "Ação / Aventura": todas as partes em comum = certo; alguma = parcial
  const set = (label: string, g: string, a: string): Cell => {
    const parts = (s: string) => s.split("/").map(normalize);
    const [pg, pa] = [parts(g), parts(a)];
    const common = pg.filter((p) => pa.includes(p)).length;
    if (common === pg.length && common === pa.length) return { label, value: "Todos iguais", note: "Certo", state: "ok" };
    if (common) return { label, value: g, note: "≈ Em comum", state: "partial" };
    return { label, value: g, note: "Diferente", state: "no" };
  };
  const cells = [
    num("Ano", String(guess.year), guess.year, answer.year, "Mais recente", "Mais antigo"),
    set("Estúdio", guess.studio, answer.studio),
    set("Gênero", guess.genre, answer.genre),
  ];
  const [ge, ae] = [parseInt(guess.episodes, 10), parseInt(answer.episodes, 10)];
  if (!Number.isNaN(ge) && !Number.isNaN(ae)) cells.push(num("Episódios", guess.episodes, ge, ae, "Mais eps", "Menos eps"));
  return cells;
}

const CELL: Record<Cell["state"], string> = {
  ok: "bg-lime text-ink",
  partial: "bg-sun text-ink",
  hint: "bg-track text-ink",
  no: "bg-track text-ink",
};

/** Modo Pistas: desafio do dia, um jogo por dia. */
export default function CluesGame() {
  const [day, setDay] = useState(0);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [revealed, setRevealed] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [wrong, setWrong] = useState<Anime[]>([]); // palpites errados, do mais recente ao primeiro
  const [result, setResult] = useState<DailyResult | null>(null);

  useEffect(() => {
    const n = playDay();
    setDay(n);
    // salt diferente dos outros modos
    setAnime(dailyAnimes("pistas", n)[0]);
    // um jogo por dia: restaura o resultado se já jogou hoje
    setResult(getDailyResult("pistas"));
  }, []);

  const header = <SiteHeader />;
  const intro = (
    <>
      <span className="block w-fit rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">
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
                    i < revealed ? "bg-grape-ink text-white" : "bg-grape-deep text-lavender"
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
                      onClick={reveal}
                      className="rounded-full bg-grape px-5 py-2.5 text-sm font-bold text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
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
            <div className="flex items-center justify-between gap-4 rounded-3xl bg-grape p-4 shadow-pop sm:p-6">
              <div>
                <p className="font-bold text-white">Pontos em jogo</p>
                <p className="mt-1 text-sm text-lavender">Cada pista a mais custa 1 ponto.</p>
              </div>
              <p className="font-display text-5xl font-extrabold text-lime sm:text-6xl" aria-label={`${stake} pontos em jogo`}>
                {stake}
              </p>
            </div>

            <p className="mt-6 mb-2 text-[15px] font-semibold text-ink">Seu palpite</p>
            <GuessInput onGuess={handleGuess} disabled={!!over} placeholder="Nome do anime..." stacked />
            {/* Sem texto na tela (a pista nova já mostra o erro), mas o leitor de tela ainda anuncia */}
            <p aria-live="polite" className="sr-only">
              {feedback}
            </p>

            {wrong.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[15px] font-semibold text-ink">Seus palpites vs. anime do dia</p>
                  <ul className="flex gap-1.5 text-[11px] font-bold leading-none" aria-label="Legenda">
                    <li className="rounded-full bg-lime px-2.5 py-1.5 text-ink">Certo</li>
                    <li className="rounded-full bg-sun px-2.5 py-1.5 text-ink">Parcial</li>
                    <li className="rounded-full border border-grape/30 bg-paper px-2.5 py-1.5 text-ink">↑↓ Dica</li>
                  </ul>
                </div>
                <ol className="space-y-3">
                  {wrong.map((g, i) => (
                    <li key={i} className="rounded-2xl bg-grape p-4 shadow-pop">
                      <p className="flex items-center gap-2 font-bold text-white">
                        <span className="flex size-6 items-center justify-center rounded-md bg-paper text-xs font-extrabold text-grape" aria-hidden="true">
                          {wrong.length - i}
                        </span>
                        <s className="text-lavender">{g.title}</s>
                      </p>
                      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {compare(g, anime!).map((c) => (
                          <li key={c.label} className={`rounded-xl px-3 py-2 ${CELL[c.state]}`}>
                            <p className="text-[11px] font-semibold opacity-70">{c.label}</p>
                            <Truncate text={c.value} className="text-sm font-bold" />
                            <p className="mt-0.5 text-xs font-semibold whitespace-nowrap">
                              {c.state === "ok" && <Icon icon={faCheck} className="mr-1" />}
                              {c.state === "no" && <Icon icon={faXmark} className="mr-1" />}
                              {c.note}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        </div>
      </main>

      {result && (
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
    </div>
  );
}
