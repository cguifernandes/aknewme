import { date, num, PANEL, visits, type DayRow } from "@/lib/plays";

/** Teto "redondo" do eixo (múltiplo de 3: as linhas de 1/3 e 2/3 dão números inteiros). */
function ceiling(max: number) {
  return [3, 6, 12, 30, 60, 120, 300, 600, 1200, 3000, 6000].find((s) => s >= max) ?? Math.ceil(max / 3000) * 3000;
}

/**
 * Visitas × quem jogou, dia a dia, nos últimos 30 dias.
 * Passar o mouse (ou focar) numa coluna mostra os números do dia (tooltip `tip` do tema).
 */
export default function PlaysChart({ rows }: { rows: DayRow[] }) {
  const days = rows.slice(0, 30).reverse();
  const top = ceiling(Math.max(1, ...days.map((r) => visits(r.c))));
  const peak = days.reduce((a, b) => (visits(b.c) > visits(a.c) ? b : a), days[0]);
  const h = (v: number) => `${(100 * v) / top}%`;
  return (
    <section className={`${PANEL} flex flex-col`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Últimos {days.length} dias</h2>
          <p className="mt-0.5 text-xs text-muted">
            Pico de {visits(peak.c)} visitas em {date(peak.day)} · passe o mouse nas barras
          </p>
        </div>
        <ul className="flex gap-4 text-xs font-semibold text-muted">
          <li className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-lavender" aria-hidden="true" /> Visitas
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-grape" aria-hidden="true" /> Jogaram
          </li>
        </ul>
      </div>

      <div className="mt-4 flex min-h-36 flex-1 gap-3">
        {/* eixo: teto, 2/3, 1/3 e zero */}
        <div className="flex flex-col justify-between pb-6 text-right text-[11px] text-muted tabular-nums" aria-hidden="true">
          {[3, 2, 1, 0].map((i) => (
            <span key={i}>{(top * i) / 3}</span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative flex flex-1 items-end gap-0.5 border-b-2 border-lavender sm:gap-1">
            {[1, 2, 3].map((i) => (
              <span key={i} aria-hidden="true" className="absolute inset-x-0 border-t border-track" style={{ bottom: `${(100 * i) / 3}%` }} />
            ))}
            {days.map((r, i) => {
              const label = `#${r.day} · ${date(r.day)}: ${visits(r.c)} visitas · ${num(r.c, "people")} jogaram`;
              return (
                <div
                  key={r.day}
                  tabIndex={0}
                  aria-label={label}
                  data-tip={label}
                  // nas pontas o balão alinha à borda, para não sair do cartão
                  data-tip-side={i < 5 ? "start" : i >= days.length - 5 ? "end" : undefined}
                  className="tip flex h-full min-w-0 flex-1 items-end justify-center gap-px rounded-t-sm hover:bg-track focus-visible:bg-track focus-visible:outline-none"
                >
                  {/* hoje em lime: o dia ainda está correndo */}
                  <span className={`w-1/2 max-w-4 rounded-t-sm ${i === days.length - 1 ? "bg-lime" : "bg-lavender"}`} style={{ height: h(visits(r.c)) }} />
                  <span className="w-1/2 max-w-4 rounded-t-sm bg-grape" style={{ height: h(num(r.c, "people")) }} />
                </div>
              );
            })}
          </div>
          {/* datas: uma a cada 5 dias, contando de hoje para trás */}
          <div className="flex h-6 items-end gap-0.5 text-[11px] text-muted sm:gap-1" aria-hidden="true">
            {days.map((r, i) => (
              <span key={r.day} className="flex min-w-0 flex-1 justify-center whitespace-nowrap">
                {(days.length - 1 - i) % 5 === 0 && date(r.day)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
