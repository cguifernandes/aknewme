"use client";

import { faForwardStep, faPlay, faStop } from "@fortawesome/free-solid-svg-icons";
import AnimeImage from "@/components/AnimeImage";
import { Icon } from "@/components/icons";
import VolumeControl from "@/components/VolumeControl";
import type { Sound } from "@/lib/audio";
import type { Anime, Opening } from "@/data/animes";

/** Barras da onda: alturas fixas (em %) que parecem uma música; cada barra é um pedaço do trecho total. */
const BARS = Array.from({ length: 56 }, (_, i) => 28 + Math.round(72 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.55))));

type Props = {
  anime: Anime;
  opening: Opening;
  over: boolean;
  playing: boolean;
  /** Segundos já tocados do trecho atual */
  elapsed: number;
  /** Segundos liberados nesta tentativa */
  unlocked: number;
  /** Segundos de cada tentativa (o último é o trecho inteiro) */
  stages: number[];
  /** Índice da tentativa atual (0 = 1ª) */
  attempt: number;
  /** Quantos segundos o "Pular" libera (0 = última tentativa, sem pular) */
  nextDelta: number;
  sound: Sound;
  audioError: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onSound: (s: Sound) => void;
};

/** Player do Modo Opening: disco + segundos liberados, onda que acende com o trecho e controles. */
export default function OpeningPlayer({
  anime,
  opening,
  over,
  playing,
  elapsed,
  unlocked,
  stages,
  attempt,
  nextDelta,
  sound,
  audioError,
  onToggle,
  onSkip,
  onSound,
}: Props) {
  const total = stages.at(-1)!;
  return (
    <section className="self-start rounded-3xl bg-grape p-6 text-white shadow-pop-lg sm:p-7" aria-label="Player da abertura">
      <div className="flex items-center gap-5 sm:gap-7">
        <div className="relative isolate size-24 shrink-0 sm:size-36">
          {/* Ondas sonoras saindo do disco enquanto toca */}
          {playing &&
            [0, 0.6, 1.2].map((delay) => (
              <span
                key={delay}
                aria-hidden="true"
                className="motion-always absolute inset-0 -z-10 animate-sonar rounded-full border-2 border-lime"
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
          {/* O disco gira sempre e só pausa: ao parar, fica no ângulo em que estava. Revelado, volta a girar. */}
          <div
            className={`motion-always relative flex size-full animate-spin-slow items-center justify-center rounded-full bg-vinyl ring-6 ring-white/8 ${playing || over ? "" : "[animation-play-state:paused]"}`}
          >
            <span className="absolute inset-3 rounded-full border border-white/10" aria-hidden="true" />
            <span className="absolute inset-7 rounded-full border border-white/10" aria-hidden="true" />
            {/* miolo "OP"; no fim, cresce e vira a capa do anime (se a imagem falhar, fica o "OP") */}
            <span
              className={`motion-always relative flex items-center justify-center overflow-hidden rounded-full bg-lime text-sm font-bold text-ink transition-[width,height] duration-500 ease-spring ${
                over ? "size-20 ring-4 ring-lime sm:size-24" : "size-11 ring-4 ring-grape-ink sm:size-14"
              } ${playing ? "animate-beat" : ""}`}
            >
              OP
              {over && <AnimeImage anime={anime} kind="cover" sizes="128px" />}
            </span>
          </div>
        </div>

        {over ? (
          // fim de jogo: o anime, a música e o caminho para ouvir inteira
          <div className="min-w-0 flex-1 animate-pop">
            <p className="font-display text-2xl leading-tight font-extrabold text-balance sm:text-3xl">{anime.title}</p>
            <p className="mt-1 text-sm text-lavender">
              “{opening.name}” · {opening.artist}
            </p>
            {opening.appleMusic && (
              <a
                href={opening.appleMusic}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ouvir a abertura inteira no Apple Music (abre em nova aba)"
                className="mt-4 inline-flex rounded-full bg-lime px-5 py-2.5 text-sm font-bold text-ink shadow-pop sweep-white active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Ouvir a abertura inteira
              </a>
            )}
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">Começa no refrão</span>
            {/* no celular não cabe ao lado do disco: fica só a etiqueta */}
            <p className="mt-2 text-sm leading-relaxed text-lavender max-sm:hidden">
              O trecho sai da parte mais famosa da música, não dos primeiros segundos.
            </p>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-4xl">
              {unlocked} {unlocked === 1 ? "segundo" : "segundos"}{" "}
              <span className="font-sans text-sm font-bold tracking-normal whitespace-nowrap text-lavender/70 sm:text-base">
                {unlocked === 1 ? "liberado" : "liberados"}
              </span>
            </p>
          </div>
        )}
      </div>

      {!over && (
        <>
          {/* Onda: barras brancas = trecho liberado; apagadas = ainda bloqueado; verde = já tocou. Linha = onde está tocando. */}
          <div className="relative mt-6 flex h-16 items-center gap-0.75" aria-hidden="true">
            {BARS.map((h, j) => {
              const t = ((j + 0.5) / BARS.length) * total;
              const color = playing && t <= elapsed ? "bg-lime" : t <= unlocked ? "bg-white" : "bg-white/20";
              return <span key={j} style={{ height: `${h}%` }} className={`min-w-0 flex-1 rounded-full transition-colors ${color}`} />;
            })}
            {playing && (
              <span
                className="absolute inset-y-0 w-0.5 rounded-full bg-white shadow-[0_0_0_2px] shadow-grape"
                style={{ left: `${Math.min(100, (elapsed / total) * 100)}%` }}
              />
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <button
              type="button"
              onClick={onToggle}
              aria-label={playing ? "Parar" : "Tocar trecho"}
              className="flex size-14 items-center justify-center rounded-full bg-lime text-ink shadow-pop sweep-white active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Icon icon={playing ? faStop : faPlay} className="text-[17px]" />
            </button>
            {nextDelta > 0 && (
              <button
                type="button"
                onClick={onSkip}
                className="flex items-center gap-2 rounded-full border-2 border-white/40 px-5 py-3 font-bold text-white hover:border-white/70 sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Icon icon={faForwardStep} className="text-[15px]" />
                Pular · +{nextDelta}s
              </button>
            )}
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-lavender">
                Tentativa {attempt + 1} de {stages.length}
              </span>
              <VolumeControl sound={sound} onChange={onSound} />
            </div>
          </div>
          {audioError && (
            <p role="alert" className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-danger">
              Não foi possível tocar o áudio. Verifique sua conexão e tente de novo.
            </p>
          )}
        </>
      )}
    </section>
  );
}
