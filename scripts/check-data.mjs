// Verificação do banco de animes (src/data/animes): nenhuma pista pode entregar a resposta.
// Uso: npm run check:data
//  - sinopse, pistas de emoji e gênero não podem conter palavras do título nem dos apelidos
//  - 4 emojis, 2 pistas, pelo menos 1 abertura
//  - título/apelido não pode valer para dois animes
import { readdirSync } from "node:fs";

const DATA = new URL("../src/data/animes/", import.meta.url);
const ALL = [];
for (const f of readdirSync(DATA).filter((f) => f.endsWith(".ts") && f !== "index.ts" && f !== "mal.ts")) {
  for (const list of Object.values(await import(new URL(f, DATA)))) ALL.push(...list);
}

// mesma normalização de src/lib/game.ts
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
// palavras curtas/genéricas dos títulos que não entregam nada ("no", "the", "of"...)
const SKIP = new Set(["the", "and", "of", "no", "wo", "ni", "on", "to", "in", "la", "is", "de", "da", "do", "dos", "das", "um", "uma", "os", "as", "ga", "wa", "como", "isekai"]);

const errors = [];
const owner = new Map();
for (const a of ALL) {
  const words = new Set([a.title, ...a.aliases].flatMap((k) => norm(k).split(" ")).filter((w) => w.length >= 3 && !SKIP.has(w)));
  const fields = [["sinopse", a.synopsis], ["pista 1", a.emojiClues[0]], ["pista 2", a.emojiClues[1]], ["gênero", a.genre]];
  for (const [label, text] of fields) {
    const hit = norm(text ?? "").split(" ").find((w) => words.has(w));
    if (hit) errors.push(`${a.title}: ${label} entrega "${hit}"`);
  }
  if (a.emojis.length !== 4) errors.push(`${a.title}: precisa de 4 emojis`);
  if (a.emojiClues.length !== 2) errors.push(`${a.title}: precisa de 2 pistas de emoji`);
  if (!a.openings.length) errors.push(`${a.title}: precisa de pelo menos 1 abertura`);
  for (const k of new Set([a.title, ...a.aliases].map(norm))) {
    if (owner.has(k) && owner.get(k) !== a.title) errors.push(`"${k}" vale para ${owner.get(k)} e ${a.title}`);
    owner.set(k, a.title);
  }
}

// nota/membros do MyAnimeList (mal.ts): quem não tem fica fora dessas categorias do Mais ou Menos
const { MAL } = await import(new URL("mal.ts", DATA));
const semMal = ALL.filter((a) => !MAL[a.title]).map((a) => a.title);
if (semMal.length) console.log(`  sem dados do MyAnimeList (rode npm run mal): ${semMal.join(", ")}`);

const semAudio = ALL.filter((a) => !a.openings.some((o) => o.audioSrc)).map((a) => a.title);
console.log(`check-data: ${ALL.length} animes · ${ALL.length - semAudio.length} no Modo Opening`);
if (semAudio.length) console.log(`  sem áudio (fora do Modo Opening): ${semAudio.join(", ")}`);
if (errors.length) {
  console.error(errors.map((e) => `  ✘ ${e}`).join("\n"));
  process.exit(1);
}
console.log("check-data: ok");
