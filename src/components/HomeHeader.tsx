"use client";

import { useEffect, useState } from "react";
import { getStreak } from "@/lib/game";
import { HEADER_BAR } from "./GameHeader";
import Logo from "./Logo";
import PracticeMenu from "./PracticeMenu";
import StatsDialog from "./StatsDialog";

export default function HomeHeader() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(getStreak());
  }, []);

  return (
    // A pill de streak só aparece depois de ler o localStorage; a linha de
    // altura fixa (HEADER_BAR) evita que ela empurre a página ao surgir.
    <header className={`flex items-center justify-between ${HEADER_BAR}`}>
      <Logo />
      <div className="flex items-center gap-2">
        {streak > 0 && (
          <span className="flex h-12 items-center rounded-full bg-grape-deep px-4 text-[15px] font-bold whitespace-nowrap text-white sm:px-5">
            {/* celular: "3 dias" · resto: "3 dias seguidos" */}
            {streak} {streak === 1 ? "dia" : "dias"}
            <span className="max-sm:hidden">&nbsp;{streak === 1 ? "seguido" : "seguidos"}</span>
          </span>
        )}
        <PracticeMenu />
        <StatsDialog />
      </div>
    </header>
  );
}
