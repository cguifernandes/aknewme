"use client";

import { useEffect, useState } from "react";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import ArchiveCard from "@/components/ArchiveCard";
import HigherLowerCard from "@/components/HigherLowerCard";
import { Icon } from "@/components/icons";
import ModeCard from "@/components/ModeCard";
import NewModeDialog from "@/components/NewModeDialog";
import SiteHeader from "@/components/SiteHeader";
import Watermark from "@/components/Watermark";
import {
  dailyNumber,
  EPOCH_UTC,
  getDailyResult,
  getStreak,
  type DailyResult,
  type GameMode,
} from "@/lib/game";

// Prévia do card "ganha vida" enquanto o card está em hover/foco.
const HOP = "group-hover:animate-hop group-focus-visible:animate-hop";
const EQ = "group-hover:animate-eq group-focus-visible:animate-eq";
const CLUE_CARD =
  "flex h-15 w-22 flex-col justify-center rounded-xl px-3 shadow-pop ring-2 ring-white transition duration-500 ease-spring";

const WAVE_BARS = [
  10, 22, 30, 36, 26, 16, 24, 34, 20, 14, 26, 32, 18, 24, 30, 16, 22, 28, 14,
  20,
];

/** Prévia de cada modo no card (anima no hover do card). */
const PREVIEWS: Record<GameMode, React.ReactNode> = {
  emoji: (
    <div className="flex w-full max-w-sm items-center justify-evenly text-[clamp(2.25rem,5vh,3rem)] leading-none">
      {["🦊", "🍥", "🍜", "🥷"].map((e, i) => (
        <span
          key={e}
          className={`inline-block ${HOP}`}
          style={{ animationDelay: `${i * 90}ms` }}
        >
          {e}
        </span>
      ))}
    </div>
  ),
  opening: (
    <div className="flex w-full max-w-sm items-center gap-4 px-2">
      <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-grape transition duration-300 group-hover:scale-110 group-focus-visible:scale-110">
        {/* onda sonora do player do Modo Opening: o trecho "toca" no hover */}
        <span className="absolute inset-0 rounded-full border-2 border-grape opacity-0 group-hover:animate-sonar group-focus-visible:animate-sonar" />
        <Icon icon={faPlay} className="text-[15px] text-white" />
      </span>
      {/* min-w-0 + overflow: em caixas estreitas as barras que sobram são cortadas, não vazam */}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-0.75 overflow-hidden">
        {WAVE_BARS.map((h, i) => (
          <span
            key={i}
            style={{
              height: h,
              animationDelay: `${(i % 7) * 70}ms`,
            }}
            className={`w-1.5 rounded-full ${EQ} ${i % 3 === 0 ? "bg-grape-deep" : "bg-lavender"}`}
          />
        ))}
      </div>
    </div>
  ),
  pistas: (
    // Leque de cartas de pista: duas reveladas e uma virada; abre no hover.
    // Telas baixas ou 3 colunas estreitas (1024–1279px): leque menor para caber aberto.
    <div
      className="flex items-center short:translate-y-1.5 short:scale-[0.82] lg:max-xl:scale-[0.82]"
      aria-hidden="true"
    >
      <div
        className={`${CLUE_CARD} -rotate-8 bg-grape group-hover:-translate-x-3 group-hover:-rotate-14 group-focus-visible:-translate-x-3 group-focus-visible:-rotate-14`}
      >
        <span className="text-[10px] font-bold tracking-wider text-lavender uppercase">
          Ano
        </span>
        <span className="font-display text-xl leading-tight font-extrabold text-white">
          2009
        </span>
      </div>
      <div
        className={`${CLUE_CARD} relative z-10 -mx-3 -translate-y-1.5 bg-grape group-hover:-translate-y-3 group-focus-visible:-translate-y-3`}
      >
        <span className="text-[10px] font-bold tracking-wider text-lavender uppercase">
          Estúdio
        </span>
        <span className="font-display text-xl leading-tight font-extrabold text-white">
          Bones
        </span>
      </div>
      <div
        // a carta virada desvira no hover e revela a próxima pista, como no jogo
        className={`${CLUE_CARD} relative items-center rotate-8 bg-ink transform-3d group-hover:translate-x-3 group-hover:rotate-14 group-hover:rotate-y-180 group-focus-visible:translate-x-3 group-focus-visible:rotate-14 group-focus-visible:rotate-y-180`}
      >
        <span className="font-display text-4xl leading-none font-extrabold text-lime backface-hidden">
          ?
        </span>
        <div className="absolute inset-0 flex rotate-y-180 flex-col justify-center rounded-xl bg-grape px-3 backface-hidden">
          <span className="text-[10px] font-bold tracking-wider text-lavender uppercase">
            Gênero
          </span>
          <span className="font-display text-xl leading-tight font-extrabold text-white">
            Ação
          </span>
        </div>
      </div>
    </div>
  ),
};

/**
 * Mesma conta do dailyNumber (src/lib/game.ts), rodando direto no HTML: preenche o selo "Desafio diário #N"
 * antes de o React carregar, para o número não aparecer como "…" e trocar depois. Não faz requisição nenhuma.
 */
const DAY_SCRIPT = `(function(){var d=new Date(),n=Math.max(1,Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-${EPOCH_UTC})/864e5)+1);document.currentScript.previousElementSibling.textContent="Desafio diário #"+n})()`;

export default function Home() {
  // Calculado no cliente para o nº do desafio não congelar no build.
  // No navegador o número já nasce certo (data local do jogador). No HTML do servidor não dá para saber o dia
  // de quem vai abrir: sai "…" e o DAY_SCRIPT, logo depois do selo, troca pelo número antes da primeira pintura.
  const [n] = useState<number | null>(() => (typeof window === "undefined" ? null : dailyNumber()));
  // null = ainda lendo o localStorage: os cards ficam em espera (ver ModeCard) em vez de mostrar a prévia e trocar depois
  const [done, setDone] = useState<Record<GameMode, DailyResult | null> | null>(null);
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    setStreak(getStreak());
    setDone({
      emoji: getDailyResult("emoji"),
      opening: getDailyResult("opening"),
      pistas: getDailyResult("pistas"),
    });
  }, []);
  return (
    // Tela cheia: ocupa 100vh, com o conteúdo centralizado.
    <div className="relative flex min-h-dvh flex-col">
      <Watermark text="アニメ" />
      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 pb-[clamp(1.5rem,5vh,3rem)] md:px-10">
        <SiteHeader />

        <div className="flex mt-2 flex-col justify-center md:mt-3">
          <section className="flex animate-enter flex-col md:items-start items-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span suppressHydrationWarning className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">
                {`Desafio diário #${n ?? "…"}`}
              </span>
              <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: DAY_SCRIPT }} />
              {/* no celular a sequência sai do cabeçalho (não cabe com os botões) e aparece aqui */}
              {streak > 0 && (
                <span className="rounded-full bg-grape-deep px-4 py-1.5 text-sm font-bold text-white sm:hidden">
                  {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
                </span>
              )}
            </div>
            <h1 className="mt-5 max-w-3xl md:text-left text-center font-display text-4xl leading-[1.02] font-extrabold tracking-tight text-balance text-ink md:text-5xl">
              Quanto de anime você sabe?
            </h1>
            <p className="mt-2 max-w-xl md:text-left text-center text-lg leading-relaxed text-muted short:text-base short:leading-snug">
              Adivinhe o anime pelos emojis, pela opening ou pelas pistas.
            </p>
          </section>

          {/* 3 colunas só a partir de 1024px: no tablet os cards ficavam estreitos e as prévias vazavam */}
          <section style={{ animationDelay: "80ms" }} className="mt-6 grid animate-enter md:mt-7 gap-7 short:mt-4 lg:grid-cols-3">
            <ModeCard
              mode="emoji"
              href="/emoji"
              badge="3 vidas"
              result={done?.emoji}
              description="Quatro emojis, um anime. Cada erro custa uma vida e libera uma pista."
              preview={PREVIEWS.emoji}
            />
            <ModeCard
              mode="opening"
              href="/opening"
              badge="6 tentativas"
              result={done?.opening}
              description="Ouça 1 segundo da abertura. Não sabe? Pule e ganhe mais alguns segundos."
              preview={PREVIEWS.opening}
            />
            <ModeCard
              mode="pistas"
              href="/clues"
              badge="5 pistas"
              result={done?.pistas}
              description="Ano, estúdio, gênero... Quanto menos pistas você usar, mais pontos leva."
              preview={PREVIEWS.pistas}
            />
          </section>

          {/* abaixo dos diários: o modo infinito (2 colunas) e o atalho para os desafios anteriores */}
          <section style={{ animationDelay: "160ms" }} className="mt-7 grid animate-enter gap-7 lg:grid-cols-3">
            <HigherLowerCard />
            <ArchiveCard />
          </section>
        </div>
      </main>
      {/* lançamento do Mais ou Menos: abre sozinha uma vez */}
      <NewModeDialog when />
    </div>
  );
}
