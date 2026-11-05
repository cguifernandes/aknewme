// Gera os banners de anúncio em marketing/ads/ (print do molde marketing/ad.html no Chrome headless).
// Uso: npm run ads                      → Death Note, One Piece e o criativo do Modo Opening
//      npm run ads -- "Naruto" "Bleach" → criativos de emoji desses animes (emojis vêm de src/data/animes)
// Chrome em outro lugar? defina CHROME=caminho/do/chrome.exe
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SIZES = { feed: [1080, 1080], story: [1080, 1920], link: [1200, 628] };

const DATA = new URL("../src/data/animes/", import.meta.url);
const ALL = [];
for (const f of readdirSync(DATA).filter((f) => f.endsWith(".ts") && f !== "index.ts")) {
  for (const list of Object.values(await import(new URL(f, DATA)))) ALL.push(...list);
}

const titles = process.argv.slice(2);
const ads = (titles.length ? titles : ["Death Note", "One Piece"]).map((title) => {
  const anime = ALL.find((a) => a.title.toLowerCase() === title.toLowerCase());
  if (!anime) throw new Error(`anime não encontrado em src/data/animes: ${title}`);
  return { name: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), kind: "emoji", emojis: anime.emojis };
});
if (!titles.length) ads.push({ name: "opening", kind: "opening" });

const out = fileURLToPath(new URL("../marketing/ads/", import.meta.url));
mkdirSync(out, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), "aknewme-ads-")); // não briga com o Chrome aberto
const page = new URL("../marketing/ad.html", import.meta.url).href;

for (const { name, ...ad } of ads) {
  for (const [format, [w, h]] of Object.entries(SIZES)) {
    const file = join(out, `${name}-${format}-${w}x${h}.png`);
    const r = spawnSync(CHROME, [
      "--headless",
      `--user-data-dir=${profile}`,
      `--screenshot=${file}`,
      `--window-size=${w},${h}`,
      "--force-device-scale-factor=1",
      "--hide-scrollbars",
      "--virtual-time-budget=10000", // espera as fontes do Google carregarem
      `${page}#${encodeURIComponent(JSON.stringify(ad))}`,
    ]);
    if (r.status !== 0) throw new Error(`Chrome falhou em ${file}: ${r.stderr}`);
    console.log(file);
  }
}
