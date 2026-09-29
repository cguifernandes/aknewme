"use client";

import { faVolumeHigh, faVolumeLow, faVolumeXmark } from "@fortawesome/free-solid-svg-icons";
import type { Sound } from "@/lib/audio";
import { Icon } from "./icons";

type Props = { sound: Sound; onChange: (sound: Sound) => void };

/** Botão de silenciar + controle deslizante de volume (cores para fundo roxo). */
export default function VolumeControl({ sound, onChange }: Props) {
  const silent = sound.muted || sound.volume === 0;
  const icon = silent ? faVolumeXmark : sound.volume < 0.5 ? faVolumeLow : faVolumeHigh;

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
        <Icon icon={icon} className="text-[19px]" />
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
