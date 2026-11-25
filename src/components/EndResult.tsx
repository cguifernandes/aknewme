import type { Anime } from "@/data/animes";
import type { Summary } from "@/lib/endcard";
import { animeClues, dayLabel, MODE_LABEL, OPENING_STAGES, type GameMode } from "@/lib/game";
import { HeartIcon } from "./icons";
import { Tile, tileBg, tileLabel } from "./ResultTiles";

/** Opening: o que cada quadradinho quer dizer na lista de tentativas. */
const STATUS: Record<string, string> = { "🟩": "acertou", "🟨": "resgate", "🟥": "errou", "⬛": "pulou" };
/** Selo de cada linha da lista: o quadradinho com ✓/✗ do site; o "não usado" vira um tracejado (o do site é claro demais sobre o roxo). */
function Mark({ t }: { t: string }) {
  if (t === "⬜") return <span aria-hidden="true" className="size-6 shrink-0 rounded-md border-2 border-dashed border-lavender/40" />;
  return <Tile t={t} />;
}

type Props = {
  mode: GameMode;
  day: number;
  tiles: string[];
  /** Linha dos corações do Emoji (❤️ por vida que sobrou, 🖤 por vida perdida) */
  extra: string;
  summary: Summary;
  /** Emoji: os 5 do dia · Opening e Pistas: o anime da resposta */
  animes: Anime[];
  tries?: string[];
  /** "HH:MM:SS" até o próximo desafio, e o número dele */
  countdown: string;
  next: number;
};

/** Passo a passo do resultado: rodadas do Emoji, tentativas da Opening ou pistas usadas. */
function Details({ mode, tiles, animes, tries }: Pick<Props, "mode" | "tiles" | "animes" | "tries">) {
  const box = "mt-4 rounded-2xl bg-grape-deep p-3";
  if (mode === "emoji")
    return (
      <ol className={`${box} space-y-2`}>
        {animes.map((a, i) => (
          <li key={a.title} className="flex items-center gap-2.5">
            <Mark t={tiles[i] ?? "⬜"} />
            <span className="sr-only">{tileLabel(tiles[i] ?? "⬜")}:</span>
            <span aria-hidden="true" className="shrink-0 tracking-widest">
              {a.emojis.join("")}
            </span>
            <span className="min-w-0 flex-1 truncate text-right text-sm font-bold">{a.title}</span>
          </li>
        ))}
      </ol>
    );

  if (mode === "opening")
    return (
      <ol className={`${box} space-y-1.5`}>
        {tiles.map((t, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <span className="w-7 shrink-0 font-bold text-lavender tabular-nums">{OPENING_STAGES[i]}s</span>
            <span className="min-w-0 flex-1 truncate font-bold">{t === "⬜" ? "—" : tries?.[i] || (t === "⬛" ? "Pulou" : "")}</span>
            {STATUS[t] && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-ink ${tileBg(t)}`}>{STATUS[t]}</span>}
          </li>
        ))}
      </ol>
    );

  const anime = animes[0];
  if (!anime) return null;
  return (
    <ol className={`${box} space-y-1.5`}>
      {animeClues(anime).map((c, i) => {
        const t = tiles[i] ?? "⬜";
        return (
          <li key={c.label} className={`flex items-center gap-2.5 text-sm ${t === "⬜" ? "opacity-60" : ""}`}>
            <Mark t={t} />
            <span className="w-24 shrink-0 text-xs font-semibold text-lavender">{c.label}</span>
            <span className="min-w-0 flex-1 truncate font-bold">{c.value}</span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Contagem até o próximo desafio, em blocos. Os segundos (o que está andando) ficam em lime;
 * na última hora os três ficam, para dar o recado de que falta pouco.
 */
function NextTimer({ countdown, next }: Pick<Props, "countdown" | "next">) {
  const [h, m, s] = countdown.split(":");
  const soon = h === "00";
  return (
    <div className="mt-auto pt-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3">
        <p className="text-[11px] leading-tight font-bold tracking-wider text-lime uppercase">
          Próximo desafio
          <span className="block text-sm tracking-normal text-white normal-case">{soon ? `#${next} já vem aí` : `#${next}`}</span>
        </p>
        {/* o texto para leitor de tela não muda a cada segundo */}
        <p className="flex items-start gap-1.5" role="timer" aria-label={h === "--" ? undefined : `Faltam ${Number(h)} horas e ${Number(m)} minutos`}>
          {[
            [h, "horas", soon],
            [m, "min", soon],
            [s, "seg", true],
          ].map(([value, unit, lime], i) => (
            <span key={unit as string} aria-hidden="true" className="flex items-start gap-1.5">
              {i > 0 && <span className="pt-1.5 font-display font-extrabold text-lavender">:</span>}
              <span className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-9 w-10 items-center justify-center rounded-lg font-display text-xl font-extrabold tabular-nums transition-colors ${
                    lime ? "bg-lime text-ink" : "bg-grape text-white"
                  }`}
                >
                  {value}
                </span>
                <span className="text-[9px] font-bold tracking-wider text-lavender uppercase">{unit}</span>
              </span>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

/**
 * Lado roxo da janela de fim de jogo: o modo em destaque, o placar grande, o passo a
 * passo (cada linha com o ✓/✗ dela, por isso não há fileira de quadradinhos) e a contagem para o próximo desafio.
 * (As imagens ficam no lado branco: EndAnimes.)
 */
export default function EndResult({ mode, day, tiles, extra, summary, animes, tries, countdown, next }: Props) {
  const lives = extra.split("❤️").length - 1;
  const totalLives = lives + extra.split("🖤").length - 1;
  return (
    <section className="flex min-w-0 flex-col bg-grape p-5 text-white">
      {/* no celular o "Fechar" da janela fica neste canto: a data não encosta nele */}
      <p className="flex items-center justify-between gap-2 max-md:justify-start">
        <span className="font-display text-xl font-extrabold tracking-tight">
          aknewme<span className="text-lime">.</span>
        </span>
        <span className="rounded-full bg-ink/60 px-2.5 py-1 text-xs font-bold">
          #{day} · {dayLabel(day)}
        </span>
      </p>

      <p className="mt-4 flex">
        <span className="inline-flex items-center gap-2 rounded-full bg-lime py-1 pr-4 pl-1 text-ink">
          <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold tracking-wider text-lime uppercase">Modo</span>
          <span className="font-display text-lg leading-none font-extrabold">{MODE_LABEL[mode]}</span>
        </span>
      </p>

      <p className="mt-4 text-xs font-semibold text-lavender">{summary.lead}</p>
      <p className="font-display leading-none font-extrabold">
        <span className="text-7xl tracking-tighter">{summary.big}</span>
        <span className="ml-2 text-xl">{summary.unit}</span>
      </p>

      {extra && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-lavender">
          {Array.from({ length: totalLives }, (_, i) => (
            <span key={i} className={i < lives ? "text-blush" : "text-white/40"}>
              <HeartIcon lost={i >= lives} />
            </span>
          ))}
          <span className="ml-1">{lives === 0 ? "Sem vidas restantes" : `${lives} de ${totalLives} vidas restantes`}</span>
        </p>
      )}

      <Details mode={mode} tiles={tiles} animes={animes} tries={tries} />
      <NextTimer countdown={countdown} next={next} />
    </section>
  );
}
