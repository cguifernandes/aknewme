import { THEMES } from "@/lib/higherLower";
import { num, PANEL, pct, type Counts, type DayRow } from "@/lib/plays";

const decimal = (n: number) => n.toFixed(1).replace(".", ",");

/**
 * Mais ou Menos (modo infinito) no período: pessoas, partidas e sequências, no total e por tema (Todos os animes,
 * Anos 2010, Ação). Contadores "hl:*" de api/played; os de tema levam o id do tema no fim ("hl:start:2010s").
 */
export default function PlaysHigherLower({ now, rows, when }: { now: Counts; rows: DayRow[]; when: string }) {
  const people = num(now, "hl:people");
  const start = num(now, "hl:start");
  const done = num(now, "hl:done");
  // a maior sequência não se soma entre dias: vale a maior do período
  const best = Math.max(0, ...rows.map((r) => num(r.c, "hl:best")));
  const tiles = [
    { label: "Pessoas", value: people, sub: "Uma por navegador por dia" },
    { label: "Partidas", value: start, sub: people ? `${(start / people).toFixed(1)} por pessoa` : "Nenhuma ainda" },
    { label: "Terminadas", value: pct(done, start), sub: `${done} foram até errar` },
    { label: "Sequência média", value: done ? decimal(num(now, "hl:sum") / done) : "—", sub: "Acertos seguidos por partida" },
    { label: "Maior sequência", value: best || "—", sub: "A melhor partida do período" },
  ];
  const themes = THEMES.map((t) => {
    const [s, d] = [num(now, `hl:start:${t.id}`), num(now, `hl:done:${t.id}`)];
    return { label: t.label, start: s, done: d, avg: d ? num(now, `hl:sum:${t.id}`) / d : null, best: Math.max(0, ...rows.map((r) => num(r.c, `hl:best:${t.id}`))) };
  });
  // partidas de antes da separação por tema (ou de página antiga em cache) não têm tema: só entram no total
  const untagged = start - themes.reduce((n, t) => n + t.start, 0);
  return (
    <section className={`${PANEL} mt-4`}>
      <h2 className="font-display text-xl font-extrabold">Mais ou Menos · {when}</h2>
      <p className="mt-0.5 text-xs text-muted">Modo infinito, fora do funil dos desafios diários; conta desde o dia em que este card entrou no ar</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl bg-track px-3 py-2.5">
            <p className="text-xs font-bold text-muted">{t.label}</p>
            <p className="mt-1 font-display text-3xl leading-none font-extrabold tabular-nums">{t.value}</p>
            <p className="mt-1.5 text-xs leading-snug text-muted">{t.sub}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-5 font-display text-base font-extrabold">Por tema</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <thead>
            <tr className="text-xs text-muted">
              {["Tema", "Partidas", "Do total", "Terminadas", "Sequência média", "Maior sequência"].map((h, i) => (
                <th key={h} scope="col" className={`py-1.5 font-bold ${i ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {themes.map((t) => (
              <tr key={t.label} className="border-t border-track">
                <th scope="row" className="py-2 font-bold">
                  {t.label}
                </th>
                <td className="py-2 text-right font-bold">{t.start}</td>
                <td className="py-2 text-right">{pct(t.start, start)}</td>
                <td className="py-2 text-right">{pct(t.done, t.start)}</td>
                <td className="py-2 text-right">{t.avg === null ? "—" : decimal(t.avg)}</td>
                <td className="py-2 text-right">{t.best || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {untagged > 0 && <p className="mt-2 text-xs text-muted">{untagged} partidas do período são de antes da separação por tema e só entram no total.</p>}
    </section>
  );
}
