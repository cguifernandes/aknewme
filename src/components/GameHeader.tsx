import Link from "next/link";
import Logo from "./Logo";

/**
 * Faixa comum aos dois cabeçalhos (home e jogos): mesmo respiro e linha de
 * 44px (altura das pills). Assim o logo não pula ao trocar de página.
 */
export const HEADER_BAR = "min-h-11 py-[clamp(0.75rem,2.5vh,2rem)] short:py-2 box-content";

/** Cabeçalho das páginas de jogo: "< Modos" | logo | status à direita. */
export default function GameHeader({ right }: { right: React.ReactNode }) {
  return (
    <header className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 ${HEADER_BAR}`}>
      <div>
        {/* No celular vira só a seta (o texto "Modos" fica para leitores de tela) */}
        <Link
          href="/"
          className="inline-flex size-11 items-center justify-center gap-2 rounded-full bg-grape-deep text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape sm:w-auto sm:px-5"
        >
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true">
            <path d="M6 1L1.5 6L6 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="max-sm:sr-only">Modos</span>
        </Link>
      </div>
      <Logo />
      <div className="flex justify-end">
        <div className="flex h-11 items-center gap-1.5 rounded-full bg-grape-deep px-4 text-xs font-medium whitespace-nowrap text-lavender sm:gap-2 sm:px-5 sm:text-sm">
          {right}
        </div>
      </div>
    </header>
  );
}
