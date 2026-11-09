"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStreak } from "@/lib/game";
import { X_HANDLE, X_URL } from "@/lib/site";
import HowToPlay from "./HowToPlay";
import { HeartIcon, XLogo } from "./icons";
import Logo from "./Logo";
import StatsDialog from "./StatsDialog";

/** Cabeçalho de todas as páginas: logo (volta à home) | sequência de dias · Como jogar · Apoiar · Estatísticas. */
export default function SiteHeader() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(getStreak());
  }, []);

  return (
    // Linha de altura fixa (40px, a dos botões): a pill de sequência só aparece
    // depois de ler o localStorage e não empurra a página ao surgir.
    <header className="box-content flex min-h-10 items-center justify-between py-[clamp(0.75rem,2.5vh,2rem)] short:py-2">
      <Logo />
      <div className="flex items-center gap-2">
        {/* No celular não cabe com o logo e os botões: lá a sequência aparece na home, junto do desafio do dia */}
        {streak > 0 && (
          <span className="flex h-10 items-center rounded-full bg-grape-deep px-4 text-sm font-bold whitespace-nowrap text-white max-sm:hidden">
            {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
          </span>
        )}
        <HowToPlay />
        {/* Só o ícone: o nome fica no aria-label, para leitores de tela */}
        <Link
          href="/support"
          aria-label="Apoiar"
          title="Apoiar"
          className="flex size-10 items-center justify-center rounded-full bg-grape-deep text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
        >
          <HeartIcon />
        </Link>
        <a
          href={X_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`@${X_HANDLE} no X (abre em nova aba)`}
          title={`@${X_HANDLE} no X`}
          className="flex size-10 items-center justify-center rounded-full bg-grape-deep text-[15px] text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
        >
          <XLogo />
        </a>
        <StatsDialog />
      </div>
    </header>
  );
}
