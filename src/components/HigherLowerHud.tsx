import { MEDALS } from "@/lib/higherLower";

/** Número do placar. */
function Stat({ label, value, lime = false }: { label: string; value: number; lime?: boolean }) {
  return (
    <p className="text-[10px] font-bold text-lavender md:text-[11px]">
      {label}
      <strong
        className={`block font-display text-xl leading-none font-extrabold tabular-nums md:text-3xl ${lime ? "text-lime" : "text-white"}`}
      >
        {value}
      </strong>
    </p>
  );
}

const DIVIDER = <span aria-hidden="true" className="w-px self-stretch bg-white/15" />;

/**
 * Placar do Mais ou Menos: sequência atual, recorde e o caminho até a próxima medalha.
 * No celular é uma faixa baixa (números menores, sem a fileira de medalhas): sobra tela para as cartas.
 */
export default function HigherLowerHud({ streak, best }: { streak: number; best: number }) {
  const next = MEDALS.find((m) => streak < m.at);
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-2 text-white shadow-pop max-md:w-full md:gap-4 md:px-5 md:py-3">
      <Stat label="Sequência" value={streak} lime />
      {DIVIDER}
      <Stat label="Recorde" value={best} />
      {DIVIDER}
      <div className="min-w-28 flex-1 md:min-w-36">
        <p className="flex justify-between gap-3 text-[10px] font-bold md:text-[11px]">
          <span className="text-lavender">
            {next ? (
              <>
                Próxima: <span className="text-white">{next.name}</span>
              </>
            ) : (
              "Todas as medalhas!"
            )}
          </span>
          {next && (
            <span className="tabular-nums">
              {streak}/{next.at}
            </span>
          )}
        </p>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15 md:mt-1.5 md:h-2">
          <span
            className="block h-full rounded-full bg-lime transition-[width] duration-500 ease-spring"
            style={{ width: `${next ? (streak / next.at) * 100 : 100}%` }}
          />
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
                  earned ? `animate-pop text-ink ${m.bg}` : "bg-white/10 text-lavender"
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
