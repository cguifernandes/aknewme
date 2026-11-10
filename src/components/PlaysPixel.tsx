import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { PANEL, pct, sum, type Counts } from "@/lib/plays";
import { Icon } from "./icons";

/** O que a API de estatísticas do pixel devolveu: contagem por evento; string = erro da API; null = sem credenciais. */
export type PixelStats = Record<string, number> | string | null;

/** Eventos do pixel, na ordem do funil, com o contador do painel que mede a mesma coisa (null = só o Meta mede). */
const EVENTS: { event: string; ours: string | null; bar: string }[] = [
  { event: "PageView", ours: null, bar: "bg-lavender" },
  { event: "JogoIniciado", ours: ":start", bar: "bg-grape" },
  { event: "JogoConcluido", ours: "", bar: "bg-lime" },
];

/** Selo de situação do pixel. */
function PixelBadge({ pixel }: { pixel: PixelStats }) {
  const [label, bg] = pixel === null ? ["Não configurado", "bg-track"] : typeof pixel === "string" ? ["Erro", "bg-blush"] : ["Ativo", "bg-lime/50"];
  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${bg}`}>{label}</span>;
}

/** Funil do pixel do Meta no período escolhido no filtro: PageView → JogoIniciado → JogoConcluido, comparado com os contadores do painel. */
export default function PlaysPixel({ pixel, now }: { pixel: PixelStats; now: Counts }) {
  const ok = pixel !== null && typeof pixel !== "string";
  const count = (event: string) => (ok ? (pixel[event] ?? 0) : 0);
  const views = count("PageView");
  return (
    <section className={`${PANEL} mt-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex flex-wrap items-center gap-3 font-display text-xl font-extrabold">
            Pixel do Meta <PixelBadge pixel={pixel} />
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {pixel === null
              ? "defina NEXT_PUBLIC_META_PIXEL_ID e META_ACCESS_TOKEN para ver o que o Meta recebeu"
              : typeof pixel === "string"
                ? `a API do Meta respondeu com erro: ${pixel}`
                : "eventos que chegaram ao Meta (dias em UTC); adblock e arquivo ficam de fora, então é normal dar menos que o painel"}
          </p>
        </div>
        {ok && (
          <p className="rounded-xl bg-track px-4 py-2 text-right text-xs font-semibold text-muted">
            Visita → jogo concluído
            <strong className="block font-display text-2xl leading-tight font-extrabold text-grape">{pct(count("JogoConcluido"), views)}</strong>
          </p>
        )}
      </div>

      {ok && (
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {EVENTS.map(({ event, ours, bar }, i) => {
            const value = count(event);
            const panel = ours === null ? null : sum(now, ours);
            return (
              <div key={event} className="contents">
                {i > 0 && (
                  // passagem de uma etapa para a outra
                  <p className="flex shrink-0 flex-col items-center justify-center text-xs font-bold text-grape max-lg:flex-row max-lg:gap-2">
                    <Icon icon={faArrowRight} className="text-base text-lavender max-lg:rotate-90" />
                    {pct(value, count(EVENTS[i - 1].event))}
                  </p>
                )}
                <div className="flex-1 rounded-2xl border-2 border-track p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-muted">{event}</p>
                    <span className="rounded-full bg-track px-2.5 py-1 text-[11px] font-bold">
                      {panel === null ? "só no Meta" : value >= panel ? "Meta ≥ painel" : "Meta < painel"}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-4xl leading-none font-extrabold tabular-nums">{value}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-track">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${views ? Math.min(100, (100 * value) / views) : 0}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted">{panel === null ? "carregamentos de página, fora o /plays" : `painel contou ${panel}`}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
