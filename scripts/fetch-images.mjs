// Baixa as imagens dos animes (links em src/data/animes/mal.ts), converte para WebP nos tamanhos que o site usa
// e grava em public/animes/ — que NÃO entra no Git (as artes são dos estúdios; o repositório guarda só os links).
// Roda sozinho antes de `npm run dev` e `npm run build` (predev/prebuild). O site (src/components/AnimeImage.tsx)
// serve esses arquivos direto, sem depender do AniList no ar nem de otimizador de imagem.
//
// Só baixa o que falta: cada imagem pronta também fica em .next/cache/anime-images/, pasta que a Vercel
// guarda entre um build e outro. Build seguinte = só cópia; download de novo só para anime novo ou link trocado.
//
// Se um download falhar, o build continua: o site cai no link original daquela imagem (AnimeImage).
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const OUT = "public/animes";
const CACHE = ".next/cache/anime-images";
/** Larguras de cada tipo — as mesmas de AnimeImage.tsx (WIDTHS). */
const WIDTHS = { wide: [384, 828, 1200], cover: [128, 256] };
const QUALITY = 80;
const PARALLEL = 6;

// mal.ts é gerado, uma linha por anime: "Título": [id, nota, membros, "banner", "capa"],
const jobs = [];
for (const line of readFileSync("src/data/animes/mal.ts", "utf8").split("\n")) {
  const m = line.match(/^\s*"(?:[^"\\]|\\.)*":\s*(\[.*\]),\s*$/);
  if (!m) continue;
  const [id, , , wide, cover] = JSON.parse(m[1]);
  if (wide) jobs.push({ key: `${id}-wide`, url: wide, widths: WIDTHS.wide });
  if (cover) jobs.push({ key: `${id}-cover`, url: cover, widths: WIDTHS.cover });
}

mkdirSync(OUT, { recursive: true });
mkdirSync(CACHE, { recursive: true });
/** De qual link veio cada imagem pronta: link trocado no mal.ts = baixa de novo. */
const manifestOf = (dir) => {
  try {
    return JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  } catch {
    return {};
  }
};
const made = { [OUT]: manifestOf(OUT), [CACHE]: manifestOf(CACHE) };
const files = (job) => job.widths.map((w) => `${job.key}-${w}.webp`);
const ready = (dir, job) => made[dir][job.key] === job.url && files(job).every((f) => existsSync(join(dir, f)));

let copied = 0;
let downloaded = 0;
const failed = [];

async function run(job) {
  if (ready(OUT, job)) return;
  if (ready(CACHE, job)) {
    for (const f of files(job)) copyFileSync(join(CACHE, f), join(OUT, f));
    made[OUT][job.key] = job.url;
    copied++;
    return;
  }
  try {
    const res = await fetch(job.url, { headers: { "User-Agent": "Mozilla/5.0 (aknewme)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const original = Buffer.from(await res.arrayBuffer());
    for (const w of job.widths) {
      // withoutEnlargement: capa de 460px não é esticada para caber num tamanho maior
      const webp = await sharp(original).resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
      for (const dir of [CACHE, OUT]) writeFileSync(join(dir, `${job.key}-${w}.webp`), webp);
    }
    made[OUT][job.key] = made[CACHE][job.key] = job.url;
    downloaded++;
  } catch (e) {
    failed.push(`${job.key} (${e.message})`);
  }
}

// alguns downloads por vez, para não pesar no servidor de imagens
const queue = [...jobs];
await Promise.all(
  Array.from({ length: PARALLEL }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) await run(job);
  }),
);
for (const dir of [OUT, CACHE]) writeFileSync(join(dir, "manifest.json"), JSON.stringify(made[dir]));

if (downloaded || copied || failed.length) {
  console.log(`fetch-images: ${jobs.length} imagens · ${downloaded} baixadas · ${copied} copiadas do cache${failed.length ? ` · ${failed.length} falharam` : ""}`);
}
if (failed.length) console.warn(`  sem arquivo local (o site usa o link original): ${failed.join(", ")}`);
