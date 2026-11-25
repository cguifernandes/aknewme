"use client";

import { faCircleCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useId, useState } from "react";
import {
  challengeLink,
  cleanNick,
  DUEL_SENT_EVENT,
  loadNick,
  saveNick,
  sentDuelId,
} from "@/lib/challenge";
import { challengeLine } from "@/lib/endcard";
import {
  getDailyResult,
  MODE_LABEL,
  MODE_PATH,
  type GameMode,
} from "@/lib/game";
import { Icon } from "./icons";
import { splitGrid } from "./ResultTiles";

const MODES = Object.keys(MODE_LABEL) as GameMode[];
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const PILL = `rounded-full py-3 text-sm font-bold active:translate-y-0.5 disabled:opacity-50 ${FOCUS}`;

/**
 * "Chamar pro duelo" (lado direito do Meus duelos, o que aparece ao abrir): o modo de hoje (só os já jogados: o duelo leva o seu placar) e o
 * link, com o Copiar link embaixo. O apelido é o salvo; sem ele, aparece o campo. O código do desafio só
 * nasce quando o link sai. Mandar avisa a janela de fim de jogo (DUEL_SENT_EVENT).
 */
export default function DuelInvite({ day }: { day: number }) {
  const results = Object.fromEntries(MODES.map((m) => [m, getDailyResult(m)]));
  const [mode, setMode] = useState<GameMode | undefined>(
    MODES.find((m) => results[m]),
  );
  const [saved] = useState(loadNick);
  const [nick, setNick] = useState(saved);
  const [copied, setCopied] = useState(false);
  const nickId = useId();

  const r = mode && results[mode];
  const name = cleanNick(nick);
  const tiles = r ? splitGrid(r.grid, r.won).tiles : [];
  const ready = !!r && !!name;
  const link = (withId: boolean) =>
    r
      ? challengeLink(mode!, {
          day,
          nick: name || "Seu amigo",
          tiles,
          won: r.won,
          id: withId ? (sentDuelId(mode!, day) ?? undefined) : undefined,
        })
      : "";
  const text = () =>
    `⚔️ ${name} te desafiou no aknewme · Modo ${MODE_LABEL[mode!]}\n${challengeLine(mode!, tiles, r!.won, day)} Consegue bater?\n👉 ${link(true)}`;

  function sent() {
    saveNick(name);
    window.dispatchEvent(new Event(DUEL_SENT_EVENT));
  }
  async function copy() {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(text());
      sent();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex min-h-full flex-col">
      <h2
        id="duels-title"
        className="pr-10 font-display text-3xl font-extrabold text-ink"
      >
        Chamar pro duelo
      </h2>
      <p className="mt-1 text-sm text-muted">
        Escolha o modo, mande o link e o placar aparece aqui quando ele jogar.
      </p>

      <div
        role="radiogroup"
        aria-label="Modo do duelo"
        className="mt-5 grid grid-cols-3 gap-2"
      >
        {MODES.map((m) => {
          const r = results[m];
          const on = mode === m;
          const label = (
            <>
              <span className="block font-bold">{MODE_LABEL[m]}</span>
              <span
                className={`block text-[11px] ${on ? "text-lavender" : "text-muted"}`}
              >
                {!r ? "Jogue antes" : on ? "Escolhido" : "Jogado"}
              </span>
            </>
          );
          return r ? (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setMode(m)}
              className={`rounded-2xl py-3 text-center transition-colors ${FOCUS} ${on ? "bg-grape text-white" : "border-2 border-track text-ink hover:border-lavender"}`}
            >
              {label}
            </button>
          ) : (
            // ainda não jogado hoje: o duelo precisa do seu placar, então leva a jogar
            <Link
              key={m}
              href={MODE_PATH[m]}
              className={`rounded-2xl border-2 border-dashed border-lavender py-3 text-center text-muted hover:bg-track ${FOCUS}`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {!saved && (
        <label
          htmlFor={nickId}
          className="mt-4 block text-[11px] font-bold tracking-wider text-muted uppercase"
        >
          Como seu amigo vai te ver
          <input
            id={nickId}
            value={nick}
            maxLength={20}
            onChange={(e) => setNick(e.target.value)}
            placeholder="Seu apelido"
            className="mt-1.5 block w-full rounded-xl border-2 border-track px-3 py-2.5 text-sm font-bold tracking-normal text-ink normal-case outline-none placeholder:font-semibold placeholder:text-muted focus:border-grape"
          />
        </label>
      )}

      <div className="mt-4 rounded-2xl bg-track px-4 py-3">
        <p className="text-[10px] font-bold tracking-wider text-muted uppercase">
          Link do duelo · vale até 23:59
        </p>
        <p className="mt-0.5 truncate font-bold text-ink">
          {r
            ? link(false).replace(/^https?:\/\//, "")
            : "Jogue um modo de hoje primeiro"}
        </p>
      </div>

      <div className="mt-auto pt-6">
        <button
          type="button"
          disabled={!ready}
          onClick={copy}
          className={`${PILL} flex w-full items-center justify-center gap-2 bg-lime text-ink shadow-pop sweep-white`}
        >
          {copied ? "Copiado!" : "Copiar link"}{" "}
          <Icon icon={copied ? faCircleCheck : faCopy} />
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copiado" : ""}
      </p>
    </div>
  );
}
