"use client";

import { faArrowDown, faArrowUp, faChevronDown, faEquals, type IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { dailyNumber, type GameMode } from "@/lib/game";
import { sendPlayed } from "@/lib/metrics";
import { Icon } from "./icons";

/** Respostas possíveis — os mesmos valores que api/played aceita e o painel /plays soma. */
export type Level = "easy" | "ok" | "hard";
type Saved = { day: number; level?: Level; like?: boolean };

// `on` = escolhido; `idle` = antes do voto (pastel, enche no hover). Classes inteiras: o Tailwind não monta nome de classe em pedaços.
const LEVELS: { id: Level; label: string; icon: IconDefinition; on: string; idle: string }[] = [
  { id: "easy", label: "Fácil demais", icon: faArrowDown, on: "bg-lime", idle: "bg-lime/45 not-disabled:hover:bg-lime" },
  { id: "ok", label: "Na medida", icon: faEquals, on: "bg-lavender", idle: "bg-lavender/45 not-disabled:hover:bg-lavender" },
  { id: "hard", label: "Difícil demais", icon: faArrowUp, on: "bg-blush", idle: "bg-blush/45 not-disabled:hover:bg-blush" },
];
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const key = (mode: GameMode) => `aknewme.feedback.${mode}`;

function load(mode: GameMode): Saved {
  const day = dailyNumber();
  try {
    const s = JSON.parse(localStorage.getItem(key(mode)) ?? "null") as Saved | null;
    if (s?.day === day) return s;
  } catch {}
  return { day };
}

/**
 * "Como foi o desafio de hoje?" no fim de jogo: dificuldade (fácil / na medida / difícil) e se curtiu o anime.
 * É uma linha recolhida (como "Próximo desafio em"), que abre ao clicar: a janela de resultado não cresce por causa dela.
 * Cada pergunta vale um voto por dia, por modo e por navegador (fica no localStorage); o voto vai para
 * api/played e aparece somado no painel /plays. Só no desafio do dia: o arquivo não pergunta.
 */
export default function DailyFeedback({ mode }: { mode: GameMode }) {
  // null = ainda lendo o localStorage (os botões ficam desligados, sem piscar o estado errado)
  const [saved, setSaved] = useState<Saved | null>(null);
  useEffect(() => setSaved(load(mode)), [mode]);

  function vote(answer: { level: Level } | { like: boolean }) {
    if (!saved) return;
    const next = { ...saved, ...answer };
    setSaved(next);
    try {
      localStorage.setItem(key(mode), JSON.stringify(next));
    } catch {}
    sendPlayed({ mode, day: next.day, feedback: answer });
  }

  const many = mode === "emoji"; // no Emoji são cinco animes
  const voted = saved?.level !== undefined;
  return (
    <details className="group rounded-2xl bg-track text-left">
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 [&::-webkit-details-marker]:hidden ${FOCUS}`}
      >
        <span className="text-xs text-muted">
          {voted ? "Valeu pelo voto!" : "Leva 2 segundos"}
          <strong className="block font-display text-xl font-extrabold text-ink">Como foi o desafio de hoje?</strong>
        </span>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-grape transition-transform duration-300 group-open:rotate-180">
          <Icon icon={faChevronDown} className="text-sm" />
        </span>
      </summary>
      <div className="px-4 pb-4 text-center">
      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map((l) => {
          const chosen = saved?.level === l.id;
          return (
            <button
              key={l.id}
              type="button"
              disabled={!saved || voted}
              aria-pressed={chosen}
              onClick={() => vote({ level: l.id })}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-xs font-bold text-ink transition duration-200 not-disabled:hover:-translate-y-0.5 not-disabled:active:translate-y-0 ${FOCUS} ${
                chosen ? `${l.on} animate-pop` : voted ? "bg-white opacity-50" : l.idle
              }`}
            >
              <Icon icon={l.icon} className="text-sm" />
              {l.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
        <span className="text-muted">{many ? "Os animes de hoje:" : "O anime de hoje:"}</span>
        {[
          { like: true, label: "Gostei" },
          { like: false, label: "Não curti" },
        ].map((o) => {
          const chosen = saved?.like === o.like;
          const answered = saved?.like !== undefined;
          return (
            <button
              key={o.label}
              type="button"
              disabled={!saved || answered}
              aria-pressed={chosen}
              onClick={() => vote({ like: o.like })}
              className={`rounded-full px-4 py-2 ${FOCUS} ${
                chosen ? "animate-pop bg-grape text-white" : answered ? "bg-white text-ink opacity-50" : "bg-white text-ink sweep-lavender"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="sr-only">
        {voted && "Voto registrado. Obrigado!"}
      </p>
      </div>
    </details>
  );
}
