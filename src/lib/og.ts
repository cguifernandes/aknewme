// Compartilhado pelas imagens Open Graph (app/opengraph-image e emoji/opengraph-image).
// ImageResponse não lê CSS: cores = tokens da marca copiados de globals.css.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG = { grape: "#4b2bd6", lime: "#c9f560", lavender: "#d9cffc", ink: "#1d0d66", white: "#ffffff" };

/** URL do PNG Apple de um emoji (os mesmos que o site mostra; ver scripts/copy-emoji.mjs). */
export function appleEmojiUrl(base: string, e: string): string {
  const key = [...e].map((c) => c.codePointAt(0)!.toString(16)).filter((h) => h !== "fe0f").join("-");
  return `${base}/emoji/${key}.png`;
}

// As fontes do site (next/font) não chegam ao gerador: baixa o TTF do Google Fonts.
async function googleFont(family: string, weight: number) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`)).text();
  const url = /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
  if (!url) throw new Error(`fonte não encontrada: ${family}`);
  return { name: family, data: await (await fetch(url)).arrayBuffer(), weight: weight as 400 | 700 | 800 };
}

/** Fontes da marca; sem rede, undefined (gera com a fonte padrão em vez de quebrar). */
export function ogFonts() {
  return Promise.all([googleFont("Bricolage Grotesque", 800), googleFont("Figtree", 400), googleFont("Figtree", 700)]).catch(
    () => undefined,
  );
}
