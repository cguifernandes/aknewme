// Busca no MyAnimeList (myanimelist.net) a nota e o nº de membros de cada anime, mais a imagem da carta,
// e grava src/data/animes/mal.ts — base do Mais ou Menos.
// Imagem, por ordem de preferência: banner do AniList (deitado e em alta, feito para faixas), capa grande do
// AniList, capa do MAL (pequena, ~425px). Não é baixada: fica só o link, conferido aqui (precisa responder).
// Anime sem imagem fica fora do Mais ou Menos.
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
const HEADERS = { "User-Agent": "Mozilla/5.0 (aknewme)" };

/** Imagem escolhida à mão (título → link) para quando o banner do AniList não mostra o anime. Vale antes de todas. */
const IMAGE_OVERRIDE = {
  // o banner é só uma cidade em neon, sem personagem: fica a capa
  "Mob Psycho 100": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21507-6YUSbh2m0N1p.jpg",
  // arte da 2ª temporada, mais bonita que a da 1ª
  "Tokyo Ghoul": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/20850-YjtRXQkNl0xz.jpg",
  "Blue Lock": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/163146-HIz04v1Or7He.jpg",
  "Noragami": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21128-CulsnPASGUoe.jpg",
  // o banner da 1ª temporada é só o logo por cima das pernas dos personagens
  "Tokyo Revengers": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/142853-AOOaCQdUHScH.jpg",
};

/** Capa em retrato escolhida à mão (título → link). Vale antes da capa do AniList. */
const COVER_OVERRIDE = {
  "Tokyo Ghoul": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20850-glDf9EMKeCwe.jpg",
  "Blue Lock": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163146-BVZPgyzkqi82.png",
  "Noragami": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21128-eQgH3TG4nngo.jpg",
  "Tokyo Revengers": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142853-nxEZDE9oDRLG.png",
};

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

/** Banner e capa grande no AniList, pelos ids do MAL (vários por pedido, com apelidos na consulta GraphQL). */
async function anilistImages(ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 25) {
    const query = `{${ids.slice(i, i + 25).map((id) => `m${id}: Media(idMal: ${id}, type: ANIME) { bannerImage coverImage { extraLarge } }`).join(" ")}}`;
    await sleep(2500);
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query }),
    }).catch(() => null);
    // um id que o AniList não conhece derruba só o campo dele (vem null em data), não o lote
    const data = (await res?.json().catch(() => null))?.data ?? {};
    for (const [key, media] of Object.entries(data)) if (media) out[key.slice(1)] = [media.bannerImage, media.coverImage?.extraLarge];
  }
  return out;
}

const rows = [];
const missing = [];
for (const anime of ALL) {
  try {
    const found = known[anime.title] ? { id: known[anime.title][0], approx: false } : await findId(anime);
    if (!found) throw new Error("não achei");
    const { score, members, name, image } = await page(found.id);
    if (!(score > 0) || !(members > 0)) throw new Error(`sem nota/membros em /anime/${found.id}`);
    rows.push({ title: anime.title, id: found.id, score, members, image });
    console.log(`${found.approx ? "≈" : "✔"} ${anime.title} (${anime.year}) → ${name} · ${score} · ${members}`);
  } catch (e) {
    missing.push(anime.title);
    // mantém o que já estava gravado, se houver
    if (known[anime.title]) {
      const [id, score, members, image] = known[anime.title];
      rows.push({ title: anime.title, id, score, members, image });
    }
    console.log(`✘ ${anime.title} (${anime.year}): ${e.message}`);
  }
}

// imagem de cada um: a melhor que responder
const anilist = await anilistImages(rows.map((r) => r.id));
const lines = [];
const noImage = [];
const kinds = { "escolhida à mão": 0, banner: 0, "capa AniList": 0, "capa MAL": 0 };
for (const r of rows) {
  const [banner, cover] = anilist[r.id] ?? [];
  const options = [["escolhida à mão", IMAGE_OVERRIDE[r.title]], ["banner", banner], ["capa AniList", cover], ["capa MAL", r.image]];
  let image = null;
  for (const [kind, url] of options) {
    if (url && (await imageOk(url))) {
      image = url;
      kinds[kind]++;
      if (kind !== "banner") console.log(`  ${r.title}: sem banner, usando ${kind}`);
      break;
    }
  }
  if (!image) noImage.push(r.title);
  // capa em retrato (miniaturas e o miolo do disco do Opening): AniList, senão a do MAL
  let portrait = null;
  for (const url of [COVER_OVERRIDE[r.title], cover, r.image]) {
    if (url && (url === image || (await imageOk(url)))) {
      portrait = url;
      break;
    }
  }
  const images = image ? `, ${JSON.stringify(image)}${portrait ? `, ${JSON.stringify(portrait)}` : ""}` : "";
  lines.push(`  ${JSON.stringify(r.title)}: [${r.id}, ${r.score}, ${r.members}${images}],`);
}
console.log(`imagens: ${JSON.stringify(kinds)}`);

writeFileSync(
  OUT,
  `// GERADO por \`npm run mal\` (scripts/fetch-mal.mjs) — não edite à mão, só para corrigir um id.
// Base do Mais ou Menos. Nota e membros: MyAnimeList (myanimelist.net). Imagem da carta: banner ou capa do
// AniList (anilist.co); sem eles, a capa do MAL.

/** Dia em que os números foram lidos do MyAnimeList. */
export const MAL_UPDATED = "${new Date().toLocaleDateString("sv")}";

/**
 * título do anime → [id no MAL, nota (0 a 10), membros, imagem deitada (banner; sem ela o anime fica fora do
 * Mais ou Menos), capa em retrato]
 */
export const MAL: Record<string, [id: number, score: number, members: number, image?: string, cover?: string]> = {
${lines.join("\n")}
};
`,
);
console.log(`\nmal.ts: ${lines.length} de ${ALL.length} animes${missing.length ? ` · faltando: ${missing.join(", ")}` : ""}${noImage.length ? ` · sem imagem: ${noImage.join(", ")}` : ""}`);
