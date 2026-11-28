// Busca no AniList (anilist.co, API GraphQL gratuita) quantas pessoas favoritaram cada anime e grava
// src/data/animes/anilist.ts — base da pergunta "Qual tem mais favoritos no AniList?" do Mais ou Menos
// (specs/mais-ou-menos/01-ficha-favoritos-temas.md, seção 3).
//
//   npm run anilist   → atualiza todos (acha cada anime pelo id do MAL gravado em mal.ts; rode `npm run mal` antes
//                       para anime novo)
//
// O AniList limita os pedidos por minuto (429): cada lote espera o tempo que ele pede e tenta de novo. Se um lote falhar de vez, ficam os
// números que já estavam gravados. No fim, imprime a cobertura: a pergunta só liga com 90% do banco (higherLower.ts).
import { existsSync, writeFileSync } from "node:fs";

const DATA = new URL("../src/data/animes/", import.meta.url);
const OUT = new URL("anilist.ts", DATA);
const { MAL } = await import(new URL("mal.ts", DATA));
const known = existsSync(OUT) ? (await import(OUT)).ANILIST_FAVOURITES : {};
const BATCH = 20;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** id do MAL → favoritos, para um lote de ids (apelidos na consulta: um id desconhecido derruba só o campo dele). */
async function favourites(ids) {
  const query = `{${ids.map((id) => `m${id}: Media(idMal: ${id}, type: ANIME) { favourites }`).join(" ")}}`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    await sleep(2500 * attempt);
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null))?.data;
    // com um id desconhecido o AniList responde 404, mas manda os outros campos em `data`
    if (data && Object.values(data).some(Boolean)) return data;
    // 429 = limite de pedidos por minuto: espera o tempo que o AniList pede (Retry-After) antes de tentar de novo
    const wait = Number(res?.headers.get("retry-after")) || 0;
    console.log(`  AniList ${res?.status ?? "sem rede"} no lote de ${ids[0]}, tentativa ${attempt}${wait ? ` (espera ${wait}s)` : ""}`);
    if (wait) await sleep((wait + 1) * 1000);
  }
  return null;
}

const titles = Object.keys(MAL);
const got = {};
let failed = 0;
for (let i = 0; i < titles.length; i += BATCH) {
  const slice = titles.slice(i, i + BATCH);
  const data = await favourites(slice.map((t) => MAL[t][0]));
  if (!data) failed += slice.length;
  for (const t of slice) {
    const n = data?.[`m${MAL[t][0]}`]?.favourites;
    if (Number.isInteger(n) && n > 0) got[t] = n;
    else if (known[t]) got[t] = known[t]; // mantém o que já estava gravado
  }
  console.log(`  ${Math.min(i + BATCH, titles.length)}/${titles.length}`);
}

const missing = titles.filter((t) => !got[t]);
writeFileSync(
  OUT,
  `// GERADO por \`npm run anilist\` (scripts/fetch-anilist.mjs) — não edite à mão.
// Favoritos de cada anime no AniList (anilist.co), para a pergunta "Qual tem mais favoritos no AniList?" do Mais ou
// Menos. Anime sem número fica fora só dessa pergunta.

/** Dia em que os números foram lidos do AniList. */
export const ANILIST_UPDATED = "${new Date().toLocaleDateString("sv")}";

/** título do anime → pessoas que favoritaram no AniList */
export const ANILIST_FAVOURITES: Record<string, number> = {
${titles.filter((t) => got[t]).map((t) => `  ${JSON.stringify(t)}: ${got[t]},`).join("\n")}
};
`,
);
const pct = Math.round((100 * (titles.length - missing.length)) / titles.length);
console.log(`\nanilist.ts: ${titles.length - missing.length} de ${titles.length} animes (${pct}%)${missing.length ? ` · sem número: ${missing.join(", ")}` : ""}${failed ? ` · ${failed} em lotes que falharam (ficou o número antigo, se havia)` : ""}`);
