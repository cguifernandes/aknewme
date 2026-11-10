// Busca no MyAnimeList (myanimelist.net) a nota e o nº de membros de cada anime e grava
// src/data/animes/mal.ts — base das categorias "nota" e "popularidade" do Mais ou Menos.
//
//   npm run mal   → atualiza todos (animes já gravados: pelo id; novos: busca por título)
//
// Um anime novo é achado por título/apelido + ano de estreia (a entrada do MAL que estreou no
// mesmo ano, de preferência série de TV). Confira a lista impressa: "≈" = ano não bateu exato,
// "✘" = não achou (o anime fica fora dessas duas categorias; dá para pôr o id à mão no mal.ts).
import { existsSync, readdirSync, writeFileSync } from "node:fs";

const DATA = new URL("../src/data/animes/", import.meta.url);
const OUT = new URL("mal.ts", DATA);
const SKIP = ["index.ts", "mal.ts"];
const DELAY_MS = 1300; // educado com o site: menos de 1 pedido por segundo
const HEADERS = { "User-Agent": "Mozilla/5.0 (aknewme; atualização de notas)" };

const ALL = [];
for (const f of readdirSync(DATA).filter((f) => f.endsWith(".ts") && !SKIP.includes(f))) {
  for (const list of Object.values(await import(new URL(f, DATA)))) ALL.push(...list);
}
const known = existsSync(OUT) ? (await import(OUT)).MAL : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let attempt = 1; ; attempt++) {
    await sleep(DELAY_MS * attempt);
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) return res;
    if (attempt === 3) throw new Error(`MAL ${res.status} em ${url}`);
  }
}

/** id da entrada que estreou no ano do anime (ou ±1, marcado como aproximado). */
async function findId(anime) {
  let near = null;
  for (const key of [anime.title, ...anime.aliases]) {
    const url = `https://myanimelist.net/search/prefix.json?type=anime&v=1&keyword=${encodeURIComponent(key)}`;
    const items = (await (await get(url)).json()).categories?.[0]?.items ?? [];
    const tvFirst = [...items].sort((a, b) => (b.payload.media_type === "TV") - (a.payload.media_type === "TV"));
    const exact = tvFirst.find((i) => i.payload.start_year === anime.year);
    if (exact) return { id: exact.id, approx: false };
    near ??= tvFirst.find((i) => Math.abs(i.payload.start_year - anime.year) === 1);
  }
  return near ? { id: near.id, approx: true } : null;
}

/** Nota, membros e nome da página do anime no MAL. */
async function page(id) {
  const html = await (await get(`https://myanimelist.net/anime/${id}`)).text();
  const score = Number(html.match(/score-label score-[^"]*">([\d.]+)/)?.[1]);
  const members = Number(html.match(/Members <strong>([\d,]+)/)?.[1].replaceAll(",", ""));
  const name = html.match(/property="og:title" content="([^"]+)/)?.[1] ?? "?";
  return { score, members, name };
}

const lines = [];
const missing = [];
for (const anime of ALL) {
  try {
    const found = known[anime.title] ? { id: known[anime.title][0], approx: false } : await findId(anime);
    if (!found) throw new Error("não achei");
    const { score, members, name } = await page(found.id);
    if (!(score > 0) || !(members > 0)) throw new Error(`sem nota/membros em /anime/${found.id}`);
    lines.push(`  ${JSON.stringify(anime.title)}: [${found.id}, ${score}, ${members}],`);
    console.log(`${found.approx ? "≈" : "✔"} ${anime.title} (${anime.year}) → ${name} · ${score} · ${members}`);
  } catch (e) {
    missing.push(anime.title);
    // mantém o que já estava gravado, se houver
    if (known[anime.title]) lines.push(`  ${JSON.stringify(anime.title)}: [${known[anime.title].join(", ")}],`);
    console.log(`✘ ${anime.title} (${anime.year}): ${e.message}`);
  }
}

writeFileSync(
  OUT,
  `// GERADO por \`npm run mal\` (scripts/fetch-mal.mjs) — não edite à mão, só para corrigir um id.
// Fonte: MyAnimeList (myanimelist.net). Base das categorias "nota" e "popularidade" do Mais ou Menos.

/** Dia em que os números foram lidos do MyAnimeList. */
export const MAL_UPDATED = "${new Date().toLocaleDateString("sv")}";

/** título do anime → [id no MAL, nota (0 a 10), membros] */
export const MAL: Record<string, [id: number, score: number, members: number]> = {
${lines.join("\n")}
};
`,
);
console.log(`\nmal.ts: ${lines.length} de ${ALL.length} animes${missing.length ? ` · faltando: ${missing.join(", ")}` : ""}`);
