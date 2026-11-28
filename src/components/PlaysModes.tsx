import type { Anime } from "@/data/animes";
import { dailyAnimes, MODE_LABEL, pickOpening, type GameMode } from "@/lib/game";
import { MODES, num, PANEL, pct, type Counts } from "@/lib/plays";
import AnimeImage from "./AnimeImage";

/** Uma linha de anime do desafio: capa, título e o que o modo mostra dele. */
function AnimeRow({ anime, title, children }: { anime: Anime; title?: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-track">
        <AnimeImage anime={anime} kind="cover" sizes="64px" />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-sm leading-tight font-bold">{title ?? anime.title}</strong>
        <span className="block truncate text-xs text-muted">{children}</span>
      </span>
    </li>
  );
}

/** O que caiu no desafio do dia — o mesmo sorteio dos jogos (no Opening, a música é a do pickOpening, como no OpeningGame). */
function Animes({ mode, day }: { mode: GameMode; day: number }) {
  const animes = dailyAnimes(mode, day);
  if (mode === "emoji") {
    // as três primeiras rodadas em linhas; as duas últimas juntas, para o card não ficar comprido
    const [first, rest] = [animes.slice(0, 3), animes.slice(3)];
    return (
      <ol className="mt-4 space-y-2.5">
        {first.map((a, i) => (
          <AnimeRow key={a.title} anime={a}>
            rodada {i + 1} · {a.emojis.join(" ")}
          </AnimeRow>
        ))}
        {rest.length > 0 && (
          <AnimeRow anime={rest[0]} title={`+ ${rest.map((a) => a.title).join(", ")}`}>
            rodadas {rest.map((_, i) => first.length + i + 1).join(" e ")}
          </AnimeRow>
        )}
      </ol>
    );
  }
  const a = animes[0];
  const song = mode === "opening" ? pickOpening(a, day) : null;
  return (
    <ol className="mt-4">
      <AnimeRow anime={a}>{song ? `“${song.name}” · ${song.artist}` : `${a.year} · ${a.studio} · ${a.genre}`}</AnimeRow>
    </ol>
  );
}

/** Funil do modo (começaram → terminaram → acertaram), o anime do dia e os votos de dificuldade (DailyFeedback). */
function Mode({ mode, c, day }: { mode: GameMode; c: Counts; day?: number }) {
  const done = num(c, mode);
  const start = Math.max(num(c, `${mode}:start`), done); // dias antigos não têm "começaram"
  const won = num(c, `${mode}:won`);
  const steps = [
    { label: "Começaram", value: start, bar: "bg-lavender" },
    { label: "Terminaram", value: done, bar: "bg-grape" },
    { label: "Acertaram", value: won, bar: "bg-lime" },
  ];
  const [easy, ok, hard] = ["easy", "ok", "hard"].map((l) => num(c, `${mode}:fb:${l}`));
  const [yes, no] = [num(c, `${mode}:like:yes`), num(c, `${mode}:like:no`)];
  return (
    <div className={PANEL}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-2xl font-extrabold">{MODE_LABEL[mode]}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${!start ? "bg-track" : done * 2 >= start ? "bg-lime/50" : "bg-sun/60"}`}>
          conclusão {pct(done, start)}
        </span>
      </div>
      {day !== undefined && <Animes mode={mode} day={day} />}
      <div className="mt-4 space-y-2 border-t-2 border-track pt-4">
        {steps.map((s) => (
          <div key={s.label} className="flex items-center gap-3 text-sm">
            <span className="w-24 font-semibold text-muted">{s.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-track">
              <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${start ? (100 * s.value) / start : 0}%` }} />
            </div>
            <span className="w-8 text-right font-bold tabular-nums">{s.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl bg-track px-4 py-2.5 text-xs">
        <span className="font-bold">Dificuldade (votos)</span>
        {easy + ok + hard + yes + no ? (
          <span className="text-muted tabular-nums">
            difícil <strong className="text-ink">{hard}</strong> · na medida <strong className="text-ink">{ok}</strong> · fácil{" "}
            <strong className="text-ink">{easy}</strong>
            {yes + no > 0 && (
              <>
                {" "}
                · gostaram <strong className="text-ink">{pct(yes, yes + no)}</strong>
              </>
            )}
          </span>
        ) : (
          <span className="text-muted">Nenhum voto ainda</span>
        )}
      </div>
    </div>
  );
}

/** Os três modos lado a lado. `day` = mostra o anime do desafio daquele dia (só faz sentido com o período "Hoje"). */
export default function PlaysModes({ c, day }: { c: Counts; day?: number }) {
  return (
    <section className="mt-4 grid gap-4 lg:grid-cols-3">
      {MODES.map((m) => (
        <Mode key={m} mode={m} c={c} day={day} />
      ))}
    </section>
  );
}
