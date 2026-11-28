import Logo from "./Logo";
import Watermark from "./Watermark";
import { BADGE } from "./badge";

const CARD =
  "flex h-28 w-20 items-center justify-center rounded-2xl font-display text-6xl font-extrabold shadow-pop ring-2 ring-white sm:h-36 sm:w-26 sm:text-7xl";
// Leque de cartas, como as pistas da home: a do meio é a "carta virada" (ink + lime).
const FAN = ["-rotate-8 bg-grape text-white", "relative z-10 -mx-2 -translate-y-2 bg-ink text-lime", "rotate-8 bg-grape text-white"];

/** Botão/link principal (lime) e secundário (track) das telas de erro. */
export const ERROR_BTN =
  "rounded-full px-7 py-3.5 font-bold text-ink active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";

type Props = {
  /** Três caracteres do leque de cartas ("404", "OPS") */
  cards: string;
  /** Palavra japonesa decorativa do fundo */
  kana: string;
  badge: string;
  title: string;
  text: string;
  /** Botões de ação */
  children: React.ReactNode;
};

/** Tela cheia das páginas 404 (not-found.tsx) e de erro (error.tsx). */
export default function ErrorScreen({ cards, kana, badge, title, text, children }: Props) {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-6 pb-16 md:px-10">
      <Watermark text={kana} />
      {/* Só o logo: a tela de erro não pode depender do resto do cabeçalho */}
      <header className="box-content flex min-h-10 items-center py-[clamp(0.75rem,2.5vh,2rem)]">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="flex items-center" aria-hidden="true">
          {Array.from(cards).map((c, i) => (
            <span key={i} className={`${CARD} ${FAN[i % FAN.length]}`}>
              {c}
            </span>
          ))}
        </p>
        <span className={`mt-10 ${BADGE} bg-lime text-ink`}>{badge}</span>
        <h1 className="mt-4 max-w-2xl text-balance font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-ink md:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-lg leading-relaxed text-muted">{text}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
      </main>
    </div>
  );
}
