"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Emoji } from "@/components/Emoji";
import { faArrowRight, faPlay } from "@fortawesome/free-solid-svg-icons";
import { CheckIcon, Icon } from "@/components/icons";
import SiteHeader from "@/components/SiteHeader";
import Watermark from "@/components/Watermark";
import {
  dailyNumber,
  getDailyResult,
  getStreak,
  type GameMode,
} from "@/lib/game";

// Prévia do card "ganha vida" enquanto o card está em hover/foco.
const HOP = "group-hover:animate-hop group-focus-visible:animate-hop";
const EQ = "group-hover:animate-eq group-focus-visible:animate-eq";
const CLUE_CARD =
  "flex h-15 w-22 flex-col justify-center rounded-xl px-3 shadow-pop ring-2 ring-white transition duration-300 ease-out";

function ModeCard({
  href,
  badge,
  title,
  description,
  preview,
  done,
}: {
  href: string;
  badge: string;
  title: string;
  description: string;
  preview: React.ReactNode;
  done: boolean;
}) {
  return (
    // O card inteiro é o link: hover em qualquer parte dispara as transições.
    <Link
      href={href}
      aria-label={
        done
          ? `Modo ${title}: feito hoje, ver resultado`
          : `Jogar modo ${title}`
      }
      className="group flex flex-col rounded-[28px] bg-grape p-4 pb-5 shadow-pop transition duration-300 ease-out hover:-translate-y-2 hover:shadow-pop-lg active:translate-y-0 active:duration-75 focus-visible:-translate-y-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-grape"
    >
      <div className="relative flex h-[clamp(7.5rem,16vh,11rem)] flex-col rounded-2xl bg-white p-4 shadow-pop transition duration-300 ease-out">
        <span className="absolute top-4 left-4 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
          {badge}
        </span>
        <div className="flex flex-1 items-center justify-center pt-6">
          {preview}
        </div>
      </div>
      <h2 className="mt-[clamp(0.75rem,2vh,1.25rem)] px-2 font-display text-3xl font-extrabold tracking-tight text-white">
        {title}
      </h2>
      <p className="mt-2 flex-1 px-2 text-[15px] leading-relaxed text-lavender short:mt-1 short:leading-snug">
        {description}
      </p>
      {/* "botão" visual — o clique é do card inteiro */}
      <span
        className={`relative mt-[clamp(0.75rem,2.5vh,1.5rem)] flex items-center justify-center overflow-hidden rounded-full py-3.5 font-bold text-ink transition duration-300 ease-out short:py-3 group-active:translate-y-0.5 group-active:duration-75 ${
          done ? "bg-lime" : "bg-white"
        }`}
      >
        {/* preenchimento que varre da esquerda para a direita */}
        <span
          aria-hidden="true"
          className={`absolute inset-0 -translate-x-full rounded-full transition-transform duration-500 ease-out group-hover:translate-x-0 group-focus-visible:translate-x-0 ${
            done ? "bg-white" : "bg-lime"
          }`}
        />
        {done && (
          <span className="relative mr-2 flex size-5 items-center justify-center rounded-full bg-ink text-lime">
            <CheckIcon />
          </span>
        )}
        <span className="relative">{done ? "Ver resultado" : "Jogar"}</span>
        {/* seta que desliza para dentro */}
        <span
          aria-hidden="true"
          className="relative flex w-0 justify-center overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:ml-2 group-hover:w-4 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:w-4 group-focus-visible:opacity-100"
        >
          <Icon icon={faArrowRight} className="text-[13px]" />
        </span>
      </span>
    </Link>
  );
}

const WAVE_BARS = [
  10, 22, 30, 36, 26, 16, 24, 34, 20, 14, 26, 32, 18, 24, 30, 16, 22, 28, 14,
  20,
];

export default function Home() {
  // Calculado no cliente para o nº do desafio não congelar no build.
  const [n, setN] = useState<number | null>(null);
  const [done, setDone] = useState<Record<GameMode, boolean>>({
    emoji: false,
    opening: false,
    pistas: false,
  });
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    setN(dailyNumber());
    setStreak(getStreak());
    setDone({
      emoji: !!getDailyResult("emoji"),
      opening: !!getDailyResult("opening"),
      pistas: !!getDailyResult("pistas"),
    });
  }, []);
  return (
    // Tela cheia: ocupa 100vh, com o conteúdo centralizado.
    <div className="relative flex min-h-dvh flex-col">
      <Watermark text="アニメ" />
      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 pb-[clamp(1.5rem,5vh,3rem)] md:px-10">
        <SiteHeader />

        <div className="flex mt-6 flex-col justify-center md:mt-12">
          <section className="flex flex-col md:items-start items-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">
                Desafio diário #{n ?? "…"}
              </span>
              {/* no celular a sequência sai do cabeçalho (não cabe com os botões) e aparece aqui */}
              {streak > 0 && (
                <span className="rounded-full bg-grape-deep px-4 py-1.5 text-sm font-bold text-white sm:hidden">
                  {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
                </span>
              )}
            </div>
            <h1 className="mt-2 max-w-3xl md:text-left text-center font-display text-5xl leading-[1.02] font-extrabold tracking-tight text-ink md:text-[clamp(2.5rem,7.5vh,4.5rem)]">
              Quanto de anime <br className="max-md:hidden" />
              você sabe?
            </h1>
            <p className="mt-2 max-w-xl md:text-left text-center text-lg leading-relaxed text-muted short:text-base short:leading-snug">
              Adivinhe o anime pelos emojis, pela opening ou pelas pistas.
            </p>
          </section>

          {/* 3 colunas só a partir de 1024px: no tablet os cards ficavam estreitos e as prévias vazavam */}
          <section className="md:mt-10 mt-16 grid gap-7 short:mt-4 lg:grid-cols-3">
            <ModeCard
              href="/emoji"
              badge="3 vidas"
              done={done.emoji}
              title="Emoji"
              description="Quatro emojis, um anime. Cada erro custa uma vida e libera uma pista."
              preview={
                <div className="flex w-full max-w-sm items-center justify-evenly text-[clamp(2.25rem,5vh,3rem)] leading-none">
                  {["🦊", "🍥", "🍜", "🥷"].map((e, i) => (
                    <span
                      key={e}
                      className={`inline-block ${HOP}`}
                      style={{ animationDelay: `${i * 90}ms` }}
                    >
                      <Emoji e={e} />
                    </span>
                  ))}
                </div>
              }
            />
            <ModeCard
              href="/opening"
              badge="6 tentativas"
              done={done.opening}
              title="Opening"
              description="Ouça 1 segundo da abertura. Não sabe? Pule e ganhe mais alguns segundos."
              preview={
                <div className="flex w-full max-w-sm items-center gap-4 px-2">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-grape transition duration-300 group-hover:scale-110 group-focus-visible:scale-110">
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
              }
            />
            <ModeCard
              href="/clues"
              badge="5 pistas"
              done={done.pistas}
              title="Pistas"
              description="Ano, estúdio, gênero... Quanto menos pistas você usar, mais pontos leva."
              preview={
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
                    className={`${CLUE_CARD} items-center rotate-8 bg-ink group-hover:translate-x-3 group-hover:rotate-14 group-focus-visible:translate-x-3 group-focus-visible:rotate-14`}
                  >
                    <span className="font-display text-4xl leading-none font-extrabold text-lime">
                      ?
                    </span>
                  </div>
                </div>
              }
            />
          </section>

          <p className="mt-[clamp(1rem,3vh,2rem)] text-center">
            <Link
              href="/archive"
              className="rounded text-[15px] font-bold text-grape underline underline-offset-4 hover:text-grape-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
            >
              Já jogou os de hoje? Jogue os desafios anteriores
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
