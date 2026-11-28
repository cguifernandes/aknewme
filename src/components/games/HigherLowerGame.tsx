"use client";

import {
  faCheck,
  faCircleCheck,
  faCopy,
  faArrowDown,
  faArrowUp,
  faRotateRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import { BADGE } from "@/components/badge";
import { Banner } from "@/components/HigherLowerFacts";
import HigherLowerHud from "@/components/HigherLowerHud";
import ThemeSelect from "@/components/HigherLowerThemes";
import { LIME_DARKEN } from "@/components/buttons";
import { Icon } from "@/components/icons";
import { THEMES_ENABLED } from "@/lib/features";
import SiteHeader from "@/components/SiteHeader";
import { ANIMES, type Anime } from "@/data/animes";
import { ANILIST_UPDATED } from "@/data/animes/anilist";
import {
  categoriesFor,
  CATEGORY,
  formatValue,
  guessLabels,
  guessQuestion,
  HL_PATH,
  isRight,
  loadHL,
  loadTheme,
  medalFor,
  nextAnime,
  nextCategory,
  saveHL,
  saveTheme,
  themeOf,
  themePool,
  THEMES,
  valueOf,
  type Category,
  type Guess,
  type ThemeId,
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
/** Banco, categorias em jogo e tamanho de cada tema (favoritos só liga com 90% de cobertura no banco do tema). */
const BY_THEME = Object.fromEntries(
  THEMES.map((t) => {
    const pool = themePool(POOL, t.id);
    return [t.id, { pool, cats: categoriesFor(pool) }];
  }),
) as Record<ThemeId, { pool: Anime[]; cats: Category[] }>;
/** "2026-11-26" → "26/11/2026" (dia em que os favoritos foram lidos do AniList). */
const FAVOURITES_DATE = ANILIST_UPDATED.split("-").reverse().join("/");
// Carta (specs/mais-ou-menos/01-ficha-favoritos-temas.md, seção 6): as duas são iguais. Imagem em cima com as etiquetas
// (Banner), nome, e o valor centralizado embaixo do nome (o número; "?" na carta do palpite) com a unidade.
// No celular são compactas: as duas e os botões cabem em 375×667 sem rolar.
const CARD = "relative flex flex-col overflow-hidden rounded-[22px] p-1.5 text-center shadow-pop md:rounded-[28px] md:p-2 md:shadow-pop-lg lg:min-h-120";
const BODY = "relative flex flex-1 flex-col items-center justify-center px-3 pt-1 pb-1 md:px-5 md:pt-4 md:pb-5";
const TITLE = "font-display leading-tight font-extrabold text-balance max-sm:w-full max-sm:truncate max-sm:leading-6 sm:text-2xl md:text-4xl";
/**
 * Tamanho do nome no celular: sempre numa linha só (20 px; nome comprido diminui, e o muito comprido corta com "…"),
 * para as duas cartas terem a mesma altura e caberem em 375×667 com os botões.
 */
const titleSize = (title: string) => (title.length <= 20 ? "max-sm:text-xl" : title.length <= 27 ? "max-sm:text-base" : title.length <= 36 ? "max-sm:text-sm" : "max-sm:text-xs");
const NUMBER = "font-display text-3xl leading-none font-extrabold tabular-nums md:mt-2 md:text-7xl";
/** Pílula da categoria em cada carta, entre o nome e o valor ("ANO DE ESTREIA"): o que se compara na rodada. */
const CAT_TAG = "mt-1 rounded-full bg-lime px-3 py-0.5 text-[10px] font-extrabold tracking-wide text-ink uppercase md:mt-2 md:px-4 md:py-1 md:text-xs";
/** Botões do fim de partida (na carta e na faixa fixa do celular). */
const END_BTN = `inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold whitespace-nowrap active:translate-y-0.5 sm:h-auto sm:rounded-full sm:px-6 sm:py-3 ${FOCUS}`;
/**
 * Faixa fixa no fim da tela, só no celular (até 640 px): só os botões da vez (Mais e Menos; no fim, Jogar de novo e
 * Compartilhar), com 44 px de altura e sem texto de apoio. Respeita a área segura do aparelho; a página ganha espaço
 * embaixo (pb-20) para nada ficar escondido atrás dela. Fica fora do <main>, que anima com transform.
 */
const BAR = "fixed inset-x-0 bottom-0 z-30 border-t-2 border-track bg-paper px-6 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:hidden";
const GUESS_BTN = `group flex h-11 items-center justify-center gap-1.5 rounded-2xl text-[15px] font-extrabold hover:-translate-y-0.5 active:translate-y-0.5 md:h-auto md:gap-2.5 md:py-4 md:text-base md:font-bold ${FOCUS}`;

/** Confete do acerto: destino (--dx/--dy) e cor de cada pedacinho. */
const CONFETTI: [number, number, string][] = [
  [-150, -90, "bg-grape"], [150, -100, "bg-blush"], [-170, 20, "bg-sun"], [170, 30, "bg-ink"],
  [-110, 120, "bg-blush"], [120, 130, "bg-grape"], [-50, -150, "bg-ink"], [60, -160, "bg-sun"],
  [-200, -30, "bg-ink"], [200, -40, "bg-grape"], [0, 160, "bg-sun"], [20, -190, "bg-blush"],
];

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
  /** Tema da partida (Todos os animes ou um dos 2 temas de teste); cada um tem banco, recorde e medalhas próprios. */
  const [theme, setTheme] = useState<ThemeId>("all");
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

  function draw(left: Anime, cat: Category, t: ThemeId): Round {
    const { pool } = BY_THEME[t];
    const right = nextAnime(pool, left, cat, seen.current);
    // "vistos há pouco": até 30, mas nunca mais que metade do banco (tema pequeno não fica sem carta nova)
    seen.current = [...seen.current, right.title].slice(-Math.min(30, Math.floor(pool.length / 2)));
    return { left, right, cat };
  }

  function start(t: ThemeId) {
    const { pool } = BY_THEME[t];
    const left = pool[Math.floor(Math.random() * pool.length)];
    seen.current = [left.title];
    setRound(draw(left, "episodes", t));
    setPhase("guess");
    setStreak(0);
  }

  /** Abre o tema: o recorde e as últimas jogadas dele, e uma partida nova. */
  function open(t: ThemeId) {
    const saved = loadHL(t);
    setTheme(t);
    setBest(saved.best);
    setRecent(saved.recent);
    bestBefore.current = saved.best;
    start(t);
  }

  useEffect(() => {
    // temas fora da tela (THEMES_ENABLED): sempre "Todos os animes", com o recorde dele
    open(THEMES_ENABLED ? loadTheme() : "all");
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Com uma sequência em andamento o tema fica travado: escolhe-se antes da partida (ou depois de perder). */
  const locked = streak > 0 && phase !== "wrong";
  function pickTheme(t: ThemeId) {
    if (locked || t === theme) return;
    clearTimeout(timer.current);
    saveTheme(t);
    open(t);
  }

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
      sendPlayed({ hl: "start", day, first, theme });
    }
    const ok = isRight(round.left, round.right, round.cat, g);
    const newRecent = [...recent, ok].slice(-10);
    const newBest = ok ? Math.max(best, streak + 1) : best;
    setRecent(newRecent);
    setPlays((p) => p + 1);
    setBest(newBest);
    saveHL({ best: newBest, recent: newRecent }, theme);
    if (!ok) {
      track("JogoConcluido", { modo: "maisoumenos", pontos: streak });
      sendPlayed({ hl: "done", day: dailyNumber(), streak, theme });
      return setPhase("wrong");
    }
    setStreak(streak + 1);
    setPhase("right");
    // a categoria troca a cada rodada; quem estava à direita passa para a esquerda
    timer.current = setTimeout(() => {
      setRound(draw(round.right, nextCategory(round.cat, round.right, BY_THEME[theme].cats), theme));
      setPhase("guess");
    }, NEXT_MS);
  }

  function restart() {
    bestBefore.current = best;
    start(theme);
  }

  async function share() {
    const medal = medalFor(streak);
    const text = [
      `🔼🔽 aknewme · Mais ou Menos${theme === "all" ? "" : ` · ${themeOf(theme).label}`}`,
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
  /** Os botões com o texto do modo ("Depois de 2019", "Mais episódios"...) */
  const labels = round ? guessLabels(cat, round.left) : { more: c.more, less: c.less };
  const medal = medalFor(streak);
  // acabou de bater numa medalha? o elogio vira o anúncio dela
  const cheer = medal?.at === streak ? `Medalha ${medal.name}!` : CHEERS[streak % CHEERS.length];
  const newRecord = streak > bestBefore.current;

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 max-sm:pb-20 md:px-10">
      <SiteHeader />

      <main className="mt-6 animate-enter max-sm:mt-0">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 max-sm:gap-y-1.5 md:gap-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className={`${BADGE} bg-lime text-ink`}>Mais ou Menos<span className="max-sm:hidden"> · infinito</span></span>
              <span className={`${BADGE} bg-track text-ink`}>Rodada {streak + (phase === "right" ? 0 : 1)}</span>
            </div>
            {/* título fixo e curto (uma linha em 375 e 1280); o que comparar fica no selo grande junto das cartas */}
            <h1 className="mt-1 font-display text-xl leading-tight font-extrabold tracking-tight whitespace-nowrap text-ink sm:mt-3 sm:text-4xl md:mt-5 md:text-5xl">
              Compare os dois animes
            </h1>
          </div>
          <HigherLowerHud streak={streak} best={best} theme={THEMES_ENABLED ? <ThemeSelect value={theme} onChange={pickTheme} locked={locked} /> : undefined} />
        </div>

        <div className="relative mt-2 grid gap-2.5 sm:mt-5 sm:gap-4 md:mt-7 lg:auto-rows-fr lg:grid-cols-2 lg:gap-5">
          {/* esquerda (em cima, no celular): o anime com o número à mostra. Na abertura as cartas entram com a página
              (animate-enter); só deslizam a partir da 2ª rodada (plays > 0) */}
          <section key={round ? `l-${round.left.title}` : "l"} className={`${CARD} bg-grape text-white ${plays ? "animate-slide-in" : ""}`}>
            {round && (
              <>
                <Banner anime={round.left} cat={cat} bg="bg-grape-ink" tag="bg-grape-deep text-white" />
                <div className={BODY}>
                  <h2 className={`${TITLE} ${titleSize(round.left.title)}`} title={round.left.title}>
                    {round.left.title}
                  </h2>
                  <span className={CAT_TAG}>{c.tag}</span>
                  <p className={`${NUMBER} text-lime`}>
                    {formatValue(valueOf(round.left, cat), cat)}
                    {plus(round.left, cat)}
                  </p>
                </div>
              </>
            )}
          </section>

          {/* selo do meio: VS → ✓ / ✗. No celular é um item da grade entre as cartas (margem negativa: encosta nas duas);
              lado a lado, fica solto no centro */}
          <span
            key={phase}
            aria-hidden="true"
            className={`relative z-10 mx-auto -my-[1.625rem] flex size-10 animate-pop text-[13px] sm:-my-9 sm:size-14 sm:text-lg lg:absolute lg:top-1/2 lg:left-1/2 lg:m-0 lg:-translate-x-1/2 lg:-translate-y-1/2 items-center justify-center rounded-full font-display font-extrabold shadow-pop ring-[3px] ring-paper sm:ring-4 lg:size-18 lg:text-2xl ${
              phase === "guess" ? "bg-ink text-lime" : phase === "right" ? "bg-lime text-ink" : "bg-blush text-ink"
            }`}
          >
            {phase === "guess" ? "VS" : <Icon icon={phase === "right" ? faCheck : faXmark} />}
          </span>

          {/* direita: o palpite; depois o número revelado (verde acertou, rosa errou) */}
          <section
            key={round ? `r-${round.right.title}` : "r"}
            className={`${CARD} border-2 bg-white text-ink transition-colors duration-300 ${
              phase === "guess" ? "border-mist" : phase === "right" ? "border-lime" : "border-blush"
            } ${phase === "wrong" ? "animate-shake" : plays ? "animate-slide-in" : ""}`}
          >
            {/* as etiquetas nunca trazem o dado da rodada (cardFacts): na de episódios, a carta não mostra os episódios */}
            {round && <Banner anime={round.right} cat={cat} bg="bg-track" tag="bg-white text-ink" />}
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
                <h2 className={`${TITLE} ${titleSize(round.right.title)}`} title={round.right.title}>
                  {round.right.title}
                </h2>
                <span className={CAT_TAG}>{c.tag}</span>
                {phase === "guess" ? (
                  <>
                    {/* o valor a adivinhar: "?" no lugar do número, com a mesma unidade embaixo */}
                    <p className={`${NUMBER} text-grape`} aria-hidden="true">
                      ?
                    </p>
                    {/* a pergunta com o texto do modo e os botões na carta: do sm para cima (no celular, os botões, com o
                        mesmo texto, ficam na faixa fixa, e a pergunta só para leitor de tela) */}
                    <p className="mt-3 text-sm font-semibold text-ink max-sm:sr-only">{guessQuestion(cat, round.left, round.right)}</p>
                    <div className="mt-3 grid w-full max-w-md grid-cols-2 gap-2 max-sm:hidden md:mt-4 md:gap-3">
                      <button type="button" onClick={() => guess("more")} className={`${GUESS_BTN} ${LIME_DARKEN}`}>
                        {/* ícone do Font Awesome, do tamanho e da cor do texto; no hover/foco o lime-deep entra da esquerda para a direita (LIME_DARKEN) */}
                        <Icon icon={faArrowUp} />
                        {labels.more}
                      </button>
                      <button type="button" onClick={() => guess("less")} className={`${GUESS_BTN} bg-grape text-white sweep-ink`}>
                        <Icon icon={faArrowDown} />
                        {labels.less}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className={`${NUMBER} animate-pop ${phase === "right" ? "text-ink" : "text-danger"}`}>
                      <CountUp to={valueOf(round.right, cat)} cat={cat} />
                      {plus(round.right, cat)}
                    </p>
                    {phase === "right" ? (
                      // no celular o elogio não aparece: a carta não muda de altura (o selo do meio vira ✓)
                      <p className="mt-4 animate-pop rounded-full bg-ink px-5 py-2 text-sm font-bold text-lime max-sm:hidden" style={{ animationDelay: "350ms" }}>
                        {cheer} · próxima rodada…
                      </p>
                    ) : (
                      <>
                        <p className="mt-3 text-sm font-bold max-md:mt-1 max-md:text-xs">
                          {streak === 0
                            ? "Errou de primeira. Bora de novo?"
                            : `Fim da sequência: ${streak} ${streak === 1 ? "acerto" : "acertos"}${newRecord ? " · novo recorde!" : ""}`}
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3 max-sm:hidden max-md:mt-2.5 max-md:w-full max-md:flex-nowrap max-md:gap-2">
                          <button
                            type="button"
                            autoFocus
                            onClick={restart}
                            className={`group inline-flex items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-3 text-sm font-bold whitespace-nowrap text-white sweep-grape active:translate-y-0.5 max-md:flex-1 max-md:gap-1.5 max-md:px-2 max-md:py-2.5 max-md:text-xs ${FOCUS}`}
                          >
                            <Icon icon={faRotateRight} className="transition-transform duration-500 group-hover:rotate-180" />
                            Jogar de novo
                          </button>
                          {streak > 0 && (
                            <button
                              type="button"
                              onClick={share}
                              className={`inline-flex items-center justify-center gap-2.5 rounded-full bg-lime px-6 py-3 text-sm font-bold whitespace-nowrap text-ink sweep-lime-deep active:translate-y-0.5 max-md:flex-1 max-md:gap-1.5 max-md:px-2 max-md:py-2.5 max-md:text-xs ${FOCUS}`}
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
            {BY_THEME[theme].cats.includes("favourites") && <> · Favoritos: AniList, lidos em {FAVOURITES_DATE}</>}
          </p>
        </div>
      </main>

      {round && (
        <div className={BAR}>
          {phase === "wrong" ? (
            <div className="flex gap-2">
              <button type="button" onClick={restart} className={`group ${END_BTN} flex-1 bg-ink text-white sweep-grape`}>
                <Icon icon={faRotateRight} className="transition-transform duration-500 group-hover:rotate-180" />
                Jogar de novo
              </button>
              {streak > 0 && (
                <button type="button" onClick={share} className={`${END_BTN} flex-1 bg-lime text-ink sweep-lime-deep`}>
                  {copied ? "Copiado!" : "Compartilhar"} <Icon icon={copied ? faCircleCheck : faCopy} />
                </button>
              )}
            </div>
          ) : (
            // entre o acerto e a próxima rodada os botões ficam no lugar, desligados (a faixa não muda de altura)
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => guess("more")} disabled={phase !== "guess"} className={`${GUESS_BTN} ${LIME_DARKEN} disabled:opacity-50`}>
                <Icon icon={faArrowUp} />
                {labels.more}
              </button>
              <button type="button" onClick={() => guess("less")} disabled={phase !== "guess"} className={`${GUESS_BTN} bg-grape text-white sweep-ink disabled:opacity-50`}>
                <Icon icon={faArrowDown} />
                {labels.less}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
