import Link from "next/link";
import type { ReactNode } from "react";
import { CONTACT_EMAIL } from "@/lib/site";
import Logo from "../Logo";

// Legal pages (/privacy and /terms): their own header (logo back to the game on the left, links between the two pages
// on the right) and the text pieces. The header and footer divider lines run edge to edge (no side margin). Theme tokens only.

const FOCUS = "rounded focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-grape";
export const H2 = "mt-8 font-display text-xl font-extrabold text-ink";
export const P = "mt-2 text-base leading-relaxed text-muted";
export const A = `font-bold text-grape underline underline-offset-4 hover:text-grape-deep ${FOCUS}`;

const PAGES = [
  { href: "/privacy", label: "Privacidade" },
  { href: "/terms", label: "Termos" },
] as const;

type Page = (typeof PAGES)[number]["href"];

/** Content width and side padding (same as the rest of the site); the divider lines sit outside it, full width. */
const INNER = "mx-auto max-w-7xl px-6 md:px-10";

function LegalHeader({ current }: { current: Page }) {
  return (
    <header className="border-b-2 border-track">
      <div className={`${INNER} flex min-h-10 items-center justify-between gap-4 py-[clamp(0.75rem,2.5vh,2rem)]`}>
      <Logo />
      <nav aria-label="Páginas legais">
        <ul className="flex items-center gap-1">
          {PAGES.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                aria-current={p.href === current ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-full px-4 text-sm font-bold ${p.href === current ? "bg-ink text-white" : "text-ink hover:bg-track"} ${FOCUS}`}
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      </div>
    </header>
  );
}

export const ContactLink = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className={A}>
    {CONTACT_EMAIL}
  </a>
);

/** Legal page frame: header, title, text, and a full-width footer with the last revision date. */
export function LegalPage({ current, title, updated, children }: { current: Page; title: string; updated: string; children: ReactNode }) {
  return (
    <div>
      <LegalHeader current={current} />
      <div className={INNER}>
        <main className="mx-auto mt-8 max-w-2xl animate-enter pb-12">
          <h1 className="font-display text-[32px] leading-[1.08] font-extrabold tracking-tight text-ink">{title}</h1>
          {children}
        </main>
      </div>
      <footer className="border-t-2 border-track">
        <div className={`${INNER} flex flex-wrap items-center justify-between gap-3 py-6 text-sm`}>
          <p className="text-muted">Última atualização: {updated}.</p>
          <Link href="/" className={A}>
            Voltar para o jogo
          </Link>
        </div>
      </footer>
    </div>
  );
}
