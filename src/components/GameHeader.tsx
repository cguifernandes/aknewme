import Link from "next/link";
import Logo from "./Logo";

/** Cabeçalho das páginas de jogo: "< Modos" | logo | status à direita. */
export default function GameHeader({ right }: { right: React.ReactNode }) {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-grape-deep px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
        >
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true">
            <path d="M6 1L1.5 6L6 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Modos
        </Link>
      </div>
      <Logo />
      <div className="flex justify-end">
        <div className="flex items-center gap-2 rounded-full bg-grape-deep px-5 py-3 text-sm font-medium text-lavender">
          {right}
        </div>
      </div>
    </header>
  );
}
