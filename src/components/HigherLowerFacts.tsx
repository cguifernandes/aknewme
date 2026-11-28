import AnimeImage from "@/components/AnimeImage";
import type { Anime } from "@/data/animes";
import { cardFacts, type Category, type Fact } from "@/lib/higherLower";

// Ficha na carta do Mais ou Menos (specs/mais-ou-menos/01-ficha-favoritos-temas.md, seções 1 e 6): etiquetas sobre a
// imagem, lado a lado: "ano · estúdio" e o gênero; do sm para cima, também os episódios. O dado comparado na rodada
// nunca entra (cardFacts): na rodada de ano a etiqueta traz só o estúdio; na de episódios, não há a de episódios.

/** Os dados pedidos, na ordem de `keys` (o que a rodada escondeu fica de fora). */
const pick = (facts: Fact[], keys: Fact["key"][]) => keys.flatMap((k) => facts.filter((f) => f.key === k));
const TAG = "max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-bold md:px-3 md:py-1 md:text-xs";

/**
 * Faixa do topo da carta: a imagem do anime (banner do AniList; link em src/data/animes/mal.ts), só com os cantos
 * arredondados, e as etiquetas no canto de baixo. Se a imagem não carregar, some e fica a cor de fundo (`bg`).
 * Altura: 112 px no celular (os dois cards e os botões cabem em 375×667 sem rolar), 176 px do md para cima.
 */
export function Banner({ anime, cat, bg, tag }: { anime: Anime; cat: Category; bg: string; tag: string }) {
  const facts = cardFacts(anime, cat);
  const groups = [pick(facts, ["year", "studio"]), pick(facts, ["genre"]), pick(facts, ["episodes"])];
  return (
    <div className={`relative h-28 shrink-0 overflow-hidden rounded-2xl md:h-44 md:rounded-[20px] ${bg}`}>
      <AnimeImage anime={anime} sizes="(min-width: 768px) 828px, 384px" />
      <ul className="absolute inset-x-1.5 bottom-1.5 flex flex-wrap gap-1 md:inset-x-2.5 md:bottom-2.5 md:gap-1.5" aria-label="Ficha">
        {groups.map(
          (g, i) =>
            g.length > 0 && (
              // os episódios (3ª etiqueta) só do sm para cima: no celular não cabem numa linha
              <li key={g[0].key} className={`${TAG} ${tag} ${i === 2 ? "max-sm:hidden" : ""}`}>
                {g.map((f, k) => (
                  <span key={f.key}>
                    {k > 0 && " · "}
                    <span className="sr-only">{f.label}: </span>
                    {f.text}
                  </span>
                ))}
              </li>
            ),
        )}
      </ul>
    </div>
  );
}
