// Copia para public/emoji/ as imagens Apple dos emojis usados em src/.
// Roda sozinho antes de `npm run dev` e `npm run build` (predev/prebuild).
// Nome do arquivo = codepoints em hex sem o seletor FE0F (ex.: 🏴‍☠️ → 1f3f4-200d-2620.png),
// o mesmo cálculo feito em src/components/Emoji.tsx.
import { copyFileSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";

const PKG = "node_modules/emoji-datasource-apple";
const OUT = "public/emoji";

const key = (unified) =>
  unified.toLowerCase().split("-").filter((h) => h !== "fe0f").join("-");
const keyOf = (emoji) => key([...emoji].map((c) => c.codePointAt(0).toString(16)).join("-"));

// emoji → arquivo de imagem Apple disponível no pacote
const images = new Map();
for (const e of JSON.parse(readFileSync(join(PKG, "emoji.json"), "utf8"))) {
  if (e.has_img_apple) images.set(key(e.unified), e.image);
}

function* sourceFiles(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) yield* sourceFiles(p);
    else if ([".ts", ".tsx"].includes(extname(f.name))) yield p;
  }
}

const seg = new Intl.Segmenter("pt-BR", { granularity: "grapheme" });
const used = new Set();
for (const file of sourceFiles("src")) {
  for (const { segment } of seg.segment(readFileSync(file, "utf8"))) {
    if (/\p{Extended_Pictographic}/u.test(segment)) used.add(segment);
  }
}

mkdirSync(OUT, { recursive: true });
let copied = 0;
for (const emoji of used) {
  const img = images.get(keyOf(emoji));
  if (!img) continue; // símbolo sem versão Apple (ex.: ★) — fica com o glifo nativo
  copyFileSync(join(PKG, "img/apple/64", img), join(OUT, `${keyOf(emoji)}.png`));
  copied++;
}
console.log(`emoji: ${copied} imagens Apple em ${OUT}/`);
