import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { Icon } from "./icons";
import { CardKana } from "./Watermark";

/**
 * Card da seção "Mais jogos" da Home: miniatura branca à esquerda, linha de destaque em lime (`badge`), título, descrição e botão.
 * Atrás, em marca d'água, o nome do jogo em japonês (`kana`). O card inteiro é o link.
 */
export default function GameCard({
  href,
  label,
  badge,
  title,
  description,
  cta,
  kana,
  thumb,
}: {
  href: string;
  label: string;
  badge: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  kana: string;
  thumb: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="group flex flex-col gap-4 overflow-hidden rounded-[28px] bg-grape p-4 sm:flex-row sm:items-center shadow-pop transition duration-300 ease-out hover:-translate-y-2 hover:shadow-pop-lg active:translate-y-0 active:duration-75 focus-visible:-translate-y-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-grape sm:gap-5"
    >
      <div className="relative flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-pop sm:w-36 max-sm:h-40">
        {thumb}
      </div>
      <div className="relative isolate min-w-0 flex-1 max-sm:px-1 max-sm:pb-1">
        <CardKana text={kana} />
        <p className="flex min-h-4 items-center gap-1.5 text-[11px] font-bold tracking-wider text-lime uppercase">{badge}</p>
        <h3 className="mt-1 font-display text-2xl leading-tight font-extrabold tracking-tight text-white">{title}</h3>
        <p className="mt-0.5 text-sm leading-snug text-lavender">{description}</p>
        {/* "botão" visual — o clique é do card inteiro */}
        <span className="relative mt-3 inline-flex items-center overflow-hidden rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink transition duration-300 group-active:translate-y-0.5 group-active:duration-75">
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full rounded-full bg-lime transition-transform duration-500 ease-out group-hover:translate-x-0 group-focus-visible:translate-x-0"
          />
          <span className="relative">{cta}</span>
          <span
            aria-hidden="true"
            className="relative flex w-0 justify-center overflow-hidden opacity-0 transition-[width,margin,opacity] duration-300 ease-out group-hover:ml-2 group-hover:w-3.5 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:w-3.5 group-focus-visible:opacity-100"
          >
            <Icon icon={faArrowRight} className="text-xs" />
          </span>
        </span>
      </div>
    </Link>
  );
}
