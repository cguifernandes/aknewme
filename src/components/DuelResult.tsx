"use client";

import { useEffect, useState } from "react";
import type { Anime } from "@/data/animes";
import { initials, isHit, recordDuel, type Challenge, type Outcome } from "@/lib/challenge";
import { duelLine, summarize } from "@/lib/endcard";
import { OPENING_STAGES, type GameMode } from "@/lib/game";
import { MODAL_DESC, MODAL_TITLE } from "./modalText";
import { dotBg, Tile, tileLabel } from "./ResultTiles";

const TITLE: Record<Outcome, (nick: string) => string> = {
  win: (n) => `Você venceu ${n}!`,
  lose: (n) => `${n} levou essa`,
  tie: (n) => `Empate com ${n}!`,
};
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });
/** Pistas na ordem em que o Modo Pistas abre (animeClues). */
const CLUES = ["Ano de estreia", "Estúdio", "Gênero", "Episódios", "Sinopse"];

/**
 * Aba "Resultado do duelo" do fim de jogo (página aberta por um link de desafio): quem venceu, os dois placares em
 * dois cartões grandes e o placar geral contra esse adversário (guardado só neste navegador).
 * Entra animado toda vez que a aba aparece (`active`): os cartões sobem um de cada lado, o "VS" surge soltando ondas,
 * os quadradinhos estouram um a um e o cartão de quem venceu ganha o selo e fica em lime.
 */
export default function DuelResult({
  mode,
  mine,
  rival,
  result,
  animes,
  active,
  tallyRow = true,
}: {
  mode: GameMode;
  mine: { tiles: string[]; won: boolean };
  rival: Challenge;
  result: Outcome;
  /** Animes do dia (o Emoji cita a rodada que decidiu) */
  animes: Anime[];
  /** A aba está à mostra no carrossel: (re)começa a animação */
  active: boolean;
  /** Mostra o placar geral contra esse adversário embaixo */
  tallyRow?: boolean;
}) {
  const [tally, setTally] = useState<ReturnType<typeof recordDuel> | null>(null);
  // `mine` chega como objeto novo a cada render: fica fora das dependências (não muda com a janela aberta)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setTally(recordDuel(mode, rival, result, mine)), [mode, rival, result]);

  const players = [
    { who: "Você", label: "VC", tiles: mine.tiles, won: mine.won, winner: result === "win" },
    { who: rival.nick, label: initials(rival.nick), tiles: rival.tiles, won: rival.won, winner: result === "lose" },
  ];
  const anim = (name: string) => (active ? name : "");

  return (
    <div key={active ? "on" : "off"} className="flex flex-col">
      <h2 id="end-title" className={`${MODAL_TITLE} ${anim("animate-enter")}`}>
        {TITLE[result](rival.nick)}
      </h2>
      <p className={`${MODAL_DESC} ${anim("animate-enter")}`} style={delay(100)}>
        {duelLine(mode, mine, rival, result, animes)}
      </p>

      <div className="relative mt-4 grid grid-cols-2 gap-3">
        {/* VS no meio dos dois cartões: surge por último e fica soltando ondas */}
        <span aria-hidden="true" className={`absolute top-1/2 left-1/2 z-10 size-11 -translate-1/2 ${anim("animate-pop")}`} style={delay(520)}>
          <span className="absolute inset-0 animate-sonar rounded-full bg-ink" />
          <span className="relative flex size-full items-center justify-center rounded-full bg-ink font-display text-sm font-extrabold text-lime shadow-pop ring-4 ring-white">
            VS
          </span>
        </span>

        {players.map((p, side) => {
          const s = summarize(mode, p.tiles, p.won);
          return (
            <div
              key={p.label}
              style={delay(220 + side * 120)}
              className={`relative flex min-w-0 flex-col items-center overflow-hidden rounded-3xl px-3 py-3 text-center shadow-pop ${anim("animate-enter")} ${
                p.winner ? "bg-lime text-ink" : "bg-grape text-white"
              }`}
            >
              {p.winner && (
                <span className={`absolute top-2.5 rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-lime uppercase ${anim("animate-pop")}`} style={delay(900)}>
                  Venceu
                </span>
              )}
              <span
                aria-hidden="true"
                className={`mt-6 flex size-11 items-center justify-center rounded-full font-display text-sm font-extrabold ring-4 ${
                  p.winner ? "bg-ink text-lime ring-ink/15" : "bg-white text-grape ring-white/25"
                }`}
              >
                {p.label}
              </span>
              <p className={`mt-1.5 max-w-full truncate text-xs font-bold ${p.winner ? "" : "text-lavender"}`}>{p.who}</p>
              <p className="mt-1 font-display text-4xl leading-none font-extrabold tracking-tight">{s.big}</p>
              <p className={`text-xs font-semibold ${p.winner ? "text-ink/70" : "text-lavender"}`}>{s.unit}</p>
              {/* faixa escura atrás: os quadradinhos verdes não somem no cartão verde de quem venceu */}
              <p aria-hidden="true" className="mt-2 flex max-w-full flex-wrap justify-center gap-1 rounded-lg bg-ink p-1.5">
                {p.tiles.map((t, i) => (
                  <span key={i} className={`size-4 rounded ${dotBg(t)} ${anim("animate-pop")}`} style={delay(600 + side * 120 + i * 80)} />
                ))}
              </p>
            </div>
          );
        })}
      </div>

      {/* rodada a rodada: no Emoji, cada anime; na Opening, cada tentativa; no Pistas, cada pista.
          A linha em que alguém acertou fica em destaque, com o recado de quem acertou ali. */}
      <div className={`mt-4 rounded-2xl bg-track p-3 ${anim("animate-enter")}`} style={delay(700)}>
        <p className="mb-1.5 flex items-center justify-between gap-2 px-2 text-[11px] font-bold tracking-wider text-grape uppercase">
          {mode === "emoji" ? "Rodada a rodada" : mode === "opening" ? "Tentativa a tentativa" : "Quem abriu o quê"}
          <span className="flex">
            <span className="w-9 text-center">Você</span>
            <span className="w-9 truncate text-center">{initials(rival.nick)}</span>
          </span>
        </p>
        <ol className="space-y-1">
          {mine.tiles.map((t, i) => {
            const theirs = rival.tiles[i] ?? "⬜";
            const label =
              mode === "emoji" ? (animes[i]?.title ?? `Rodada ${i + 1}`) : mode === "opening" ? `${OPENING_STAGES[i]}s de abertura` : (CLUES[i] ?? `Pista ${i + 1}`);
            // Emoji: destaca as rodadas que um acertou e o outro não; Opening e Pistas: onde cada um acertou
            const me = isHit(t) && (mode !== "emoji" || !isHit(theirs));
            const them = isHit(theirs) && (mode !== "emoji" || !isHit(t));
            const note = me && them ? "os dois acertaram aqui" : me ? "você acertou aqui" : them ? `${rival.nick} acertou aqui` : "";
            return (
              <li key={i} className={`flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm text-ink ${note ? "bg-white" : ""}`}>
                <span className="w-4 shrink-0 text-right text-xs font-bold text-muted tabular-nums">{i + 1}</span>
                <span className="flex min-w-0 flex-1 items-baseline gap-2">
                  <span className="truncate font-semibold">{label}</span>
                  {note && <span className="shrink-0 truncate text-[11px] font-bold text-grape">{note}</span>}
                </span>
                <span className="sr-only">
                  você, {tileLabel(t)}; {rival.nick}, {tileLabel(theirs)}
                </span>
                <span aria-hidden="true" className="flex">
                  <span className="flex w-9 justify-center">
                    <Tile t={t} className="size-5 rounded-md text-[9px]" />
                  </span>
                  <span className="flex w-9 justify-center">
                    <Tile t={theirs} className="size-5 rounded-md text-[9px]" />
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {tallyRow && tally && (
        <p className={`mt-3 flex items-center justify-between gap-2 rounded-2xl bg-track px-4 py-3 text-sm text-muted ${anim("animate-enter")}`} style={delay(800)}>
          <span>Placar geral contra {rival.nick}</span>
          <strong className="font-display text-base text-ink tabular-nums">
            Você {tally.wins} × {tally.losses} {rival.nick}
          </strong>
        </p>
      )}
    </div>
  );
}
