import { MEDALS } from "@/lib/higherLower";

const CELL = "flex min-w-0 flex-col justify-center rounded-xl bg-grape-deep px-2 py-1 md:px-4 md:py-2.5";
const LABEL = "text-[9px] font-bold tracking-wide text-lavender uppercase md:text-[11px]";

/** Número do placar. */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <p className={`${CELL} ${LABEL}`}>
      {label}
      <strong className="block font-display text-lg leading-tight font-extrabold text-lime tabular-nums md:text-3xl">{value}</strong>
    </p>
  );
}

/**
 * Placar do Mais ou Menos (specs/mais-ou-menos/01-ficha-favoritos-temas.md, seção 6): faixa grape com blocos grape-deep:
 * o tema (`theme`, o seletor; sem ele, o bloco some: THEMES_ENABLED), a sequência atual, o recorde e o caminho até a
 * próxima medalha.
 * No celular é uma faixa baixa (sem a fileira de medalhas): sobra tela para as cartas.
 */
export default function HigherLowerHud({ streak, best, theme }: { streak: number; best: number; theme?: React.ReactNode }) {
  const next = MEDALS.find((m) => streak < m.at);
  return (
    <div
      className={`grid items-stretch gap-1.5 rounded-2xl bg-grape p-1.5 text-white shadow-pop max-md:w-full md:gap-2 md:p-2.5 ${
        theme ? "grid-cols-[auto_auto_auto_minmax(0,1fr)] md:grid-cols-[auto_auto_auto_minmax(11rem,1fr)]" : "grid-cols-[auto_auto_minmax(0,1fr)] md:grid-cols-[auto_auto_minmax(11rem,1fr)]"
      }`}
    >
      {theme && <div className={CELL}>{theme}</div>}
      <Stat label="Sequência" value={streak} />
      <Stat label="Recorde" value={best} />
      <div className={CELL}>
        <p className={`flex justify-between gap-2 ${LABEL}`}>
          <span className="truncate">{next ? next.name : "Todas as medalhas!"}</span>
          {next && (
            <span className="tabular-nums">
              {streak}/{next.at}
            </span>
          )}
        </p>
        <div
          className="mt-1 h-1.5 overflow-hidden rounded-full bg-grape-ink md:mt-1.5 md:h-2"
          role="img"
          aria-label={next ? `Próxima medalha: ${next.name}, ${streak} de ${next.at}` : "Todas as medalhas conquistadas"}
        >
          <span className="block h-full rounded-full bg-lime transition-[width] duration-500 ease-spring" style={{ width: `${next ? (streak / next.at) * 100 : 100}%` }} />
        </div>
        <ul className="mt-1.5 flex gap-1.5 max-md:hidden" aria-label="Medalhas">
          {MEDALS.map((m) => {
            const earned = streak >= m.at;
            return (
              <li
                // a key muda ao conquistar: a medalha "pula" na hora
                key={earned ? `${m.name}!` : m.name}
                tabIndex={0}
                data-tip={`${m.name}: ${m.at} acertos seguidos`}
                aria-label={`${m.name}: ${m.at} acertos seguidos${earned ? " (conquistada)" : ""}`}
                className={`tip flex h-5 min-w-7 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold ${
                  earned ? `animate-pop text-ink ${m.bg}` : "bg-grape-ink text-lavender"
                }`}
              >
                {m.at}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
