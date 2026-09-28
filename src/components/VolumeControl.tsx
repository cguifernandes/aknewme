"use client";

import type { Sound } from "@/lib/audio";

type Props = { sound: Sound; onChange: (sound: Sound) => void };

/** Botão de silenciar + controle deslizante de volume (cores para fundo roxo). */
export default function VolumeControl({ sound, onChange }: Props) {
  const silent = sound.muted || sound.volume === 0;
  const waves = silent ? 0 : sound.volume < 0.5 ? 1 : 2;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        // Religar o som com volume em 0 volta para 80%
        onClick={() => onChange({ volume: sound.volume || 0.8, muted: !silent })}
        aria-label={silent ? "Ativar som" : "Silenciar"}
        aria-pressed={silent}
        className="flex size-10 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
          {waves >= 1 && <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />}
          {waves >= 2 && <path d="M18.5 7a7 7 0 0 1 0 10" />}
          {silent && <path d="m17 9 5 6m0-6-5 6" />}
        </svg>
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={sound.muted ? 0 : sound.volume}
        onChange={(e) => onChange({ volume: Number(e.target.value), muted: false })}
        aria-label="Volume"
        aria-valuetext={`${Math.round((sound.muted ? 0 : sound.volume) * 100)}%`}
        className="w-24 cursor-pointer accent-lime"
      />
    </div>
  );
}
