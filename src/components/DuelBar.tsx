"use client";

import { useEffect, useState } from "react";
import { initials, readChallenge, sendDuelStatus, type Challenge } from "@/lib/challenge";
import DuelAvatar from "./DuelAvatar";

/** Faixa embaixo do cabeçalho enquanto se joga um duelo (página aberta por um link de desafio). */
export default function DuelBar() {
  const [c, setC] = useState<Challenge | null>(null);
  useEffect(() => {
    const ch = readChallenge();
    setC(ch);
    if (ch) sendDuelStatus(ch, "playing"); // quem desafiou vê "jogando agora" (não manda nada se já terminou)
  }, []);
  if (!c) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white">
      <span className="flex shrink-0 -space-x-2">
        <DuelAvatar label="VC" ring="ring-ink" />
        <DuelAvatar label={initials(c.nick)} tone="lime" ring="ring-ink" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">Duelo com {c.nick}</p>
        <p className="truncate text-xs text-lavender">as jogadas aparecem quando você terminar</p>
      </div>
      <p aria-hidden="true" className="flex shrink-0 items-center gap-1 max-sm:hidden">
        <span className="mr-1 max-w-24 truncate text-[10px] font-bold tracking-wider text-lavender uppercase">{c.nick}</span>
        {c.tiles.map((_, i) => (
          <span key={i} className="flex size-5 items-center justify-center rounded-md bg-grape-deep text-[10px] font-bold text-lavender">
            ?
          </span>
        ))}
      </p>
    </div>
  );
}
