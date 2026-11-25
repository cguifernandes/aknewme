import { num, PANEL, pct, sum, visits, type Counts, type DayRow } from "@/lib/plays";

/** Mini-gráfico dos últimos dias (o mais recente por último, em lime). */
function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-9 shrink-0 items-end gap-0.5" aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-sm ${i === values.length - 1 ? "bg-lime" : "bg-lavender"}`}
          style={{ height: `${Math.max(6, (100 * v) / max)}%` }}
        />
      ))}
    </div>
  );
}

function Kpi({ label, value, sub, spark }: { label: string; value: React.ReactNode; sub: string; spark: number[] }) {
  return (
    <div className={`${PANEL} flex items-end justify-between gap-3`}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <p className="mt-1 font-display text-4xl leading-none font-extrabold tabular-nums">{value}</p>
        <p className="mt-2 text-xs text-muted">{sub}</p>
      </div>
      <Spark values={spark} />
    </div>
  );
}

/** Os quatro números do período: visitas, quem jogou, conclusão e acerto. O mini-gráfico mostra os 7 últimos dias. */
export default function PlaysKpis({ now, n, rows }: { now: Counts; n: number; rows: DayRow[] }) {
  const week = rows.slice(0, 7).reverse();
  const spark = (f: (c: Counts) => number) => week.map((r) => f(r.c));
  const before = rows[1]?.c ?? {};
  const diff = visits(now) - visits(before);
  const people = num(now, "people");
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        label="Visitas"
        value={visits(now)}
        sub={n === 1 ? `${diff > 0 ? "+" : ""}${diff} em relação a ontem (${visits(before)})` : `Média ${(visits(now) / n).toFixed(1)}/dia`}
        spark={spark(visits)}
      />
      <Kpi label="Jogaram" value={people} sub={`${pct(people, visits(now))} das visitas jogaram`} spark={spark((c) => num(c, "people"))} />
      <Kpi
        label="Conclusão"
        value={pct(sum(now), sum(now, ":start"))}
        sub={`${sum(now)} terminados de ${sum(now, ":start")} começados`}
        spark={spark((c) => sum(c))}
      />
      <Kpi
        label="Acerto"
        value={pct(sum(now, ":won"), sum(now))}
        sub={`${sum(now, ":won")} acertos em ${sum(now)} jogos`}
        spark={spark((c) => sum(c, ":won"))}
      />
    </section>
  );
}
