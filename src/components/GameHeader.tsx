import Link from "next/link";
import Logo from "./Logo";

/**
 * Faixa comum aos dois cabeçalhos (home e jogos): mesmo respiro e linha de
 * 48px (altura dos botões). Assim o logo não pula ao trocar de página.
 */
export const HEADER_BAR = "min-h-12 py-[clamp(0.75rem,2.5vh,2rem)] short:py-2 box-content";

/** Cabeçalho das páginas de jogo: "<" (volta aos modos) | logo | status à direita. */
export default function GameHeader({ right }: { right: React.ReactNode }) {
  return (
    <header className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 ${HEADER_BAR}`}>
      <div>
        <Link
          href="/"
          aria-label="Voltar aos modos"
          className="inline-flex size-12 items-center justify-center rounded-full bg-grape-deep text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
        >
          <svg width="10" height="17" viewBox="0 0 7 12" fill="none" aria-hidden="true">
            <path d="M6 1L1.5 6L6 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
      <Logo />
      <div className="flex justify-end">
        <div className="flex h-12 items-center gap-1.5 rounded-full bg-grape-deep px-5 text-base font-medium whitespace-nowrap text-lavender sm:gap-2 sm:text-[15px]">
          {right}
        </div>
      </div>
    </header>
  );
}
