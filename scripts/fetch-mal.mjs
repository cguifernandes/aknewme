// Busca no MyAnimeList (myanimelist.net) a nota, o nº de membros e a capa de cada anime e grava
// src/data/animes/mal.ts — base do Mais ou Menos (categorias "nota" e "popularidade" e a imagem das cartas).
// A capa não é baixada: fica só o link para o servidor de imagens do MAL, conferido aqui (precisa responder).
// Anime sem capa fica fora do Mais ou Menos.
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

/** A imagem responde? (capa que saiu do ar não entra) */
async function imageOk(url) {
  await sleep(150);
  const res = await fetch(url, { method: "HEAD", headers: HEADERS }).catch(() => null);
  return !!res?.ok && (res.headers.get("content-type") ?? "").startsWith("image/");
}

/** Nota, membros, capa e nome da página do anime no MAL. */
async function page(id) {
  const html = await (await get(`https://myanimelist.net/anime/${id}`)).text();
  const score = Number(html.match(/score-label score-[^"]*">([\d.]+)/)?.[1]);
  const members = Number(html.match(/Members <strong>([\d,]+)/)?.[1].replaceAll(",", ""));
  const name = html.match(/property="og:title" content="([^"]+)/)?.[1] ?? "?";
  // og:image é a capa pequena (225px); com "l" antes da extensão vem a grande (~425px), melhor para a carta
  const small = html.match(/property="og:image" content="(https:\/\/cdn\.myanimelist\.net\/images\/anime\/[^"]+)/)?.[1];
  const large = small?.replace(/(\.\w+)$/, "l$1");
  const image = small && ((await imageOk(large)) ? large : (await imageOk(small)) ? small : null);
  return { score, members, name, image: image || null };
}

const lines = [];
const missing = [];
const noImage = [];
for (const anime of ALL) {
  try {
    const found = known[anime.title] ? { id: known[anime.title][0], approx: false } : await findId(anime);
    if (!found) throw new Error("não achei");
    const { score, members, name, image } = await page(found.id);
    if (!(score > 0) || !(members > 0)) throw new Error(`sem nota/membros em /anime/${found.id}`);
    lines.push(`  ${JSON.stringify(anime.title)}: [${found.id}, ${score}, ${members}${image ? `, ${JSON.stringify(image)}` : ""}],`);
    if (!image) noImage.push(anime.title);
    console.log(`${found.approx ? "≈" : "✔"} ${anime.title} (${anime.year}) → ${name} · ${score} · ${members} · ${image ? "capa ok" : "SEM CAPA"}`);
  } catch (e) {
    missing.push(anime.title);
    // mantém o que já estava gravado, se houver
    if (known[anime.title]) lines.push(`  ${JSON.stringify(anime.title)}: ${JSON.stringify(known[anime.title])},`);
    console.log(`✘ ${anime.title} (${anime.year}): ${e.message}`);
  }
}

writeFileSync(
  OUT,
  `// GERADO por \`npm run mal\` (scripts/fetch-mal.mjs) — não edite à mão, só para corrigir um id.
// Fonte: MyAnimeList (myanimelist.net). Base do Mais ou Menos: nota, popularidade e a capa das cartas.

/** Dia em que os números foram lidos do MyAnimeList. */
export const MAL_UPDATED = "${new Date().toLocaleDateString("sv")}";

/** título do anime → [id no MAL, nota (0 a 10), membros, link da capa (sem ela o anime fica fora do Mais ou Menos)] */
export const MAL: Record<string, [id: number, score: number, members: number, image?: string]> = {
${lines.join("\n")}
};
`,
);
console.log(`\nmal.ts: ${lines.length} de ${ALL.length} animes${missing.length ? ` · faltando: ${missing.join(", ")}` : ""}${noImage.length ? ` · sem capa: ${noImage.join(", ")}` : ""}`);
