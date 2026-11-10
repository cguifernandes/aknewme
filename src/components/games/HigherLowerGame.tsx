"use client";

import {
  faCheck,
  faCircleCheck,
  faCopy,
  faDownLong,
  faRotateRight,
  faUpLong,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import AnimeImage from "@/components/AnimeImage";
import HigherLowerHud from "@/components/HigherLowerHud";
import { Icon } from "@/components/icons";
import SiteHeader from "@/components/SiteHeader";
import { ANIMES, type Anime } from "@/data/animes";
import {
  CATEGORY,
  formatValue,
  HL_PATH,
  isRight,
  loadHL,
  medalFor,
  nextAnime,
  nextCategory,
  saveHL,
  valueOf,
  type Category,
  type Guess,
} from "@/lib/higherLower";
import { dailyNumber } from "@/lib/game";
import { sendPlayed } from "@/lib/metrics";
import { track } from "@/lib/pixel";
import { shareOrCopy } from "@/lib/share";

/** Último dia em que este navegador começou uma partida (conta "pessoas" no painel /plays). */
const DAY_KEY = "aknewme.hl.day";

type Round = { left: Anime; right: Anime; cat: Category };
type Phase = "guess" | "right" | "wrong";

/** Tempo com a resposta certa na tela antes da próxima rodada entrar sozinha. */
const NEXT_MS = 1700;
const CHEERS = ["Otaku raiz!", "Na mosca!", "Mandou bem!", "Sabe muito!"];
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
/** Só entram animes com capa (link conferido pelo npm run mal). */
const POOL = ANIMES.filter((a) => a.mal?.image);
// Carta: faixa com a capa em cima (Banner) e o texto embaixo (BODY).
// min-h no celular: as duas cartas ficam do mesmo tamanho e não mudam de altura entre o palpite e a resposta
const CARD = "relative flex min-h-60 flex-col overflow-hidden rounded-[28px] p-2 text-center shadow-pop-lg lg:min-h-120";
const BODY = "relative flex flex-1 flex-col items-center justify-center px-3 pt-3 pb-3 md:px-5 md:pt-4 md:pb-5";
const TITLE = "font-display text-2xl leading-tight font-extrabold text-balance md:text-4xl";
const NUMBER = "font-display text-5xl leading-none font-extrabold tabular-nums md:text-7xl";
const GUESS_BTN = `group flex items-center justify-center gap-1.5 rounded-2xl py-3.5 text-sm font-bold shadow-pop hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none md:gap-2.5 md:py-4 md:text-base ${FOCUS}`;

/**
 * Faixa do topo da carta: a imagem do anime (banner do AniList; link em src/data/animes/mal.ts), só com os
 * cantos arredondados, e a etiqueta no canto. Se a imagem não carregar, some e fica a cor de fundo (`bg`).
 */
function Banner({ anime, label, bg, pill }: { anime: Anime; label: string; bg: string; pill: string }) {
  return (
    <div className={`relative h-20 shrink-0 overflow-hidden rounded-[20px] md:h-44 ${bg}`}>
      <AnimeImage anime={anime} sizes="(min-width: 768px) 828px, 384px" />
      <span className={`absolute bottom-2.5 left-2.5 rounded-full px-3 py-1 text-xs font-bold ${pill}`}>{label}</span>
    </div>
  );
}

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

/** Número revelado subindo até o valor (ano: das últimas décadas; o resto: do zero), no formato da categoria. */
function CountUp({ to, cat }: { to: number; cat: Category }) {
  const from = cat === "year" ? to - 30 : 0;
  const [v, setV] = useState(from);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setV(to);
    const t0 = performance.now();
    let id = requestAnimationFrame(function tick(t) {
      const p = Math.min(1, (t - t0) / 700);
      setV(from + (to - from) * (1 - (1 - p) ** 3));
      if (p < 1) id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [to, from]);
  return <>{formatValue(v, cat)}</>;
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
    const right = nextAnime(POOL, left, cat, seen.current);
    seen.current = [...seen.current, right.title].slice(-30);
    return { left, right, cat };
  }

  function start() {
    const left = POOL[Math.floor(Math.random() * POOL.length)];
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
    if (streak === 0) {
      track("JogoIniciado", { modo: "maisoumenos" });
      // contador do painel /plays; `first` = 1ª partida deste navegador no dia (conta uma pessoa)
      const day = dailyNumber();
      let first = false;
      try {
        first = localStorage.getItem(DAY_KEY) !== String(day);
        localStorage.setItem(DAY_KEY, String(day));
      } catch {}
      sendPlayed({ hl: "start", day, first });
    }
    const ok = isRight(round.left, round.right, round.cat, g);
    const newRecent = [...recent, ok].slice(-10);
    const newBest = ok ? Math.max(best, streak + 1) : best;
    setRecent(newRecent);
    setPlays((p) => p + 1);
    setBest(newBest);
    saveHL({ best: newBest, recent: newRecent });
    if (!ok) {
      track("JogoConcluido", { modo: "maisoumenos", pontos: streak });
      sendPlayed({ hl: "done", day: dailyNumber(), streak });
      return setPhase("wrong");
    }
    setStreak(streak + 1);
    setPhase("right");
    // a categoria troca a cada rodada; quem estava à direita passa para a esquerda
    timer.current = setTimeout(() => {
      setRound(draw(round.right, nextCategory(round.cat, round.right)));
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

      <main className="mt-6 animate-enter">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 md:gap-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">Mais ou Menos<span className="max-sm:hidden"> · infinito</span></span>
              <span className="rounded-full bg-track px-4 py-1.5 text-sm font-bold text-ink">
                Rodada {streak + (phase === "right" ? 0 : 1)} · {c.label}
              </span>
            </div>
            <h1 className="mt-3 font-display text-4xl font-extrabold md:mt-5 tracking-tight text-balance text-ink md:text-5xl">
              {c.question}
            </h1>
          </div>
          <HigherLowerHud streak={streak} best={best} />
        </div>

        <div className="relative mt-5 grid gap-4 md:mt-7 lg:auto-rows-fr lg:grid-cols-2 lg:gap-5">
          {/* esquerda: o anime com o número à mostra. Na abertura as cartas entram com a página (animate-enter);
              só deslizam a partir da 2ª rodada (plays > 0) */}
          <section key={round ? `l-${round.left.title}` : "l"} className={`${CARD} bg-grape text-white ${plays ? "animate-slide-in" : ""}`}>
            {round && (
              <>
                <Banner anime={round.left} label={tag(round.left, cat)} bg="bg-grape-ink" pill="bg-grape-ink text-lavender" />
                <div className={BODY}>
                  <h2 className={TITLE}>{round.left.title}</h2>
                  <p className="mt-3 text-sm text-lavender max-md:hidden">{c.verb}</p>
                  <p className={`${NUMBER} mt-1 text-lime`}>
                    {formatValue(valueOf(round.left, cat), cat)}
                    {plus(round.left, cat)}
                  </p>
                  {c.unit && <p className="mt-1.5 text-sm font-bold md:mt-2">{c.unit}</p>}
                </div>
              </>
            )}
          </section>

          {/* selo do meio: VS → ✓ / ✗. No celular é um item da grade entre as cartas (margem negativa: encosta nas duas);
              lado a lado, fica solto no centro */}
          <span
            key={phase}
            aria-hidden="true"
            className={`relative z-10 mx-auto -my-9 flex size-14 animate-pop lg:absolute lg:top-1/2 lg:left-1/2 lg:m-0 lg:-translate-x-1/2 lg:-translate-y-1/2 items-center justify-center rounded-full font-display text-lg font-extrabold shadow-pop ring-4 ring-paper lg:size-18 lg:text-2xl ${
              phase === "guess" ? "bg-ink text-lime" : phase === "right" ? "bg-lime text-ink" : "bg-blush text-ink"
            }`}
          >
            {phase === "guess" ? "VS" : <Icon icon={phase === "right" ? faCheck : faXmark} />}
          </span>

          {/* direita: o palpite; depois o número revelado (verde acertou, rosa errou) */}
          <section
            key={round ? `r-${round.right.title}` : "r"}
            className={`${CARD} border-2 bg-white text-ink transition-colors duration-300 ${
              phase === "guess" ? "border-lavender" : phase === "right" ? "border-lime" : "border-blush"
            } ${phase === "wrong" ? "animate-shake" : plays ? "animate-slide-in" : ""}`}
          >
            {round && <Banner anime={round.right} label={tag(round.right, cat)} bg="bg-track" pill="bg-white text-ink" />}
            {/* véu de cor por cima do branco (e da capa): a carta continua opaca sobre o kanji do fundo */}
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
              <div className={BODY}>
                <h2 className={TITLE}>{round.right.title}</h2>
                {phase === "guess" ? (
                  <>
                    <p className="mt-1.5 text-sm text-muted md:mt-2">
                      {c.ask} {round.left.title}?
                    </p>
                    <div className="mt-3 grid w-full max-w-md grid-cols-2 gap-2 md:mt-5 md:gap-3">
                      <button type="button" onClick={() => guess("more")} className={`${GUESS_BTN} bg-lime text-ink sweep-white`}>
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs text-lime md:size-7 md:text-sm">
                          <Icon icon={faUpLong} />
                        </span>
                        {c.more}
                      </button>
                      <button type="button" onClick={() => guess("less")} className={`${GUESS_BTN} bg-grape text-white sweep-ink`}>
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs text-grape md:size-7 md:text-sm">
                          <Icon icon={faDownLong} />
                        </span>
                        {c.less}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-3 text-sm text-muted max-md:hidden">{c.verb}</p>
                    <p className={`${NUMBER} mt-1 animate-pop ${phase === "right" ? "text-ink" : "text-danger"}`}>
                      <CountUp to={valueOf(round.right, cat)} cat={cat} />
                      {plus(round.right, cat)}
                    </p>
                    {c.unit && <p className="mt-2 text-sm font-bold max-md:mt-1 max-md:text-xs">{c.unit}</p>}
                    {phase === "right" ? (
                      <p className="mt-4 animate-pop rounded-full bg-ink px-5 py-2 text-sm font-bold text-lime max-md:mt-2.5 max-md:px-4 max-md:py-1.5 max-md:text-xs" style={{ animationDelay: "350ms" }}>
                        {cheer} · próxima rodada…
                      </p>
                    ) : (
                      <>
                        <p className="mt-3 text-sm font-bold max-md:mt-2 max-md:text-xs">
                          {streak === 0
                            ? "Errou de primeira. Bora de novo?"
                            : `Fim da sequência: ${streak} ${streak === 1 ? "acerto" : "acertos"}${newRecord ? " · novo recorde!" : ""}`}
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3 max-md:mt-2.5 max-md:w-full max-md:flex-nowrap max-md:gap-2">
                          <button
                            type="button"
                            autoFocus
                            onClick={restart}
                            className={`group inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-3 text-sm font-bold whitespace-nowrap text-white shadow-pop sweep-grape active:translate-y-0.5 active:shadow-none max-md:flex-1 max-md:gap-1.5 max-md:px-2 max-md:py-2.5 max-md:text-xs ${FOCUS}`}
                          >
                            <Icon icon={faRotateRight} className="transition-transform duration-500 group-hover:rotate-180" />
                            Jogar de novo
                          </button>
                          {streak > 0 && (
                            <button
                              type="button"
                              onClick={share}
                              className={`inline-flex items-center justify-center gap-2.5 rounded-full bg-lime px-6 py-3 text-sm font-bold whitespace-nowrap text-ink shadow-pop sweep-white active:translate-y-0.5 active:shadow-none max-md:flex-1 max-md:gap-1.5 max-md:px-2 max-md:py-2.5 max-md:text-xs ${FOCUS}`}
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

        </div>


        {/* leitores de tela: o resultado de cada palpite */}
        <p aria-live="polite" className="sr-only">
          {round && phase !== "guess" &&
            `${phase === "right" ? "Acertou" : "Errou"}: ${round.right.title} ${c.verb} ${formatValue(valueOf(round.right, cat), cat)} ${c.unit}`}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 max-md:mt-7 max-md:flex-col max-md:justify-center">
          <div className="flex min-h-6 flex-wrap items-center gap-2 max-md:justify-center max-md:gap-1.5">
            {recent.length > 0 && (
              <>
                <span className="mr-1 text-sm font-bold whitespace-nowrap text-ink max-md:text-xs">Últimas jogadas</span>
                {recent.map((ok, i) => (
                  <span
                    key={plays - recent.length + i}
                    aria-label={ok ? "Acertou" : "Errou"}
                    className={`flex size-6 animate-pop items-center justify-center rounded-md text-xs text-ink max-md:size-5 max-md:text-[10px] ${ok ? "bg-lime" : "bg-blush"}`}
                  >
                    <Icon icon={ok ? faCheck : faXmark} />
                  </span>
                ))}
              </>
            )}
          </div>
          <p className="text-sm text-muted max-md:text-center max-md:text-xs">
            Dados:{" "}
            <a
              href="https://myanimelist.net"
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded font-bold text-grape underline underline-offset-4 hover:text-grape-deep ${FOCUS}`}
            >
              MyAnimeList
            </a>{" "}
            · Imagens: AniList
          </p>
        </div>
      </main>
    </div>
  );
}
