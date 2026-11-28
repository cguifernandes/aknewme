"use client";

import { faCheck, faForwardStep, faPlay, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import Confetti, { useWinCelebration } from "@/components/Confetti";
import DuelBar from "@/components/DuelBar";
import RescuePanel, { RescueOffer } from "@/components/OpeningRescue";
import EndCard from "@/components/EndCard";
import SiteHeader from "@/components/SiteHeader";
import GuessInput from "@/components/GuessInput";
import Truncate from "@/components/Truncate";
import { Icon } from "@/components/icons";
import OpeningPlayer from "@/components/OpeningPlayer";
import {
  playDay,
  getDailyResult,
  isCorrectGuess,
  dailyAnimes,
  pickOpening,
  rescueChoices,
  dayLevel,
  loadProgress,
  saveProgress,
  OPENING_STAGES,
  recordPlay,
  saveDailyResult,
  trackStart,
  shareText,
  type DailyResult,
} from "@/lib/game";
import { playOpening, type Playback, type Sound } from "@/lib/audio";
import { LEVEL_TAG } from "@/lib/difficulty";
import { recordMove } from "@/lib/moves";
import { RESCUE_SCORE } from "@/lib/stats";
import type { Anime, Opening } from "@/data/animes";
import { BADGE } from "@/components/badge";

/** Segundos liberados em cada tentativa. */
const STAGES = OPENING_STAGES;
/** Erros/pulos até abrir a dica do artista (aparece na 4ª tentativa) e até liberar o resgate (5ª). */
const ARTIST_AT = 3;
const RESCUE_AT = 4;

type Attempt = { kind: "wrong"; guess: string } | { kind: "skip" };

// Volume salvo só neste navegador (conveniência; se falhar, usa o padrão).
const SOUND_KEY = "aknewme.sound";
function loadSound(): Sound {
  try {
    const s = JSON.parse(localStorage.getItem(SOUND_KEY) ?? "null");
    if (typeof s?.volume === "number" && s.volume >= 0 && s.volume <= 1) return { volume: s.volume, muted: !!s.muted };
  } catch {}
  return { volume: 0.8, muted: false };
}

/** Modo Opening: desafio do dia, um jogo por dia. */
export default function OpeningGame() {
  const [day, setDay] = useState(0);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [opening, setOpening] = useState<Opening | null>(null); // qual das aberturas do anime toca
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<DailyResult | null>(null);
  const { shot, hold, celebrate } = useWinCelebration(); // só no acerto na hora; resultado restaurado não dispara
  const [audioError, setAudioError] = useState(false);
  const [sound, setSound] = useState<Sound>({ volume: 0.8, muted: false });
  /** Já abriu o modo resgate: daqui em diante qualquer acerto conta "com resgate" (mesmo voltando ao palpite) */
  const [rescue, setRescue] = useState(false);
  /** Mostrando as 4 alternativas agora (dá para voltar ao palpite) */
  const [rescueOpen, setRescueOpen] = useState(false);
  const playbackRef = useRef<Playback | null>(null);

  useEffect(() => {
    setSound(loadSound());
    const n = playDay();
    setDay(n);
    // salt diferente do modo emoji para os modos não repetirem o mesmo anime
    const a = dailyAnimes("opening", n)[0];
    setAnime(a);
    setOpening(pickOpening(a, n)); // mesma abertura para todo mundo no dia
    // um jogo por dia: restaura o resultado se já jogou hoje
    setResult(getDailyResult("opening"));
    // Partida pela metade: volta com as tentativas já gastas (e no resgate, se já tinha trocado)
    const p = loadProgress<{ attempts: Attempt[]; rescue: boolean }>("opening");
    if (p && p.attempts.length < STAGES.length) {
      setAttempts(p.attempts);
      setRescue(p.rescue);
      setRescueOpen(p.rescue);
    }
    return () => playbackRef.current?.stop();
  }, []);

  // Salva a cada tentativa (ou ao trocar pelo resgate)
  useEffect(() => {
    if (anime && !result && (attempts.length || rescue)) saveProgress("opening", { attempts, rescue });
  }, [anime, result, attempts, rescue]);

  // Trocou de janela (alt+tab) ou escondeu a aba: para o trecho.
  useEffect(() => {
    const stop = () => {
      if (!playbackRef.current) return;
      playbackRef.current.stop();
      playbackRef.current = null;
      setPlaying(false);
      setElapsed(0);
    };
    const onVisibility = () => document.hidden && stop();
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const level = day ? dayLevel(day) : null;
  const header = (
    <>
      <SiteHeader />
      <DuelBar />
    </>
  );
  const intro = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`${BADGE} bg-lime text-ink`}>
          Modo Opening · desafio #{day || "…"}
        </span>
        {level && (
          <span className={`${BADGE} text-ink ${LEVEL_TAG[level].className}`}>
            {LEVEL_TAG[level].label}
          </span>
        )}
      </div>
      <h1 className="mt-5 font-display text-4xl font-extrabold text-balance tracking-tight text-ink md:text-5xl">
        De qual anime é essa abertura?
      </h1>
    </>
  );
  // Enquanto sorteia o desafio, cabeçalho e título já saem no HTML (SEO, sem tela em branco/salto).
  if (!anime || !opening)
    return (
      <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
        {header}
        <main className="mt-6 animate-enter">{intro}</main>
      </div>
    );
  const over = !!result;

  const attempt = Math.min(attempts.length, STAGES.length - 1);
  const unlocked = STAGES[attempt];
  const nextDelta = attempt < STAGES.length - 1 ? STAGES[attempt + 1] - STAGES[attempt] : 0;

  function stopPlayback() {
    playbackRef.current?.stop();
    playbackRef.current = null;
    setPlaying(false);
  }

  function changeSound(next: Sound) {
    setSound(next);
    playbackRef.current?.setSound(next); // vale na hora, mesmo tocando
    try {
      localStorage.setItem(SOUND_KEY, JSON.stringify(next));
    } catch {}
  }

  function togglePlay() {
    if (playing) {
      stopPlayback();
      setElapsed(0);
      return;
    }
    const done = () => {
      setPlaying(false);
      setElapsed(0);
      playbackRef.current = null;
    };
    setAudioError(false);
    setPlaying(true);
    playbackRef.current = playOpening(
      opening!.audioSrc!, // pickOpening só sorteia aberturas com áudio
      unlocked,
      sound,
      (e) => setElapsed(e),
      done,
      () => {
        done();
        setAudioError(true);
      },
    );
  }

  /** `tried` = tentativas erradas/puladas até o fim da partida; `rescued` = acertou pelas 4 alternativas */
  function endGame(kind: "won" | "lost", tried: Attempt[], rescued = false) {
    if (kind === "won") celebrate(true);
    stopPlayback();
    setElapsed(0);
    const won = kind === "won";
    const squares: string[] = tried.map((a) => (a.kind === "skip" ? "⬛" : "🟥"));
    if (won) squares.push(rescued ? "🟨" : "🟩");
    const grid = squares.join("") + "⬜".repeat(STAGES.length - squares.length);
    const secs = STAGES[tried.length];
    const line = !won
      ? "Essa abertura me pegou 😵"
      : rescued
        ? "Acertei a abertura com resgate! 🛟"
        : secs === 1
          ? "Reconheci a abertura em 1 segundo! 🎧🔥"
          : `Reconheci a abertura em ${secs} segundos! 🎧`;
    const r = {
      won,
      answer: anime!.title,
      // a tentativa já aparece nos quadradinhos
      detail: `"${opening!.name}" · ${opening!.artist}${rescued ? " · com resgate" : ""}`,
      share: shareText("opening", won, line, grid),
      grid,
      score: won ? (rescued ? RESCUE_SCORE : tried.length + 1) : null,
      tries: [...tried.map((a) => (a.kind === "skip" ? "" : a.guess)), ...(won ? [anime!.title] : [])],
    };
    setResult(saveDailyResult("opening", r));
    recordPlay();
  }

  function advance(entry: Attempt) {
    if (over) return;
    trackStart("opening");
    stopPlayback();
    setElapsed(0);
    const next = [...attempts, entry];
    setAttempts(next);
    if (next.length >= STAGES.length) endGame("lost", next);
  }

  function handleGuess(guess: string) {
    if (over) return;
    trackStart("opening");
    recordMove("opening", { t: "guess", g: guess });
    if (isCorrectGuess(guess, anime!)) endGame("won", attempts, rescue);
    else advance({ kind: "wrong", guess });
  }

  // Modo resgate: a resposta e mais 3 aberturas do banco, na mesma ordem para todo mundo no dia.
  const choices = rescue ? rescueChoices(anime, day) : [];

  function choose(title: string) {
    if (over) return;
    recordMove("opening", { t: "choose", g: title });
    if (isCorrectGuess(title, anime!)) endGame("won", attempts, true);
    else endGame("lost", [...attempts, { kind: "wrong", guess: title }]);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
      {header}

      <main className="mt-6 animate-enter">
        {intro}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <OpeningPlayer
            anime={anime}
            opening={opening}
            over={over}
            playing={playing}
            elapsed={elapsed}
            unlocked={unlocked}
            stages={STAGES}
            attempt={attempt}
            nextDelta={nextDelta}
            sound={sound}
            audioError={audioError}
            onToggle={togglePlay}
            onSkip={() => {
              if (!over) recordMove("opening", { t: "skip" });
              advance({ kind: "skip" });
            }}
            onSound={changeSound}
          />

          {/* Palpite + tentativas */}
          <section>
            {rescueOpen && !over ? (
              <RescuePanel choices={choices} onChoose={choose} onBack={() => setRescueOpen(false)} />
            ) : (
              <>
                <p className="mb-2 text-[15px] font-semibold text-ink">Seu palpite</p>
                <GuessInput onGuess={handleGuess} disabled={!!over} guessed={attempts.flatMap((a) => (a.kind === "wrong" ? [a.guess] : []))} />
                {!over && attempts.length >= RESCUE_AT && (
                  <RescueOffer
                    onOpen={() => {
                      trackStart("opening");
                      if (!rescue) recordMove("opening", { t: "rescue" });
                      setRescue(true);
                      setRescueOpen(true);
                    }}
                  />
                )}
              </>
            )}

            {/* Linha do tempo das 6 tentativas: bolinha + tempo + o que aconteceu (ou o que libera ali) */}
            <ol className="mt-6" aria-label="Tentativas">
              {STAGES.map((s, i) => {
                const past = attempts[i];
                const current = i === attempts.length && !over;
                const win = over && result?.won && i === attempts.length; // a tentativa do acerto
                const [dot, icon, text] = past
                  ? past.kind === "skip"
                    ? ["bg-lavender text-ink", faForwardStep, <span key="t" className="text-muted">Pulou</span>]
                    : [
                        "bg-blush text-ink",
                        faXmark,
                        <Truncate key="t" text={past.guess} className="text-ink/70 line-through decoration-blush decoration-2">
                          <span className="sr-only">Errou: </span>
                        </Truncate>,
                      ]
                  : win
                    ? ["bg-lime text-ink", faCheck, <span key="t" className="font-bold text-ink">{result?.score === RESCUE_SCORE ? "Acertou com resgate" : "Acertou!"}</span>]
                    : current
                      ? ["bg-grape text-white ring-4 ring-grape/20", faPlay, <span key="t" className="font-bold text-ink">Sua vez</span>]
                      : [
                          "border-2 border-dashed border-grape/40 bg-paper",
                          null,
                          !over && i === ARTIST_AT ? <span key="t" className="text-muted">Abre a dica do artista</span>
                          : !over && i === RESCUE_AT ? <span key="t" className="text-muted">Libera o modo resgate</span>
                          : null,
                        ];
                return (
                  <li key={s} className="relative flex items-start gap-4 pb-5 text-[15px] last:pb-0">
                    {i < STAGES.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={`absolute top-9 bottom-1 left-4 w-0.5 -translate-x-1/2 rounded-full ${i < attempts.length ? "bg-grape" : "bg-grape/20"}`}
                      />
                    )}
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs ${dot}`} aria-hidden="true">
                      {icon && <Icon icon={icon} />}
                    </span>
                    <span className={`w-9 shrink-0 text-sm leading-8 font-bold ${past || win || current ? "text-grape" : "text-grape/50"}`}>{s}s</span>
                    <span className="flex min-h-8 min-w-0 flex-1 flex-col justify-center">
                      {text}
                      {/* Dica do artista: aparece na própria linha em que abre e fica até o fim */}
                      {i === ARTIST_AT && attempts.length >= ARTIST_AT && (
                        <span className="mt-1.5 flex w-fit animate-pop items-center gap-2 rounded-full bg-sun px-3 py-1 text-sm text-ink">
                          <span>
                            <span className="font-bold">Dica:</span> cantada por {opening.artist} · anime de {anime.year}
                          </span>
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </main>

      {/* Acerto na hora: primeiro o "Acertou!" com confete, a janela vem depois (hold) */}
      {result && !hold && (
        <EndCard
          mode="opening"
          won={result.won}
          answer={result.answer}
          detail={result.detail}
          share={result.share}
          grid={result.grid}
          score={result.score}
          tries={result.tries}
        />
      )}
      <Confetti shot={shot} label="Acertou!" />
    </div>
  );
}
