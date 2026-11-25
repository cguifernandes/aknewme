"use client";

import { useEffect, useState } from "react";
import { dailyNumber, type GameMode } from "@/lib/game";
import { sendPlayed } from "@/lib/metrics";

/** Respostas possíveis — os mesmos valores que api/played aceita e o painel /plays soma. */
export type Level = "easy" | "ok" | "hard";
type Saved = { day: number; level?: Level; like?: boolean };

// `on` = escolhido. Classes inteiras: o Tailwind não monta nome de classe em pedaços.
const LEVELS: { id: Level; label: string; hint: string; on: string }[] = [
  { id: "easy", label: "Fácil demais", hint: "resolvi rápido", on: "border-lime bg-lime" },
  { id: "ok", label: "Na medida", hint: "desafio equilibrado", on: "border-lavender bg-lavender" },
  { id: "hard", label: "Difícil demais", hint: "exigiu demais", on: "border-blush bg-blush" },
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
 * "Como foi o desafio?" no fim de jogo: dificuldade (fácil / na medida / difícil) e se curtiu o anime.
 * Cartão compacto, já aberto: fica na última tela do carrossel da janela de resultado.
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
    <div className="rounded-2xl border-2 border-track p-3 text-left">
      <p className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-2">
        <strong className="font-display text-base font-extrabold text-ink">Como foi o #{saved?.day ?? dailyNumber()}?</strong>
        {voted && <span className="text-xs text-muted">Valeu pelo voto!</span>}
      </p>
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
              className={`rounded-xl border-2 px-1 py-2 text-center ${FOCUS} ${
                chosen ? `${l.on} animate-pop` : voted ? "border-track opacity-50" : "border-track bg-white sweep-track"
              }`}
            >
              <span className="block text-sm font-bold text-ink">{l.label}</span>
              <span className={`block text-[11px] ${chosen ? "text-ink" : "text-muted"}`}>{l.hint}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
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
              className={`rounded-full border-2 px-3.5 py-1 ${FOCUS} ${
                chosen ? "animate-pop border-grape bg-grape text-white" : answered ? "border-track bg-white text-ink opacity-50" : "border-track bg-white text-ink sweep-track"
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
  );
}
