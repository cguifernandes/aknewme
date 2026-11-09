"use client";

import {
  faArrowDown,
  faArrowUp,
  faCheck,
  faCircleCheck,
  faCopy,
  faRotateRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import HigherLowerHud from "@/components/HigherLowerHud";
import { Icon } from "@/components/icons";
import SiteHeader from "@/components/SiteHeader";
import { ANIMES, type Anime } from "@/data/animes";
import {
  CATEGORY,
  HL_PATH,
  isRight,
  loadHL,
  medalFor,
  nextAnime,
  saveHL,
  valueOf,
  type Category,
  type Guess,
} from "@/lib/higherLower";
import { track } from "@/lib/pixel";
import { shareOrCopy } from "@/lib/share";

type Round = { left: Anime; right: Anime; cat: Category };
type Phase = "guess" | "right" | "wrong";

/** Tempo com a resposta certa na tela antes da próxima rodada entrar sozinha. */
const NEXT_MS = 1700;
const CHEERS = ["Otaku raiz!", "Na mosca!", "Mandou bem!", "Sabe muito!"];
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const CARD =
  "relative flex min-h-52 flex-col items-center justify-center rounded-[28px] px-5 py-6 text-center shadow-pop-lg md:min-h-104 md:px-6 md:py-9";
const TITLE = "mt-2.5 font-display text-2xl leading-tight font-extrabold text-balance md:mt-3 md:text-4xl";
const NUMBER = "font-display text-6xl leading-none font-extrabold tabular-nums md:text-8xl";
const GUESS_BTN = `group flex items-center justify-center gap-2.5 rounded-2xl py-4 font-bold shadow-pop hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none ${FOCUS}`;

/** Confete do acerto: destino (--dx/--dy) e cor de cada pedacinho. */
const CONFETTI: [number, number, string][] = [
  [-150, -90, "bg-grape"], [150, -100, "bg-blush"], [-170, 20, "bg-sun"], [170, 30, "bg-ink"],
  [-110, 120, "bg-blush"], [120, 130, "bg-grape"], [-50, -150, "bg-ink"], [60, -160, "bg-sun"],
  [-200, -30, "bg-ink"], [200, -40, "bg-grape"], [0, 160, "bg-sun"], [20, -190, "bg-blush"],
];

/** Etiqueta da carta. Na rodada de ano, o ano não aparece (seria a resposta). */
const tag = (a: Anime, cat: Category) => (cat === "year" ? a.studio : `${a.year} · ${a.studio}`);
/** "+" dos animes ainda em exibição ("1100+"). */
const plus = (a: Anime, cat: Category) => (cat === "episodes" && a.episodes.endsWith("+") ? "+" : "");

/** Número revelado subindo até o valor (episódios: do zero; ano: das últimas décadas). */
function CountUp({ to, from }: { to: number; from: number }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setV(to);
    const t0 = performance.now();
    let id = requestAnimationFrame(function tick(t) {
      const p = Math.min(1, (t - t0) / 700);
      setV(Math.round(from + (to - from) * (1 - (1 - p) ** 3)));
      if (p < 1) id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [to, from]);
  return <>{v}</>;
}

/** Mais ou Menos: modo infinito. Acertou, o anime da direita vira o da esquerda; errou, a sequência zera. */
export default function HigherLowerGame() {
  // Sorteio só no cliente (evita mismatch de hidratação); até lá as cartas ficam vazias.
  const [round, setRound] = useState<Round | null>(null);
  const [phase, setPhase] = useState<Phase>("guess");
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [recent, setRecent] = useState<boolean[]>([]);
  /** Total de jogadas da sessão: só para dar `key` estável aos quadradinhos (o novo entra com "pop"). */
  const [plays, setPlays] = useState(0);
  const [copied, setCopied] = useState(false);
  /** Recorde no começo da sequência atual, para o "novo recorde!". */
  const bestBefore = useRef(0);
  /** Títulos vistos há pouco: não repetem tão cedo. */
  const seen = useRef<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function draw(left: Anime, cat: Category): Round {
    const right = nextAnime(ANIMES, left, cat, seen.current);
    seen.current = [...seen.current, right.title].slice(-30);
    return { left, right, cat };
  }

  function start() {
    const left = ANIMES[Math.floor(Math.random() * ANIMES.length)];
    seen.current = [left.title];
    setRound(draw(left, "episodes"));
    setPhase("guess");
    setStreak(0);
  }

  useEffect(() => {
    const saved = loadHL();
    setBest(saved.best);
    setRecent(saved.recent);
    bestBefore.current = saved.best;
    start();
    return () => clearTimeout(timer.current);
  }, []);

  function guess(g: Guess) {
    if (!round || phase !== "guess") return;
    if (streak === 0) track("JogoIniciado", { modo: "maisoumenos" });
    const ok = isRight(round.left, round.right, round.cat, g);
    const newRecent = [...recent, ok].slice(-10);
    const newBest = ok ? Math.max(best, streak + 1) : best;
    setRecent(newRecent);
    setPlays((p) => p + 1);
    setBest(newBest);
    saveHL({ best: newBest, recent: newRecent });
    if (!ok) {
      track("JogoConcluido", { modo: "maisoumenos", pontos: streak });
      return setPhase("wrong");
    }
    setStreak(streak + 1);
    setPhase("right");
    // a categoria troca a cada rodada; quem estava à direita passa para a esquerda
    timer.current = setTimeout(() => {
      setRound(draw(round.right, round.cat === "episodes" ? "year" : "episodes"));
      setPhase("guess");
    }, NEXT_MS);
  }

  function restart() {
    bestBefore.current = best;
    start();
  }

  async function share() {
    const medal = medalFor(streak);
    const text = [
      "🔼🔽 aknewme · Mais ou Menos",
      `Acertei ${streak} ${streak === 1 ? "seguida" : "seguidas"}${medal ? ` e levei a medalha ${medal.name}` : ""}!`,
      "",
      "Consegue passar?",
      `👉 ${location.origin}${HL_PATH}?utm_source=share`,
    ].join("\n");
    if (await shareOrCopy(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const cat = round?.cat ?? "episodes";
  const c = CATEGORY[cat];
  const medal = medalFor(streak);
  // acabou de bater numa medalha? o elogio vira o anúncio dela
  const cheer = medal?.at === streak ? `Medalha ${medal.name}!` : CHEERS[streak % CHEERS.length];
  const newRecord = streak > bestBefore.current;

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
      <SiteHeader />

      <main className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">Mais ou Menos<span className="max-sm:hidden"> · infinito</span></span>
              <span key={streak} className="animate-pop rounded-full bg-track px-4 py-1.5 text-sm font-bold text-ink">
                Rodada {streak + (phase === "right" ? 0 : 1)} · {c.label}
              </span>
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-balance text-ink md:text-5xl">
              {c.question}
            </h1>
          </div>
          <HigherLowerHud streak={streak} best={best} />
        </div>

        {/* linhas iguais (auto-rows-fr): no celular o "VS" cai certinho entre as duas cartas */}
        <div className="relative mt-5 grid auto-rows-fr gap-4 md:mt-7 md:grid-cols-2 md:gap-5">
          {/* esquerda: o anime com o número à mostra */}
          <section key={round ? `l-${round.left.title}` : "l"} className={`${CARD} bg-grape text-white ${round ? "animate-slide-in" : ""}`}>
            {round && (
              <>
                <span className="rounded-full bg-grape-ink px-3 py-1 text-xs font-bold text-lavender">{tag(round.left, cat)}</span>
                <h2 className={TITLE}>{round.left.title}</h2>
                <p className="mt-2 text-sm text-lavender md:mt-3">{c.verb}</p>
                <p className={`${NUMBER} mt-1 text-lime`}>
                  {valueOf(round.left, cat)}
                  {plus(round.left, cat)}
                </p>
                {c.unit && <p className="mt-2 text-sm font-bold">{c.unit}</p>}
              </>
            )}
          </section>

          {/* direita: o palpite; depois o número revelado (verde acertou, rosa errou) */}
          <section
            key={round ? `r-${round.right.title}` : "r"}
            className={`${CARD} overflow-hidden border-2 bg-white text-ink transition-colors duration-300 ${
              phase === "guess" ? "border-lavender" : phase === "right" ? "border-lime" : "border-blush"
            } ${!round ? "" : phase === "wrong" ? "animate-shake" : "animate-slide-in"}`}
          >
            {/* véu de cor por cima do branco: a carta continua opaca sobre o kanji do fundo */}
            <span
              aria-hidden="true"
              className={`absolute inset-0 transition-opacity duration-300 ${
                phase === "guess" ? "opacity-0" : phase === "right" ? "bg-lime/35" : "bg-blush/35"
              }`}
            />
            {phase === "right" &&
              CONFETTI.map(([dx, dy, color], i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  style={{ "--dx": `${dx}px`, "--dy": `${dy}px`, animationDelay: `${i * 25}ms` } as React.CSSProperties}
                  className={`absolute top-1/2 left-1/2 size-3 animate-confetti rounded-sm ${color}`}
                />
              ))}
            {round && (
              <div className="relative flex w-full flex-col items-center">
                <span className="rounded-full bg-track px-3 py-1 text-xs font-bold text-muted">{tag(round.right, cat)}</span>
                <h2 className={TITLE}>{round.right.title}</h2>
                {phase === "guess" ? (
                  <>
                    <p aria-hidden="true" className={`${NUMBER} mt-3 animate-float text-lavender max-md:hidden`}>
                      ?
                    </p>
                    <p className="mt-2 text-sm text-muted md:mt-3">
                      {cat === "episodes" ? "Mais ou menos episódios que" : "Estreou antes ou depois de"} {round.left.title}?
                    </p>
                    <div className="mt-4 grid w-full max-w-sm grid-cols-2 gap-3">
                      <button type="button" onClick={() => guess("more")} className={`${GUESS_BTN} bg-lime text-ink sweep-white`}>
                        <span className="flex size-7 items-center justify-center rounded-full bg-ink text-xs text-lime transition-transform duration-300 ease-spring group-hover:-translate-y-1">
                          <Icon icon={faArrowUp} />
                        </span>
                        {c.more}
                      </button>
                      <button type="button" onClick={() => guess("less")} className={`${GUESS_BTN} bg-grape text-white sweep-ink`}>
                        <span className="flex size-7 items-center justify-center rounded-full bg-white text-xs text-grape transition-transform duration-300 ease-spring group-hover:translate-y-1">
                          <Icon icon={faArrowDown} />
                        </span>
                        {c.less}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm text-muted">{c.verb}</p>
                    <p className={`${NUMBER} mt-1 animate-pop ${phase === "right" ? "text-ink" : "text-danger"}`}>
                      <CountUp to={valueOf(round.right, cat)} from={cat === "year" ? valueOf(round.right, cat) - 30 : 0} />
                      {plus(round.right, cat)}
                    </p>
                    {c.unit && <p className="mt-2 text-sm font-bold">{c.unit}</p>}
                    {phase === "right" ? (
                      <p className="mt-4 animate-pop rounded-full bg-ink px-5 py-2 text-sm font-bold text-lime" style={{ animationDelay: "350ms" }}>
                        {cheer} · próxima rodada…
                      </p>
                    ) : (
                      <>
                        <p className="mt-3 text-sm font-bold">
                          {streak === 0
                            ? "Errou de primeira. Bora de novo?"
                            : `Fim da sequência: ${streak} ${streak === 1 ? "acerto" : "acertos"}${newRecord ? " · novo recorde!" : ""}`}
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                          <button
                            type="button"
                            autoFocus
                            onClick={restart}
                            className={`group inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white shadow-pop sweep-grape active:translate-y-0.5 active:shadow-none ${FOCUS}`}
                          >
                            <Icon icon={faRotateRight} className="transition-transform duration-500 group-hover:rotate-180" />
                            Jogar de novo
                          </button>
                          {streak > 0 && (
                            <button
                              type="button"
                              onClick={share}
                              className={`inline-flex items-center gap-2.5 rounded-full bg-lime px-6 py-3 text-sm font-bold text-ink shadow-pop sweep-white active:translate-y-0.5 active:shadow-none ${FOCUS}`}
                            >
                              {copied ? "Copiado!" : "Compartilhar"} <Icon icon={copied ? faCircleCheck : faCopy} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </section>

          {/* selo do meio: VS → ✓ / ✗ */}
          <span
            key={phase}
            aria-hidden="true"
            className={`absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 animate-pop items-center justify-center rounded-full font-display text-lg font-extrabold shadow-pop ring-4 ring-paper md:size-18 md:text-2xl ${
              phase === "guess" ? "bg-ink text-lime" : phase === "right" ? "bg-lime text-ink" : "bg-blush text-ink"
            }`}
          >
            {phase === "guess" ? "VS" : <Icon icon={phase === "right" ? faCheck : faXmark} />}
          </span>
        </div>

        {/* leitores de tela: o resultado de cada palpite */}
        <p aria-live="polite" className="sr-only">
          {round && phase !== "guess" &&
            `${phase === "right" ? "Acertou" : "Errou"}: ${round.right.title} ${c.verb} ${round.right[cat]} ${c.unit}`}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-h-6 items-center gap-2">
            {recent.length > 0 && (
              <>
                <span className="mr-1 text-sm font-bold text-ink">Últimas jogadas</span>
                {recent.map((ok, i) => (
                  <span
                    key={plays - recent.length + i}
                    aria-label={ok ? "Acertou" : "Errou"}
                    className={`flex size-6 animate-pop items-center justify-center rounded-md text-xs text-ink ${ok ? "bg-lime" : "bg-blush"}`}
                  >
                    <Icon icon={ok ? faCheck : faXmark} />
                  </span>
                ))}
              </>
            )}
          </div>
          <p className="text-sm text-muted">
            A categoria muda a cada rodada: <strong className="text-ink">episódios</strong> e{" "}
            <strong className="text-ink">ano de estreia</strong>.
          </p>
        </div>
      </main>
    </div>
  );
}
