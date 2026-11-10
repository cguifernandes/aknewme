// Busca no Apple Music (iTunes Search API, pública e sem chave) a prévia oficial
// de 30s de cada abertura e imprime o trecho para colar em src/data/animes/*.ts.
//
//   npm run openings           → só animes ainda sem `audioSrc`
//   npm run openings -- --all  → todos
//   npm run openings -- --json → saída em JSON (para automatizar)
//
// A correspondência é feita por nome da música + artista, não pelo som:
// ouça cada prévia nova antes de publicar.
import { readdirSync } from "node:fs";

// Lê todos os arquivos de dados (menos o index.ts, que junta os outros).
const DATA = new URL("../src/data/animes/", import.meta.url);
const ALL = [];
for (const f of readdirSync(DATA).filter((f) => f.endsWith(".ts") && f !== "index.ts" && f !== "mal.ts")) {
  for (const list of Object.values(await import(new URL(f, DATA)))) ALL.push(...list);
}

const STORES = ["us", "jp", "br"];
const DELAY_MS = 3200; // a API aceita ~20 buscas por minuto
const BAD = /instrumental|karaoke|off ?vocal|\binst\b|cover|remix|\blive\b|acoustic|piano|orchestra|music ?box|8.?bit|lo-?fi|nightcore|slowed|sped up/i;

const args = new Set(process.argv.slice(2));
const norm = (s) =>
  s.normalize("NFKD").toLowerCase().replace(/[̀-ͯ]/g, "").replace(/^the /, "").replace(/[^a-z0-9]/g, "");
const clean = (s) => s.replace(/\(.*?\)/g, "").replace(/[^\p{L}\p{N}\s'!.-]/gu, "").trim();
const mainArtist = (a) => a.split(/,|&| feat\.? |:/i)[0].trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(term, country) {
  const url = new URL("https://itunes.apple.com/search");
  url.search = new URLSearchParams({ term, country, media: "music", entity: "song", limit: "15" }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes ${res.status}`);
  return (await res.json()).results;
}

function rank(opening, results) {
  const name = norm(clean(opening.name));
  const artist = norm(mainArtist(opening.artist));
  return results
    .filter((r) => r.previewUrl && !BAD.test(`${r.trackName} ${r.collectionName}`))
    .map((r) => {
      const track = norm(r.trackName);
      const nameOk = !!track && (track.includes(name) || name.includes(track));
      const artistOk = norm(r.artistName).includes(artist);
      return { r, nameOk, artistOk, score: Number(nameOk) + Number(artistOk) };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
}

// cada abertura de cada anime (só as sem audioSrc, a não ser com --all)
const todo = ALL.flatMap((anime) => anime.openings.map((opening) => ({ anime, opening }))).filter(
  ({ opening }) => args.has("--all") || !opening.audioSrc,
);
const out = [];
for (const { anime, opening } of todo) {
  let best = null;
  for (const country of STORES) {
    const term = `${clean(opening.name)} ${mainArtist(opening.artist)}`;
    const [top] = rank(opening, await search(term, country));
    await sleep(DELAY_MS);
    if (top && (!best || top.score > best.score)) best = { ...top, country };
    if (best?.score === 2) break;
  }
  const status = !best ? "faltando" : best.score === 2 ? "ok" : "duvidoso";
  const hit = best && {
    track: best.r.trackName,
    artist: best.r.artistName,
    album: best.r.collectionName,
    store: best.country,
    audioSrc: best.r.previewUrl,
    appleMusic: best.r.trackViewUrl.replace(/[?&]uo=\d+/, ""),
  };
  out.push({ title: anime.title, opening: opening.name, status, ...hit });
  if (!args.has("--json")) {
    const icon = { ok: "✔", duvidoso: "?", faltando: "✘" }[status];
    console.log(`${icon} ${anime.title} — "${opening.name}"`);
    if (hit) {
      console.log(`    achado: "${hit.track}" — ${hit.artist} [${hit.album}] (${hit.store})`);
      console.log(`    audioSrc: ${JSON.stringify(hit.audioSrc)},`);
      console.log(`    appleMusic: ${JSON.stringify(hit.appleMusic)},`);
    }
  }
}
if (args.has("--json")) console.log(JSON.stringify(out, null, 2));
