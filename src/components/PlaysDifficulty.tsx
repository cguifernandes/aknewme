import { LEVEL_LABEL } from "@/lib/difficulty";
import { dailyAnimes, dayLevel, MODE_LABEL } from "@/lib/game";
import { date, MODES, num, pct, type DayRow } from "@/lib/plays";

const TH = "py-2 pr-4 font-semibold";
const TD = "py-2 pr-4 tabular-nums";

/**
 * Painel /plays: dificuldade por anime. Uma linha por desafio (dia + modo) do período, com o anime sorteado
 * naquele dia, quantos terminaram, a taxa de acerto e os votos do "Como foi o desafio de hoje?" (DailyFeedback).
 * Ordem: mais votos de "difícil demais" primeiro; no empate (ou sem votos), menor taxa de acerto primeiro.
 */
export default function PlaysDifficulty({ rows }: { rows: DayRow[] }) {
  const list = rows
    .flatMap(({ day, c }) =>
      MODES.map((mode) => {
        const done = num(c, mode);
        const [easy, ok, hard] = ["easy", "ok", "hard"].map((l) => num(c, `${mode}:fb:${l}`));
        const [yes, no] = [num(c, `${mode}:like:yes`), num(c, `${mode}:like:no`)];
        return { day, mode, done, won: num(c, `${mode}:won`), easy, ok, hard, votes: easy + ok + hard, yes, no, animes: dailyAnimes(mode, day) };
      }),
    )
    .filter((r) => r.done > 0 || r.votes > 0)
    .sort((a, b) => b.hard / (b.votes || 1) - a.hard / (a.votes || 1) || b.hard - a.hard || a.won / (a.done || 1) - b.won / (b.done || 1));

  if (!list.length) return <p className="mt-3 text-sm text-muted">Ninguém jogou nesse período ainda.</p>;
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="border-b-2 border-track text-xs text-muted">
          <tr>
            <th className={TH}>Anime</th>
            <th className={TH}>Desafio</th>
            <th className={TH}>Terminaram</th>
            <th className={TH}>Acerto</th>
            <th className={TH}>Difícil demais</th>
            <th className={TH}>Na medida</th>
            <th className={TH}>Fácil demais</th>
            <th className={TH}>Gostaram</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => {
            const level = dayLevel(r.day);
            return (
            <tr key={`${r.day}-${r.mode}`} className="border-b border-track last:border-0">
              {/* no Emoji são cinco animes no mesmo desafio: o voto vale para o conjunto */}
              <td className="max-w-72 truncate py-2 pr-4 font-bold" title={r.animes.map((a) => a.title).join(" · ")}>
                {r.animes.map((a) => a.title).join(" · ")}
              </td>
              <td className={TD}>
                #{r.day} · {date(r.day)} · {MODE_LABEL[r.mode]}
                {level && level !== "normal" && ` · ${LEVEL_LABEL[level]}`}
              </td>
              <td className={TD}>{r.done}</td>
              <td className={TD}>{pct(r.won, r.done)}</td>
              <td className={TD}>
                {r.votes ? (
                  <span className={`rounded-full px-2.5 py-1 font-bold ${r.hard * 2 >= r.votes ? "bg-blush" : "bg-track"}`}>
                    {r.hard} · {pct(r.hard, r.votes)}
                  </span>
                ) : (
                  <span className="text-muted">sem votos</span>
                )}
              </td>
              <td className={TD}>{r.votes ? `${r.ok} · ${pct(r.ok, r.votes)}` : ""}</td>
              <td className={TD}>{r.votes ? `${r.easy} · ${pct(r.easy, r.votes)}` : ""}</td>
              <td className={TD}>{r.yes + r.no ? `${pct(r.yes, r.yes + r.no)} (${r.yes} de ${r.yes + r.no})` : ""}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
