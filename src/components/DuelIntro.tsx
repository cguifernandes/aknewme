"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cleanNick, DUEL_RULE, initials, loadNick, readChallenge, saveNick, sendDuelStatus, type Challenge } from "@/lib/challenge";
import { challengeLine } from "@/lib/endcard";
import { dayLabel, getDailyResult, MODE_LABEL, type GameMode } from "@/lib/game";
import SiteHeader from "./SiteHeader";
import DuelAvatar from "./DuelAvatar";
import { LockIcon } from "./icons";
import Logo from "./Logo";
import CluesGame from "./games/CluesGame";
import EmojiGame from "./games/EmojiGame";
import OpeningGame from "./games/OpeningGame";

/** O que é "o mesmo desafio" em cada modo. */
const SAME: Record<GameMode, string> = {
  emoji: "Os mesmos 5 enigmas de emoji, com 3 vidas por rodada.",
  opening: "A mesma abertura, começando por 1 segundo dela.",
  pistas: "O mesmo anime, com as mesmas 5 pistas.",
};
/** O que são os "?" do cartão: as jogadas de quem desafiou, escondidas. */
const MOVES: Record<GameMode, { title: string; text: (nick: string) => string }> = {
  emoji: { title: "As rodadas", text: (n) => `O placar já está aí. Cada "?" esconde como foi uma rodada de ${n}: de primeira, depois de errar ou pulada. No empate, ganha quem acertou mais de primeira.` },
  opening: { title: "As tentativas", text: (n) => `Cada "?" é uma tentativa possível. As que ${n} usou aparecem quando você terminar.` },
  pistas: { title: "As pistas", text: (n) => `Cada "?" é uma pista. As que ${n} abriu aparecem quando você terminar.` },
};
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

const MODES = Object.keys(MODE_LABEL) as GameMode[];
/** O jogo de cada modo: o duelo roda aqui mesmo no /duel (lê o desafio da mesma URL). */
const GAMES: Record<GameMode, () => React.JSX.Element> = { emoji: EmojiGame, opening: OpeningGame, pistas: CluesGame };

/**
 * Convite do duelo, na página /duel (o link que quem desafiou manda): o placar de quem desafiou, sem as jogadas
 * (os "?"). "Aceitar desafio" troca o convite pelo jogo do modo, na mesma página e URL (faixa "Duelo com…" e a
 * comparação no fim). Quem já jogou aquele dia vê direto o jogo, onde a janela de resultado já mostra o duelo.
 */
export default function DuelIntro() {
  const [playing, setPlaying] = useState(false);
  /** undefined = ainda lendo a URL; null = link quebrado */
  const [state, setState] = useState<{ mode: GameMode; c: Challenge } | null | undefined>(undefined);
  const [nick, setNick] = useState("");

  useEffect(() => {
    const m = new URLSearchParams(location.search).get("m") as GameMode;
    const c = readChallenge();
    if (!MODES.includes(m) || !c) return setState(null);
    setState({ mode: m, c });
    if (getDailyResult(m)) return setPlaying(true); // já jogou: direto para a comparação
    setNick(loadNick()); // já tem apelido salvo: vem preenchido, dá para trocar
    sendDuelStatus(c, "opened"); // quem desafiou vê que o convite foi aberto
  }, []);

  const header = <SiteHeader />;
  if (state === undefined) return <div className="mx-auto max-w-7xl px-6 md:px-10">{header}</div>;
  if (state === null)
    return (
      <div className="mx-auto max-w-7xl px-6 pb-12 md:px-10">
        {header}
        <main className="mt-6 animate-enter">
          <h1 className="font-display text-4xl font-extrabold text-ink">Esse desafio não abriu</h1>
          <p className="mt-2 text-muted">O link pode ter sido cortado, ou o desafio é de um dia que ainda não chegou aqui.</p>
          <Link href="/" className="mt-6 inline-block rounded-full bg-lime px-7 py-3.5 font-bold text-ink sweep-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape">
            Jogar o desafio de hoje
          </Link>
        </main>
      </div>
    );

  const { mode, c } = state;
  if (playing) {
    const Game = GAMES[mode];
    return <Game />;
  }
  function accept(e: React.FormEvent) {
    e.preventDefault();
    const name = cleanNick(nick);
    if (!name) return;
    saveNick(name);
    sendDuelStatus(c, "playing");
    setPlaying(true);
    scrollTo(0, 0);
  }

  const steps = [
    ["Você joga o mesmo desafio", SAME[mode]],
    ["Sem espiar", `As jogadas de ${c.nick} só aparecem quando você terminar.`],
    ["Lado a lado", "No fim, vocês veem quem venceu. Aí é só pedir revanche."],
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 pb-12 md:px-10">
        {header}

        <main className="mt-4 grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* o cartão surge e o conteúdo entra em cascata: quem desafiou, a pergunta, os "?" um a um e o botão */}
          <section className="animate-pop overflow-hidden rounded-3xl bg-grape text-white shadow-pop-lg">
            <div className="p-6 sm:p-9">
              <div className="flex animate-enter items-center gap-4" style={delay(150)}>
                <span className="relative shrink-0">
                  <span aria-hidden="true" className="absolute inset-0 animate-sonar rounded-full bg-lime" />
                  <DuelAvatar label={initials(c.nick)} tone="lime" className="relative size-14 text-lg" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-lavender">
                    Desafio #{c.day} · {MODE_LABEL[mode]} · {dayLabel(c.day)}
                  </p>
                  <p className="truncate font-display text-2xl font-extrabold">{c.nick} te desafiou</p>
                </div>
              </div>
              <h1 className="mt-6 animate-enter font-display text-4xl leading-tight font-extrabold text-balance md:text-5xl" style={delay(280)}>
                {challengeLine(mode, c.tiles, c.won, c.day)} Consegue bater?
              </h1>

              <div className="mt-6 animate-enter rounded-2xl bg-grape-deep p-4" style={delay(400)}>
                <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-lime uppercase">
                  <LockIcon /> {MOVES[mode].title} de {c.nick}
                </p>
                <p aria-hidden="true" className="mt-3 flex flex-wrap gap-2">
                  {c.tiles.map((_, i) => (
                    // por fora surge (um a um); por dentro fica piscando em onda
                    <span key={i} className="animate-pop" style={delay(550 + i * 90)}>
                      <span className="flex size-11 animate-pulse items-center justify-center rounded-xl bg-grape font-bold text-lavender" style={delay(i * 180)}>
                        ?
                      </span>
                    </span>
                  ))}
                </p>
                <p className="mt-3 text-sm text-lavender">{MOVES[mode].text(c.nick)}</p>
              </div>
            </div>

            {/* o apelido vem antes de jogar: é o nome que aparece para os dois no fim */}
            <form
              onSubmit={accept}
              className="flex animate-enter flex-col gap-3 bg-grape-deep px-6 py-5 sm:flex-row sm:items-center sm:px-9"
              style={delay(650)}
            >
              <div className="min-w-0 flex-1">
                <label htmlFor="duel-nick" className="text-xs font-bold tracking-wider text-lime uppercase">
                  Seu apelido
                </label>
                <input
                  id="duel-nick"
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  maxLength={20}
                  required
                  placeholder="Digite seu apelido"
                  autoComplete="nickname"
                  className="mt-1.5 block w-full rounded-full bg-white px-4 py-3 text-sm font-bold text-ink placeholder:font-semibold placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
                />
              </div>
              <button
                type="submit"
                disabled={!cleanNick(nick)}
                className="shrink-0 self-end rounded-full bg-lime px-8 py-3 text-sm font-bold text-ink sweep-white active:translate-y-0.5 disabled:opacity-60 max-sm:self-stretch focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Aceitar desafio
              </button>
            </form>
          </section>

          <section className="animate-enter" style={delay(300)}>
            <h2 className="font-display text-2xl font-extrabold text-ink">Como funciona o duelo</h2>
            <ol className="mt-4 space-y-3">
              {steps.map(([title, text], i) => (
                <li key={title} className="flex gap-4 rounded-2xl bg-track p-4">
                  <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-grape text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-ink">{title}</p>
                    <p className="text-sm text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-2xl border-2 border-dashed border-grape/30 px-4 py-3 text-sm text-muted">
              <strong className="text-ink">Quem vence?</strong> {DUEL_RULE[mode]}
            </p>
            {/* /api/duel guarda as respostas por 14 dias (TTL no Redis) */}
            <p className="mt-3 px-1 text-xs text-muted">O duelo vale por 14 dias: depois disso, os placares somem.</p>
          </section>
        </main>
    </div>
  );
}
