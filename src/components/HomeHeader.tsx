"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";

export default function HomeHeader() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    import("@/lib/game").then(({ getStreak }) => setStreak(getStreak()));
  }, []);

  return (
    <header className="flex items-center justify-between py-[clamp(0.75rem,2.5vh,2rem)]">
      <Logo />
      {streak > 0 && (
        <span className="flex items-center gap-2 rounded-full bg-grape-deep px-5 py-3 text-sm font-bold text-white">
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true">
            <path
              d="M7 0C7 3 3.5 4.5 2 7.5C.7 10.2 1.8 14 5 15.4 4.3 14.2 4.5 12.7 5.5 11.7 6.3 10.9 7 10.3 7.3 9 8.6 10 9.6 11.6 9.3 13.3 9.2 14 8.8 14.9 8.2 15.5 11.6 14.7 13.6 11.4 12.8 8.1 12 4.9 8.8 3.4 7 0Z"
              fill="#C9F560"
            />
          </svg>
          {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
        </span>
      )}
    </header>
  );
}
