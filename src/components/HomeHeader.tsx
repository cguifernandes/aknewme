"use client";

import { useEffect, useState } from "react";
import { HEADER_BAR } from "./GameHeader";
import Logo from "./Logo";

export default function HomeHeader() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    import("@/lib/game").then(({ getStreak }) => setStreak(getStreak()));
  }, []);

  return (
    // A pill de streak só aparece depois de ler o localStorage; a linha de
    // altura fixa (HEADER_BAR) evita que ela empurre a página ao surgir.
    <header className={`flex items-center justify-between ${HEADER_BAR}`}>
      <Logo />
      {streak > 0 && (
        <span className="flex items-center rounded-full bg-grape-deep px-5 py-3 text-sm font-bold text-white">
          {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
        </span>
      )}
    </header>
  );
}
