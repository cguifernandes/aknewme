"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDailyResult, MODE_LABEL, MODE_PATH, type DailyResult, type GameMode } from "@/lib/game";
import ChallengeButton from "./ChallengeButton";
import { splitGrid } from "./ResultTiles";

const MODES = Object.keys(MODE_LABEL) as GameMode[];
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * Cartão "Próximo duelo" (fim de jogo de quem foi desafiado): escolhe o modo e desafia alguém nele.
 * O duelo precisa do seu placar do dia: modo já jogado hoje → desafia com aquele resultado; ainda não jogado → o mesmo
 * "Desafiar" leva a jogar primeiro. O Mais ou Menos fica de fora (não é desafio do dia: cada um recebe pares diferentes).
 */
export default function NextDuel({ mode }: { mode: GameMode }) {
  const [pick, setPick] = useState<GameMode>(mode);
  const [results, setResults] = useState<Partial<Record<GameMode, DailyResult | null>>>({});
  useEffect(() => setResults(Object.fromEntries(MODES.map((m) => [m, getDailyResult(m)]))), []);

  const r = results[pick];
  const { tiles } = splitGrid(r?.grid, r?.won);

  return (
    <div className="flex flex-col rounded-2xl bg-grape p-4 text-white">
      <p className="text-[11px] font-bold tracking-wider text-lime uppercase">Próximo duelo</p>
      <p className="mt-2 flex gap-1.5" role="group" aria-label="Modo do próximo duelo">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={pick === m}
            onClick={() => setPick(m)}
            className={`flex-1 rounded-full px-2 py-1.5 text-xs font-bold transition-colors ${FOCUS} ${
              pick === m ? "bg-white text-grape" : "border border-white/30 text-white hover:bg-white/10"
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </p>
      <div className="mt-auto pt-3">
        {r && tiles.length ? (
          // a chave muda com o modo: o botão começa do zero (sem o "Link copiado!" do modo anterior)
          <ChallengeButton key={pick} mode={pick} won={r.won} tiles={tiles} label="Desafiar" />
        ) : (
          <Link
            href={MODE_PATH[pick]}
            className={`block w-full rounded-full bg-lime py-3 text-center font-bold text-ink sweep-ink hover:text-white focus-visible:text-white active:translate-y-0.5 ${FOCUS}`}
          >
            Desafiar
          </Link>
        )}
      </div>
    </div>
  );
}
