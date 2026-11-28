// Catálogo de cada dia: dias que já começaram nunca mudam de anime (specs/catalogo/01-novos-animes.md, "Problema técnico").
// O sorteio embaralha a lista inteira, então qualquer anime novo mudaria todos os dias. Por isso todo dia anterior a
// CATALOG_V2_FROM sorteia do catálogo congelado (src/data/animes/catalogo-v1.ts) e só do corte em diante entra o banco todo.
import { ANIMES, type Anime, type Opening } from "@/data/animes";
import { CATALOGO_V1 } from "@/data/animes/catalogo-v1";

/**
 * 1º desafio com o catálogo novo (o banco inteiro, com os animes novos). Tem que ser um dia que ainda não começou
 * quando a mudança for ao ar: o valor final é definido quando o lote for aprovado.
 * ponytail: provisório (26/11/2026 = #201; #203 = 28/11/2026).
 */
/**
 * Primeiro desafio do catálogo novo. PROVISÓRIO: 205 (30/11), porque o #203 (28/11) já começou no ar com o catálogo
 * antigo. O valor final é o dia seguinte ao deploy (o dono vai dizer). scripts/check-live.mjs compara os dias 1 até
 * CATALOG_V2_FROM − 1 com o código no ar (HEAD) e falha se algum mudar.
 */
export const CATALOG_V2_FROM = 205;

/** Lista de onde o dia sorteia, com a popularidade e as aberturas com áudio que valem para ela. */
export type Catalog = {
  /** Todos os animes, na ordem do sorteio (Emoji e Pistas). */
  animes: Anime[];
  /** Os que têm abertura com áudio (Opening). */
  opening: Anime[];
  /** Membros no MAL usados pelo nível do dia. */
  members: (a: Anime) => number;
  /** Aberturas que podem tocar no Opening. */
  openings: (a: Anime) => Opening[];
};
export type Catalogs = { v1: Catalog; v2: Catalog };

const playable = (a: Anime) => a.openings.filter((o) => o.audioSrc);

function fullCatalog(all: Anime[]): Catalog {
  return { animes: all, opening: all.filter((a) => playable(a).length > 0), members: (a) => a.mal?.members ?? 0, openings: playable };
}

/** O catálogo v1 com os objetos do banco atual: mesma ordem, popularidade e aberturas de quando foi congelado. */
function frozenCatalog(all: Anime[]): Catalog {
  const byTitle = new Map(all.map((a) => [a.title, a]));
  const frozen = new Map<Anime, { members: number; openings: Opening[] }>();
  const animes = CATALOGO_V1.map(([title, members, names]) => {
    const a = byTitle.get(title);
    // falha no build e no npm test, em vez de mudar os desafios antigos sem avisar
    if (!a) throw new Error(`catalogo-v1: "${title}" sumiu do banco. Renomeie também em catalogo-v1.ts.`);
    const openings = names.map((n) => {
      const o = a.openings.find((o) => o.name === n && o.audioSrc);
      if (!o) throw new Error(`catalogo-v1: a abertura "${n}" de ${title} sumiu ou ficou sem áudio.`);
      return o;
    });
    frozen.set(a, { members, openings });
    return a;
  });
  return {
    animes,
    opening: animes.filter((a) => frozen.get(a)!.openings.length > 0),
    members: (a) => frozen.get(a)?.members ?? 0,
    openings: (a) => frozen.get(a)?.openings ?? [],
  };
}

/** Os dois catálogos a partir de um banco (o de verdade, ou um de teste em scripts/check-catalog.mjs). */
export function buildCatalogs(all: Anime[]): Catalogs {
  return { v1: frozenCatalog(all), v2: fullCatalog(all) };
}

export const CATALOGS = buildCatalogs(ANIMES);

/** Catálogo de onde o desafio de um dia sorteia. */
export const catalogFor = (day: number, cats: Catalogs = CATALOGS): Catalog => (day < CATALOG_V2_FROM ? cats.v1 : cats.v2);
