import { num, PANEL, pct, type Counts, type DayRow } from "@/lib/plays";

/** Mais ou Menos (modo infinito) no período: pessoas, partidas e sequências. Contadores "hl:*" de api/played. */
export default function PlaysHigherLower({ now, rows, when }: { now: Counts; rows: DayRow[]; when: string }) {
  const people = num(now, "hl:people");
  const start = num(now, "hl:start");
  const done = num(now, "hl:done");
  // a maior sequência não se soma entre dias: vale a maior do período
  const best = Math.max(0, ...rows.map((r) => num(r.c, "hl:best")));
  const tiles = [
    { label: "Pessoas", value: people, sub: "uma por navegador por dia" },
    { label: "Partidas", value: start, sub: people ? `${(start / people).toFixed(1)} por pessoa` : "nenhuma ainda" },
    { label: "Terminadas", value: pct(done, start), sub: `${done} foram até errar` },
    { label: "Sequência média", value: done ? (num(now, "hl:sum") / done).toFixed(1).replace(".", ",") : "—", sub: "acertos seguidos por partida" },
    { label: "Maior sequência", value: best || "—", sub: "a melhor partida do período" },
  ];
  return (
    <section className={`${PANEL} mt-4`}>
      <h2 className="font-display text-xl font-extrabold">Mais ou Menos · {when}</h2>
      <p className="mt-0.5 text-xs text-muted">modo infinito, fora do funil dos desafios diários; conta desde o dia em que este card entrou no ar</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl bg-track px-3 py-2.5">
            <p className="text-xs font-bold text-muted">{t.label}</p>
            <p className="mt-1 font-display text-3xl leading-none font-extrabold tabular-nums">{t.value}</p>
            <p className="mt-1.5 text-xs leading-snug text-muted">{t.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
