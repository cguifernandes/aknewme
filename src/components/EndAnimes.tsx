import type { Anime } from "@/data/animes";
import { isHit } from "@/lib/challenge";
import type { GameMode } from "@/lib/game";
import AnimeImage from "./AnimeImage";
import { Tile, tileLabel } from "./ResultTiles";

const LABEL = "text-[10px] font-bold tracking-wider text-grape uppercase";

/**
 * As imagens do resultado, no lado branco da janela de fim de jogo (só aparecem depois da resposta).
 * Padrão dos dois formatos: cartão escuro com a imagem em cima e, dentro dele, o título em branco e uma linha em lavender.
 * Emoji: os cartões das rodadas em duas linhas, para a imagem ficar maior (5 animes = 3 em cima e 2 embaixo, mais largos),
 * cada um com o selo ✓/✗ do resultado no canto (errou = capa apagada); num duelo, embaixo de cada cartão vão os dois
 * quadradinhos (você e quem desafiou), que é o "rodada a rodada".
 * Opening e Pistas: o banner do anime, alto, com "A resposta era".
 */
export default function EndAnimes({
  mode,
  animes,
  tiles,
  detail,
  rival,
}: {
  mode: GameMode;
  /** Emoji: os 5 do dia · Opening e Pistas: o anime da resposta */
  animes: Anime[];
  tiles: string[];
  /** Opening: nome e artista da abertura */
  detail?: string;
  rival?: { nick: string; tiles: string[] };
}) {
  if (!animes.length) return null;

  if (mode === "emoji") {
    // grade de 6 colunas: com 5 animes, os 3 primeiros ocupam 2 cada e os 2 últimos, 3 cada; fora isso, 2 por linha
    const span = (i: number) => (animes.length === 5 && i < 3 ? "col-span-2" : "col-span-3");
    return (
      <div>
        <p className={`${LABEL} mb-1.5 flex justify-between gap-2`}>
          Os animes de hoje
          {rival && <span className="truncate normal-case">você · {rival.nick}</span>}
        </p>
        <ol className="grid grid-cols-6 gap-2">
          {animes.map((a, i) => {
            const mine = tiles[i] ?? "⬜";
            const theirs = rival?.tiles[i] ?? "⬜";
            return (
              <li key={a.title} className={`min-w-0 ${span(i)}`}>
                <div className="relative overflow-hidden rounded-xl bg-ink text-white">
                  <div className="relative h-24 bg-grape-ink">
                    {/* errou ou pulou: a capa fica apagada e sem cor, para as que acertou saltarem aos olhos */}
                    <div className={`absolute inset-0 ${isHit(mine) ? "" : "opacity-40 grayscale"}`}>
                      <AnimeImage anime={a} kind="cover" sizes="256px" />
                    </div>
                  </div>
                  <Tile t={mine} className="absolute top-1.5 right-1.5 size-5 rounded-md text-[10px] ring-2 ring-ink" />
                  <span className="sr-only">{tileLabel(mine)}:</span>
                  <div className="px-2 py-1">
                    <p className="truncate text-[11px] leading-tight font-bold" title={a.title}>
                      {a.title}
                    </p>
                    <p className="truncate text-[9px] text-lavender">{a.year}</p>
                  </div>
                </div>
                {rival && (
                  <p className="mt-1 flex justify-center gap-1" aria-label={`Você, ${tileLabel(mine)}; ${rival.nick}, ${tileLabel(theirs)}`}>
                    <Tile t={mine} className="size-4 rounded text-[8px]" />
                    <Tile t={theirs} className="size-4 rounded text-[8px]" />
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const a = animes[0];
  return (
    <div className="overflow-hidden rounded-2xl bg-ink text-white">
      <div className="relative h-44 bg-grape-ink">
        <AnimeImage anime={a} sizes="828px" />
      </div>
      <div className="px-3.5 py-2.5">
        <p className="text-[10px] font-bold tracking-wider text-lime uppercase">A resposta era</p>
        <p className="font-display text-lg leading-tight font-extrabold">{a.title}</p>
        <p className="text-xs text-lavender">{mode === "opening" && detail ? detail : `${a.studio} · ${a.year} · ${a.episodes} episódios`}</p>
      </div>
    </div>
  );
}
