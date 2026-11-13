"use client";

import { useEffect, useState } from "react";
import { HL_PATH, loadHL } from "@/lib/higherLower";
import GameCard from "./GameCard";
import VsPreview from "./VsPreview";

/** Card do Mais ou Menos na seção "Mais jogos" da Home: prévia VS em miniatura e o recorde do jogador em destaque. */
export default function HigherLowerCard() {
  // null = ainda lendo o localStorage; 0 = nunca jogou: o selo mostra "modo infinito".
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => setBest(loadHL().best), []);

  return (
    <GameCard
      href={HL_PATH}
      label="Jogar Mais ou Menos, modo infinito"
      badge={best ? `Recorde ${best}` : "Modo infinito"}
      title="Mais ou Menos"
      description="Qual tem mais episódios? Vá até errar e bata seu recorde."
      cta="Jogar"
      kana="多い少ない"
      thumb={
        <div className="scale-[0.8] sm:scale-[0.55]">
          <VsPreview />
        </div>
      }
    />
  );
}
