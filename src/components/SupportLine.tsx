"use client";

import { faHeart } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { trackClick } from "@/lib/follow";
import { Icon } from "./icons";

const LINK =
  "rounded font-bold text-grape underline underline-offset-4 transition-colors hover:text-grape-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";

/**
 * Convite discreto para apoiar o projeto (specs/visual/02-apoio.md). Os cliques são contados por origem em api/played
 * e aparecem no painel /plays.
 * `end`: linha da aba do resultado do fim de jogo, só depois de vitória (fundo track, coração, uma linha no computador).
 * `home`: faixa centrada no fim da home, abaixo de "Mais jogos", sem card colorido.
 */
export default function SupportLine({ from, className = "" }: { from: "end" | "home"; className?: string }) {
  if (from === "home") {
    return (
      <p className={`text-center text-sm text-muted ${className}`}>
        O aknewme é gratuito e feito por uma pessoa só.{" "}
        <Link href="/support" onClick={() => trackClick("support:home")} className={`${LINK} whitespace-nowrap`}>
          Apoiar o projeto
        </Link>
      </p>
    );
  }
  return (
    <p className={`flex items-center gap-2 rounded-xl bg-track px-3 py-2 text-xs font-semibold text-ink ${className}`}>
      <Icon icon={faHeart} className="shrink-0 text-sm text-grape" aria-hidden="true" />
      <span className="min-w-0 flex-1">Curtiu? O aknewme é feito por uma pessoa só.</span>
      <Link href="/support" onClick={() => trackClick("support:end")} className={`${LINK} shrink-0`}>
        Apoiar
      </Link>
    </p>
  );
}
