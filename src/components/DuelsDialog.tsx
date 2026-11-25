"use client";

import { faHandFist } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import { duelsSeen, initials, markDuelsSeen, outcome, recentDuels, recordDuel, rivals, sentToday, type DuelRecord, type Outcome, type Rival } from "@/lib/challenge";
import { closeOnBackdrop } from "@/lib/dialog";
import type { DuelAnswer } from "@/lib/duelAnswers";
import { summarize } from "@/lib/endcard";
import { dailyNumber, getDailyResult, MODE_LABEL, type GameMode } from "@/lib/game";
import CloseButton from "./CloseButton";
import DuelInvite from "./DuelInvite";
import { Icon } from "./icons";
import { splitGrid } from "./ResultTiles";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const TONES = ["bg-sun", "bg-blush", "bg-lavender", "bg-lime"];
/** Cor do avatar pelo apelido: a mesma pessoa tem sempre a mesma cor. */
const tone = (nick: string) => TONES[[...nick].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];
const PILL: Record<Outcome, [string, string]> = { win: ["venceu", "bg-lime"], lose: ["perdeu", "bg-blush"], tie: ["empate", "bg-sun"] };

const first = (nick: string) => nick.split(" ")[0];
/** Placar curto: no Emoji só os acertos ("4"), nos outros o número de tentativas/pistas. */
const short = (mode: GameMode, tiles: string[], won: boolean) => summarize(mode, tiles, won).big.replace(/\/\d+$/, "");
const hhmm = (t: number) => new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
/** Quando o duelo foi: "hoje, 19:40", "ontem, 20:02", "há 3 dias" (sem a hora, quando não foi guardada). */
function when(d: DuelRecord, today: number) {
  const day = d.day === today ? "hoje" : d.day === today - 1 ? "ontem" : `há ${today - d.day} dias`;
  return d.t ? `${day}, ${hhmm(d.t)}` : day;
}
/** Quem vai melhor contra quem ("Você lidera", "Empatados", "Ana lidera"). */
const lead = (r: Rival) => (r.wins > r.losses ? "Você lidera" : r.wins < r.losses ? `${first(r.nick)} lidera` : "Empatados");

/**
 * Botão "Meus duelos" do cabeçalho da home (com a bolinha verde) + janela em duas colunas.
 * Esquerda: "Seus rivais", o placar geral contra cada amigo, e "Desafiar um amigo". Direita: o "Chamar pro duelo"
 * (DuelInvite) ou, ao tocar num rival, o placar contra ele e os duelos um a um. Ao abrir, consulta /api/duel dos
 * desafios mandados hoje: o placar que chegou entra no placar (recordDuel).
 */
export default function DuelsDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState(0);
  const [seen, setSeen] = useState(0);
  const [board, setBoard] = useState<Rival[]>([]);
  /** O rival aberto à direita; sem ele, o "Chamar pro duelo" */
  const [pick, setPick] = useState<string | null>(null);
  const today = dailyNumber();

  useEffect(() => {
    const s = duelsSeen();
    setFresh(recentDuels(dailyNumber()).filter((d) => d.t > s).length);
  }, []);

  async function load() {
    setBoard(rivals());
    for (const { mode, id } of sentToday(today)) {
      const r = getDailyResult(mode);
      if (!r) continue;
      const mine = { tiles: splitGrid(r.grid, r.won).tiles, won: r.won };
      try {
        const answers: DuelAnswer[] = (await (await fetch(`/api/duel?id=${id}`, { cache: "no-store" })).json()).answers ?? [];
        for (const a of answers)
          if (a.tiles && a.won !== undefined) {
            const theirs = { day: today, nick: a.nick, tiles: a.tiles, won: a.won };
            recordDuel(mode, { ...theirs, player: a.player }, outcome(mode, mine, theirs), mine, a.t);
          }
      } catch {} // sem rede: fica o que já estava guardado
    }
    setBoard(rivals());
  }

  function show() {
    setSeen(duelsSeen());
    markDuelsSeen();
    setFresh(0);
    setPick(null);
    setOpen(true);
    ref.current?.showModal();
    void load();
  }

  /** Troca o lado direito; no celular ele fica embaixo dos rivais, então rola até ele */
  function go(key: string | null) {
    setPick(key);
    requestAnimationFrame(() => document.getElementById("duels-title")?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }

  const rival = board.find((r) => r.key === pick);

  return (
    <>
      {/* só o ícone, sempre com a bolinha verde (chama atenção para o duelo); o leitor de tela ouve se há duelo novo */}
      <button
        type="button"
        onClick={show}
        aria-label={fresh ? `Meus duelos, ${fresh} ${fresh === 1 ? "novo" : "novos"}` : "Meus duelos"}
        title="Meus duelos"
        className="relative flex size-10 items-center justify-center rounded-full bg-grape-deep text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
      >
        <Icon icon={faHandFist} />
        <span aria-hidden="true" className="absolute top-0 right-0 size-3 rounded-full border-2 border-white bg-lime" />
      </button>

      <dialog
        ref={ref}
        aria-labelledby="duels-title"
        onClose={() => setOpen(false)}
        onClick={closeOnBackdrop}
        className="m-auto max-h-[90dvh] w-[min(52rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-white text-ink shadow-pop-lg backdrop:bg-ink/60 md:h-[min(34rem,90dvh)] md:overflow-hidden"
      >
        {open && (
          <div className="relative grid grid-cols-1 md:h-full md:grid-cols-[17rem_minmax(0,1fr)]">
            <CloseButton onClick={() => ref.current?.close()} className="absolute top-4 right-4 z-10" />

            {/* rivais: o placar geral contra cada amigo; tocar num abre os duelos contra ele à direita */}
            <aside className="flex min-h-0 flex-col overflow-hidden bg-grape p-5 text-white">
              <p className="pr-10 font-display text-2xl leading-tight font-extrabold md:pr-0">Seus rivais</p>
              <p className="text-xs text-lavender">placar de cada amigo</p>
              <button
                type="button"
                onClick={() => go(null)}
                className={`mt-4 w-full rounded-full bg-lime py-3 text-sm font-bold text-ink shadow-pop sweep-white active:translate-y-0.5 ${FOCUS}`}
              >
                Desafiar um amigo
              </button>
              {board.length > 0 ? (
                // só a lista rola (o título e o botão ficam no lugar)
                <ul className="-mx-2 mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1 py-1">
                  {board.map((r) => (
                    <li key={r.key}>
                      <button
                        type="button"
                        aria-pressed={pick === r.key}
                        onClick={() => go(r.key)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-white ${
                          pick === r.key ? "bg-grape-deep" : "hover:bg-grape-deep/60"
                        }`}
                      >
                        <span aria-hidden="true" className={`relative flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-ink ${tone(r.nick)}`}>
                          {initials(r.nick)}
                          {r.duels.some((d) => d.t > seen) && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-grape bg-lime" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">{r.nick}</span>
                          <span className="block text-[11px] text-lavender">{lead(r)}</span>
                        </span>
                        <span className="shrink-0 font-display text-lg font-extrabold">
                          <span className="sr-only">
                            {r.wins} a {r.losses}
                          </span>
                          <span aria-hidden="true">
                            {r.wins} <span className="text-sm text-lavender">x</span> {r.losses}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-lavender">Ninguém ainda. Desafie alguém e o placar contra cada amigo aparece aqui.</p>
              )}
            </aside>

            <div className="flex min-h-0 flex-col p-5 sm:p-6 md:overflow-y-auto">
              {rival ? <RivalView key={rival.key} rival={rival} today={today} onChallenge={() => go(null)} /> : <DuelInvite day={today} />}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

/** Lado direito com um rival aberto: quem lidera, o placar grande, os duelos um a um e "Desafiar de novo". */
function RivalView({ rival: r, today, onChallenge }: { rival: Rival; today: number; onChallenge: () => void }) {
  const title = r.wins > r.losses ? "Você está na frente" : r.wins < r.losses ? `${first(r.nick)} está na frente` : "Vocês estão empatados";

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3 pr-10">
        <span aria-hidden="true" className={`flex size-12 shrink-0 items-center justify-center rounded-full font-extrabold text-ink ${tone(r.nick)}`}>
          {initials(r.nick)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold tracking-wider text-muted uppercase">Você x {r.nick}</p>
          <h2 id="duels-title" className="font-display text-2xl leading-tight font-extrabold sm:text-3xl">
            {title}
          </h2>
        </div>
      </div>

      {/* três colunas fixas (lados iguais, "x" no meio): trocar de rival com nome curto ou longo não mexe no placar */}
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)] items-center rounded-2xl bg-track px-4 py-4">
        {/* nome em cima e número embaixo, centralizados um com o outro */}
        <p className="flex min-w-0 flex-col items-center">
          <span className="text-xs font-bold text-muted">Você</span>
          <span className="font-display text-5xl leading-none font-extrabold">{r.wins}</span>
        </p>
        {/* o "x" no meio; os empates, quando há, logo embaixo dele */}
        <span className="flex flex-col items-center">
          <span aria-hidden="true" className="font-display text-lg font-extrabold text-lavender">
            x
          </span>
          {r.ties > 0 && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-muted">
              {r.ties} {r.ties === 1 ? "empate" : "empates"}
            </span>
          )}
        </span>
        <p className="flex min-w-0 flex-col items-center">
          <span className="max-w-full truncate text-xs font-bold text-muted">{first(r.nick)}</span>
          <span className="font-display text-5xl leading-none font-extrabold">{r.losses}</span>
        </p>
      </div>

      <p className="mt-5 text-[11px] font-bold tracking-wider text-muted uppercase">Duelos</p>
      <ul className="mt-2 divide-y-2 divide-track">
        {r.duels.map((d) => (
          <li key={`${d.mode}:${d.day}`} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">
                {MODE_LABEL[d.mode]} #{d.day}
              </span>
              <span className="block text-xs text-muted">{when(d, today)}</span>
            </span>
            {d.me && d.them && (
              <span className="shrink-0 font-display text-lg font-extrabold">
                {short(d.mode, d.me, !!d.mw)} <span className="text-sm text-muted">x</span> {short(d.mode, d.them, !!d.tw)}
              </span>
            )}
            <span className={`w-16 shrink-0 rounded-full py-1 text-center text-[11px] font-bold text-ink ${PILL[d.outcome][1]}`}>{PILL[d.outcome][0]}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={onChallenge}
          className={`w-full truncate rounded-full bg-grape px-4 py-3 text-sm font-bold text-white shadow-pop sweep-ink active:translate-y-0.5 ${FOCUS}`}
        >
          Desafiar {first(r.nick)} de novo
        </button>
      </div>
    </div>
  );
}
