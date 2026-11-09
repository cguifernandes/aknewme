"use client";

import { faArrowsUpDown, faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getStreak } from "@/lib/game";
import { HL_PATH } from "@/lib/higherLower";
import { X_HANDLE, X_URL } from "@/lib/site";
import HowToPlay from "./HowToPlay";
import { HeartIcon, Icon, XLogo } from "./icons";
import Logo from "./Logo";
import StatsDialog from "./StatsDialog";

const ICON_BTN =
  "flex size-10 items-center justify-center rounded-full bg-grape-deep text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";

/**
 * Cabeçalho de todas as páginas: logo (volta à home) | botões.
 * Home: sequência de dias · Como jogar · Apoiar · X · Estatísticas.
 * Outras páginas: Mais ou Menos (fora dele) · Arquivo (fora do arquivo) · Como jogar · Apoiar. Voltar à home é pelo logo.
 */
export default function SiteHeader() {
  const path = usePathname();
  const home = path === "/";
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
        {home && streak > 0 && (
          <span className="flex h-10 items-center rounded-full bg-grape-deep px-4 text-sm font-bold whitespace-nowrap text-white max-sm:hidden">
            {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
          </span>
        )}
        {/* atalho para o modo infinito, com a bolinha de "novo" pulsando */}
        {!home && path !== HL_PATH && (
          <Link href={HL_PATH} aria-label="Mais ou Menos (novo modo infinito)" title="Mais ou Menos · novo" className={`${ICON_BTN} relative`}>
            <Icon icon={faArrowsUpDown} />
            <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 size-3 animate-beat rounded-full bg-lime ring-2 ring-paper" />
          </Link>
        )}
        {!home && path !== "/archive" && (
          <Link href="/archive" aria-label="Desafios anteriores" title="Desafios anteriores" className={ICON_BTN}>
            <Icon icon={faClockRotateLeft} />
          </Link>
        )}
        <HowToPlay />
        {/* Só o ícone: o nome fica no aria-label, para leitores de tela */}
        <Link href="/support" aria-label="Apoiar" title="Apoiar" className={ICON_BTN}>
          <HeartIcon />
        </Link>
        {home && (
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`@${X_HANDLE} no X (abre em nova aba)`}
            title={`@${X_HANDLE} no X`}
            className={`${ICON_BTN} text-[15px]`}
          >
            <XLogo />
          </a>
        )}
        {home && <StatsDialog />}
      </div>
    </header>
  );
}
