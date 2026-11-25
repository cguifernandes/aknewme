"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DUEL_RULE, initials, outcome, recentDuels, type DuelRecord, type Outcome } from "@/lib/challenge";
import type { DuelAnswer, FinishedAnswer } from "@/lib/duelAnswers";
import { summarize } from "@/lib/endcard";
import { dailyNumber, MODE_LABEL, type GameMode } from "@/lib/game";
import DuelHelp from "./DuelHelp";
import { MODAL_DESC, MODAL_TITLE } from "./modalText";
import { dotBg } from "./ResultTiles";

const SAID: Record<Outcome, string> = { win: "Você venceu", lose: "Você perdeu", tie: "Empate" };
/** Cor do avatar de cada adversário na lista da semana (em rodízio). */
const TONES = ["bg-sun", "bg-blush", "bg-lavender"];
const CHIP = "rounded-full px-2.5 py-1 text-[10px] font-bold";
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

/**
 * Tela "Desafiar um amigo" do fim de jogo: o cartão do duelo (você × "?"), a regra do modo, os duelos da semana
 * (os que este navegador guardou) e, embaixo, o botão de desafiar (`children`).
 * O cartão entra animado toda vez que a tela aparece (`active`): os dois lados sobem, o "VS" surge e fica soltando
 * ondas, o "?" do amigo gira o tracejado e os quadradinhos dele piscam em onda. Com o mouse na tela, o "VS" pulsa e
 * o "?" pula. O passo a passo é o ícone "?" (DuelHelp).
 */
export default function DuelPitch({
  mode,
  day,
  tiles,
  won,
  title,
  active,
  stamp,
  done,
  live,
  children,
}: {
  mode: GameMode;
  day: number;
  tiles: string[];
  won: boolean;
  title: string;
  /** A tela está à mostra no carrossel: (re)começa a animação de entrada do cartão */
  active: boolean;
  /** Muda quando um duelo acaba de ser guardado (o desfecho dele): relê a lista da semana */
  stamp?: string | null;
  /** Respostas ao desafio que este navegador mandou (useDuelAnswers, na janela): quem terminou e quem está jogando */
  done: FinishedAnswer[];
  live: DuelAnswer[];
  children?: ReactNode;
}) {
  const [week, setWeek] = useState<DuelRecord[]>([]);
  useEffect(() => setWeek(recentDuels(dailyNumber())), [stamp, done.length]);

  const friend = done[0];
  /** Ninguém terminou ainda, mas alguém abriu ou está jogando: mostra quem, no lugar do "?" */
  const waiting = !friend ? live[0] : undefined;
  const result = friend ? outcome(mode, { tiles, won }, { day, ...friend }) : null;
  const verdict = result && SAID[result];
  const theirs = friend && summarize(mode, friend.tiles, friend.won);

  const mine = summarize(mode, tiles, won);
  const wins = week.filter((d) => d.outcome === "win").length;
  const losses = week.filter((d) => d.outcome === "lose").length;
  const half = `flex min-w-0 flex-col items-center px-2 text-center ${active ? "animate-enter" : ""}`;
  const face = "flex size-12 items-center justify-center rounded-full font-display text-base font-extrabold";

  return (
    <div className="group flex flex-1 flex-col">
      {/* no computador o "?" fica ao lado do "Fechar" da janela (EndCard), acima do título; no celular, aqui */}
      <div className="flex items-start justify-between gap-3">
        <h3 className={MODAL_TITLE}>{title}</h3>
        <DuelHelp className="relative shrink-0 md:hidden" />
      </div>
      <p aria-live="polite" className="sr-only">
        {verdict
          ? `${friend.nick} terminou o desafio: ${verdict}.`
          : waiting
            ? `${waiting.nick} está jogando o seu desafio.`
            : ""}
      </p>
      <p className={MODAL_DESC}>
        Seu amigo joga o mesmo #{day} sem ver as suas jogadas. No fim, os dois placares aparecem lado a lado.
      </p>

      {/* a chave muda quando a tela aparece: as animações de entrada recomeçam */}
      <div key={active ? "on" : "off"} className={`mt-4 overflow-hidden rounded-2xl bg-grape text-white ${active ? "animate-pop" : ""}`}>
        <div className="px-4 pt-3 pb-4">
          <p className="flex items-center justify-between gap-2">
            <span className={`${CHIP} bg-ink/50`}>
              #{day} · {MODE_LABEL[mode]}
            </span>
            <span className={`${CHIP} bg-lime tracking-wider text-ink uppercase`}>Duelo</span>
          </p>
          <div className="relative mt-3 grid grid-cols-2">
            <span aria-hidden="true" className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-white/25" />
            {/* VS: surge depois dos dois lados e fica soltando ondas; com o mouse na tela, pulsa uma vez */}
            <span aria-hidden="true" className={`absolute top-1/2 left-1/2 z-10 size-11 -translate-1/2 ${active ? "animate-pop" : ""}`} style={delay(380)}>
              <span className="absolute inset-0 animate-sonar rounded-full bg-lime" />
              <span className="relative flex size-full items-center justify-center rounded-full bg-lime font-display text-sm font-extrabold text-ink shadow-pop group-hover:animate-beat-once">
                VS
              </span>
            </span>

            <div className={half} style={delay(100)}>
              <span aria-hidden="true" className={`${face} bg-white text-grape ring-4 ring-white/25`}>
                VC
              </span>
              <p className="mt-1.5 text-xs font-semibold text-lavender">Você</p>
              <p className="font-display text-2xl leading-tight font-extrabold">
                {mine.big}
                {mode !== "emoji" && <span className="ml-1 text-xs">{mine.unit}</span>}
              </p>
              <p aria-hidden="true" className="mt-1 flex flex-wrap justify-center gap-1">
                {tiles.map((t, i) => (
                  <span key={i} className={`size-3 rounded-sm ${dotBg(t)} ${active ? "animate-pop" : ""}`} style={delay(450 + i * 70)} />
                ))}
              </p>
            </div>

            {friend && theirs ? (
              // alguém respondeu: o lado do amigo vira o placar dele (o mais recente, se forem vários)
              <div key={friend.t} className="flex min-w-0 animate-pop flex-col items-center px-2 text-center">
                <span aria-hidden="true" className={`${face} bg-lime text-ink ring-4 ring-white/25`}>
                  {initials(friend.nick)}
                </span>
                <p className="mt-1.5 max-w-full truncate text-xs font-semibold text-lavender">
                  {friend.nick}
                  {done.length > 1 && ` +${done.length - 1}`}
                </p>
                <p className="font-display text-2xl leading-tight font-extrabold">
                  {theirs.big}
                  {mode !== "emoji" && <span className="ml-1 text-xs">{theirs.unit}</span>}
                </p>
                <p aria-hidden="true" className="mt-1 flex flex-wrap justify-center gap-1">
                  {friend.tiles.map((t, i) => (
                    <span key={i} className={`size-3 rounded-sm ${dotBg(t)}`} />
                  ))}
                </p>
              </div>
            ) : (
              <div className={half} style={delay(220)}>
                {/* o tracejado gira devagar em volta do "?" (o mesmo giro do disco da Opening, mais lento) */}
                <span aria-hidden="true" className={`${face} relative`}>
                  <span className="absolute inset-0 animate-spin-slow rounded-full border-2 border-dashed border-white/60" style={{ animationDuration: "14s" }} />
                  <span className="group-hover:animate-hop-once">?</span>
                </span>
                <p className="mt-1.5 max-w-full truncate text-xs font-semibold text-lavender">
                {waiting ? `${waiting.nick}${live.length > 1 ? ` +${live.length - 1}` : ""}` : "Seu amigo"}
              </p>
                {/* abriu o convite ou está jogando: "jogando…" no lugar do placar escondido */}
                {waiting ? (
                  <p className="flex items-center gap-1.5 py-1 font-display text-lg leading-tight font-extrabold text-lime">
                    <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-lime" />
                    Jogando…
                  </p>
                ) : (
                  <p className="font-display text-2xl leading-tight font-extrabold text-white/60">
                    {mode === "emoji" ? `?/${tiles.length}` : "?"}
                    {mode !== "emoji" && <span className="ml-1 text-xs">{mine.unit}</span>}
                  </p>
                )}
                <p aria-hidden="true" className="mt-1 flex flex-wrap justify-center gap-1">
                  {tiles.map((_, i) => (
                    <span
                      key={i}
                      className="flex size-3 animate-pulse items-center justify-center rounded-sm bg-grape-deep text-[8px] font-bold text-lavender"
                      style={delay(i * 180)}
                    >
                      ?
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* faixa de baixo: a regra; quando o amigo termina, vira o resultado (na cor de quem venceu) */}
        {result && friend ? (
          <p
            key={`${friend.nick}:${friend.t}`}
            className={`px-4 py-2.5 text-center font-display text-sm font-extrabold ${
              result === "win" ? "bg-lime text-ink" : result === "lose" ? "bg-blush text-ink" : "bg-sun text-ink"
            }`}
          >
            {result === "win" ? "Você venceu o duelo!" : result === "lose" ? `${friend.nick} venceu o duelo` : "Deu empate!"}
          </p>
        ) : (
          <p className="bg-grape-deep px-4 py-2.5 text-center text-xs font-semibold">{DUEL_RULE[mode]}</p>
        )}
      </div>

      <div className="mt-3 rounded-2xl border-2 border-track p-3">
        <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm font-bold text-ink">
          Seus duelos esta semana
          {week.length > 0 && (
            <span className="text-xs text-grape">
              {wins} {wins === 1 ? "vitória" : "vitórias"} · {losses} {losses === 1 ? "derrota" : "derrotas"}
            </span>
          )}
        </p>
        {week.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {/* no máximo 3; o resto vira uma bolinha "+N" */}
            {week.slice(0, 3).map((d, i) => (
              <li
                key={`${d.nick}:${d.mode}:${d.day}`}
                tabIndex={0}
                data-tip={d.nick}
                data-tip-side={i === 0 ? "start" : undefined}
                className="tip flex items-center gap-1.5 rounded-full border-2 border-track py-0.5 pr-2.5 pl-0.5 text-[11px] font-bold text-ink">
                <span aria-hidden="true" className={`flex size-6 items-center justify-center rounded-full text-[9px] ${TONES[i % TONES.length]}`}>
                  {initials(d.nick)}
                </span>
                <span className="sr-only">{d.nick}:</span>
                {SAID[d.outcome]}
              </li>
            ))}
            {week.length > 3 && (
              <li
                aria-label={`e mais ${week.length - 3} ${week.length - 3 === 1 ? "duelo" : "duelos"}`}
                className="flex size-8 items-center justify-center rounded-full bg-grape text-[10px] font-bold text-white"
              >
                +{week.length - 3}
              </li>
            )}
          </ul>
        ) : (
          // ainda sem duelos: três lugares vazios e como eles se enchem
          <div className="mt-2 flex items-center gap-3">
            <span aria-hidden="true" className="flex shrink-0 -space-x-1.5">
              {TONES.map((t) => (
                <span key={t} className="size-7 rounded-full border-2 border-dashed border-lavender bg-white" />
              ))}
            </span>
            <p className="text-xs text-muted">Nenhum ainda. Quando você aceitar o desafio de alguém, o resultado aparece aqui.</p>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4">{children}</div>
    </div>
  );
}
