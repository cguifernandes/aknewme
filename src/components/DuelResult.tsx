"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import type { Anime } from "@/data/animes";
import {
  initials,
  isHit,
  recordDuel,
  type Challenge,
  type Outcome,
} from "@/lib/challenge";
import { duelLine, summarize } from "@/lib/endcard";
import { dailyNumber, MODE_LABEL, OPENING_STAGES, type GameMode } from "@/lib/game";
import { MODAL_DESC, MODAL_TITLE } from "./modalText";
import { Icon } from "./icons";
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
  /** quando o duelo terminou (agora, ao mostrar o resultado): o "Hoje, 00:11" do acordeão */
  const [finishedAt] = useState(() => Date.now());
  const [tally, setTally] = useState<ReturnType<typeof recordDuel> | null>(
    null,
  );
  // `mine` chega como objeto novo a cada render: fica fora das dependências (não muda com a janela aberta)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(
    () => setTally(recordDuel(mode, rival, result, mine)),
    [mode, rival, result],
  );

  const players = [
    {
      who: "Você",
      label: "VC",
      tiles: mine.tiles,
      won: mine.won,
      winner: result === "win",
    },
    {
      who: rival.nick,
      label: initials(rival.nick),
      tiles: rival.tiles,
      won: rival.won,
      winner: result === "lose",
    },
  ];
  const anim = (name: string) => (active ? name : "");

  return (
    <div key={active ? "on" : "off"} className="flex flex-col">
      <h2 id="end-title" className={`${MODAL_TITLE} ${anim("animate-enter")}`}>
        {TITLE[result](rival.nick)}
      </h2>
      <p
        className={`${MODAL_DESC} ${anim("animate-enter")}`}
        style={delay(100)}
      >
        {duelLine(mode, mine, rival, result, animes)}
      </p>

      <div className="relative mt-4 grid grid-cols-2 gap-3">
        {/* VS no meio dos dois cartões: surge por último e fica soltando ondas */}
        <span
          aria-hidden="true"
          className={`absolute top-1/2 left-1/2 z-10 size-11 -translate-1/2 ${anim("animate-pop")}`}
          style={delay(520)}
        >
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
                <span
                  className={`absolute top-2.5 rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-lime uppercase ${anim("animate-pop")}`}
                  style={delay(900)}
                >
                  Venceu
                </span>
              )}
              <span
                aria-hidden="true"
                className={`mt-6 flex size-11 items-center justify-center rounded-full font-display text-sm font-extrabold ring-4 ${
                  p.winner
                    ? "bg-ink text-lime ring-ink/15"
                    : "bg-white text-grape ring-white/25"
                }`}
              >
                {p.label}
              </span>
              <p
                className={`mt-1.5 max-w-full truncate text-xs font-bold ${p.winner ? "" : "text-lavender"}`}
              >
                {p.who}
              </p>
              <p className="mt-1 font-display text-4xl leading-none font-extrabold tracking-tight">
                {s.big}
              </p>
              <p
                className={`text-xs font-semibold ${p.winner ? "text-ink/70" : "text-lavender"}`}
              >
                {s.unit}
              </p>
              {/* faixa escura atrás: os quadradinhos verdes não somem no cartão verde de quem venceu */}
              <p
                aria-hidden="true"
                className="mt-2 flex max-w-full flex-wrap justify-center gap-1 rounded-lg bg-ink p-1.5"
              >
                {p.tiles.map((t, i) => (
                  <span
                    key={i}
                    className={`size-4 rounded ${dotBg(t)} ${anim("animate-pop")}`}
                    style={delay(600 + side * 120 + i * 80)}
                  />
                ))}
              </p>
            </div>
          );
        })}
      </div>

      {/* o mesmo acordeão do duelo na janela Duelos: "Emoji #203", "Hoje, 00:11", o placar, o resultado e a seta;
          fechado por padrão, e abrir mostra o rodada a rodada */}
      <DuelAccordion
        as="div"
        mode={mode}
        day={rival.day}
        sub={when({ day: rival.day, t: finishedAt }, dailyNumber())}
        me={short(mode, mine.tiles, mine.won)}
        them={short(mode, rival.tiles, rival.won)}
        outcome={result}
        rounds={{ mine, rival, animes }}
        className={`mt-4 ${anim("animate-enter")}`}
        style={delay(700)}
      />

      {tallyRow && tally && (
        <p
          className={`mt-3 flex items-center justify-between gap-2 rounded-2xl bg-track px-4 py-3 text-sm text-muted ${anim("animate-enter")}`}
          style={delay(800)}
        >
          <span>Placar geral contra {rival.nick}</span>
          <strong className="font-display text-base text-ink tabular-nums">
            Você {tally.wins} × {tally.losses} {rival.nick}
          </strong>
        </p>
      )}
    </div>
  );
}

/**
 * "Rodada a rodada" do duelo: no Emoji, cada anime; na Opening, cada tentativa; no Pistas, cada pista. As duas colunas
 * (você e o rival) têm largura fixa. Usado no fim de jogo e em cada duelo aberto do Meus duelos.
 * Fica dentro do DuelAccordion (aberto), na janela Duelos e no resultado do duelo.
 */
export function DuelRounds({
  mode,
  mine,
  rival,
  animes,
  className = "",
  box = "rounded-2xl bg-track p-3",
  style,
}: {
  mode: GameMode;
  mine: { tiles: string[] };
  rival: { nick: string; tiles: string[] };
  animes: Anime[];
  className?: string;
  /** Caixa em volta (sem ela, fica direto no fundo de quem usa) */
  box?: string;
  style?: React.CSSProperties;
}) {
  const title =
    mode === "emoji"
      ? "Rodada a rodada"
      : mode === "opening"
        ? "Tentativa a tentativa"
        : "Quem abriu o quê";
  // a linha em que alguém acertou fica em destaque, com o recado de quem acertou ali
  return (
    <div className={`${box} ${className}`} style={style}>
        <p className="mb-1.5 flex items-center justify-between gap-2 px-2 text-[11px] font-bold tracking-wider text-grape uppercase">
          {title}
          <span className="flex shrink-0">
            <span className="w-10 text-center">Você</span>
            <span className="w-10 truncate text-center">
              {initials(rival.nick)}
            </span>
          </span>
        </p>
        <ol className="space-y-1">
          {mine.tiles.map((t, i) => {
            const theirs = rival.tiles[i] ?? "⬜";
            const label =
              mode === "emoji"
                ? (animes[i]?.title ?? `Rodada ${i + 1}`)
                : mode === "opening"
                  ? `${OPENING_STAGES[i]}s de abertura`
                  : (CLUES[i] ?? `Pista ${i + 1}`);
            // Emoji: destaca as rodadas que um acertou e o outro não; Opening e Pistas: onde cada um acertou
            const me = isHit(t) && (mode !== "emoji" || !isHit(theirs));
            const them = isHit(theirs) && (mode !== "emoji" || !isHit(t));
            const note =
              me && them
                ? "Os dois acertaram aqui"
                : me
                  ? "Você acertou aqui"
                  : them
                    ? `${rival.nick} acertou aqui`
                    : "";
            return (
              <li
                key={i}
                className={`flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm text-ink ${note ? "bg-white" : ""}`}
              >
                <span className="w-4 shrink-0 text-right text-xs font-bold text-muted tabular-nums">
                  {i + 1}
                </span>
                {/* o recado vai embaixo do nome: lado a lado, um apelido longo empurrava os quadradinhos no celular */}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold">{label}</span>
                  {note && (
                    <span className="truncate text-[11px] leading-tight font-bold text-grape">
                      {note}
                    </span>
                  )}
                </span>
                <span className="sr-only">
                  você, {tileLabel(t)}; {rival.nick}, {tileLabel(theirs)}
                </span>
                <span aria-hidden="true" className="flex shrink-0">
                  <span className="flex w-10 justify-center">
                    <Tile t={t} className="size-5 rounded-md text-[9px]" />
                  </span>
                  <span className="flex w-10 justify-center">
                    <Tile t={theirs} className="size-5 rounded-md text-[9px]" />
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
    </div>
  );
}

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
/** Resultado do duelo em pílula: "Venceu" lime, "Perdeu" blush, "Empate" sun */
export const PILL: Record<Outcome, [string, string]> = {
  win: ["Venceu", "bg-lime"],
  lose: ["Perdeu", "bg-blush"],
  tie: ["Empate", "bg-sun"],
};
/** Placar curto: no Emoji só os acertos ("4"), nos outros o número de tentativas/pistas. */
export const short = (mode: GameMode, tiles: string[], won: boolean) => summarize(mode, tiles, won).big.replace(/\/\d+$/, "");
export const hhmm = (t: number) => new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
/** Quando o duelo foi: "Hoje, 19:40", "Ontem, 20:02", "Há 3 dias" (sem a hora, quando não foi guardada). */
export function when(d: { day: number; t?: number }, today: number) {
  const day = d.day === today ? "Hoje" : d.day === today - 1 ? "Ontem" : `Há ${today - d.day} dias`;
  return d.t ? `${day}, ${hhmm(d.t)}` : day;
}

/**
 * Um duelo em acordeão, fechado por padrão (o mesmo na janela Duelos e no resultado do duelo): à esquerda o duelo
 * ("Emoji #203") e quando foi ("Hoje, 00:11"); à direita o placar grande ("0 x 2"), a pílula do resultado e a seta.
 * Aberto: a linha divisória e o rodada a rodada (DuelRounds). Sem as jogadas (`rounds` null), só a linha, sem abrir.
 */
export function DuelAccordion({
  mode,
  day,
  sub,
  me,
  them,
  outcome,
  rounds,
  as: Tag = "li",
  name,
  className = "",
  style,
}: {
  mode: GameMode;
  day: number;
  sub: string;
  /** placar curto de cada lado; null quando não foi guardado */
  me: string | null;
  them: string | null;
  outcome: Outcome;
  rounds: { mine: { tiles: string[] }; rival: { nick: string; tiles: string[] }; animes: Anime[] } | null;
  as?: "li" | "div";
  /** grupo de acordeões (abrir um fecha os outros), como na lista da janela Duelos */
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const row = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">
          {MODE_LABEL[mode]} #{day}
        </span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
      {/* largura fixa: o placar e o selo ficam alinhados de uma linha para a outra */}
      <span className="w-14 shrink-0 text-center font-display text-lg font-extrabold">
        {me && them && (
          <>
            {me} <span className="text-sm text-muted">x</span> {them}
          </>
        )}
      </span>
      <span className={`w-14 shrink-0 rounded-full py-1 text-center text-[11px] font-bold text-ink ${PILL[outcome][1]}`}>{PILL[outcome][0]}</span>
    </>
  );
  if (!rounds)
    return (
      <Tag className={`flex items-center gap-2 rounded-2xl bg-track px-4 py-3 ${className}`} style={style}>
        {row}
        <span aria-hidden="true" className="w-3 shrink-0" />
      </Tag>
    );
  return (
    <Tag className={`rounded-2xl bg-track px-4 ${className}`} style={style}>
      <details name={name} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary className={`flex cursor-pointer list-none items-center gap-2 rounded-xl py-3 [&::-webkit-details-marker]:hidden ${FOCUS}`}>
          {row}
          <Icon icon={faChevronDown} aria-hidden="true" className={`w-3 shrink-0 text-xs text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </summary>
        {open && <DuelRounds mode={mode} {...rounds} box="-mx-4 border-t-2 border-lavender px-4 pt-2 pb-3" className="animate-enter" />}
      </details>
    </Tag>
  );
}
