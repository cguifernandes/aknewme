import { MEDALS } from "@/lib/higherLower";

/** Número do placar; a `key` refaz o "pop" a cada mudança. */
function Stat({ label, value, lime = false }: { label: string; value: number; lime?: boolean }) {
  return (
    <p className="text-[11px] font-bold text-lavender">
      {label}
      <strong
        key={value}
        className={`block animate-pop font-display text-3xl leading-none font-extrabold tabular-nums ${lime ? "text-lime" : "text-white"}`}
      >
        {value}
      </strong>
    </p>
  );
}

const DIVIDER = <span aria-hidden="true" className="w-px self-stretch bg-white/15" />;

/** Placar do Mais ou Menos: sequência atual, recorde e o caminho até a próxima medalha. */
export default function HigherLowerHud({ streak, best }: { streak: number; best: number }) {
  const next = MEDALS.find((m) => streak < m.at);
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-ink px-5 py-2.5 text-white md:py-3 shadow-pop max-md:w-full">
      <Stat label="Sequência" value={streak} lime />
      {DIVIDER}
      <Stat label="Recorde" value={best} />
      {DIVIDER}
      <div className="min-w-36 flex-1">
        <p className="flex justify-between gap-3 text-[11px] font-bold">
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
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full rounded-full bg-lime transition-[width] duration-500 ease-spring"
            style={{ width: `${next ? (streak / next.at) * 100 : 100}%` }}
          />
        </div>
        <ul className="mt-1.5 flex gap-1.5" aria-label="Medalhas">
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
