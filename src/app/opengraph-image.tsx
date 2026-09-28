import { ImageResponse } from "next/og";

// Prévia ao compartilhar o link (WhatsApp, Twitter, Discord...). Gerada no build;
// vale para todas as páginas. Cores = tokens da marca (ImageResponse não lê CSS).
export const alt = "aknewme — quiz diário de anime";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// As fontes do site (next/font) não chegam ao gerador: baixa o TTF do Google Fonts.
async function googleFont(family: string, weight: number) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`)).text();
  const url = /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
  if (!url) throw new Error(`fonte não encontrada: ${family}`);
  return { name: family, data: await (await fetch(url)).arrayBuffer(), weight: weight as 400 | 700 | 800 };
}

export default async function OpengraphImage() {
  // Sem rede no build, gera com a fonte padrão em vez de quebrar o deploy.
  const fonts = await Promise.all([
    googleFont("Bricolage Grotesque", 800),
    googleFont("Figtree", 400),
    googleFont("Figtree", 700),
  ]).catch(() => undefined);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#4b2bd6",
          color: "#ffffff",
          fontFamily: "Figtree",
        }}
      >
        <div style={{ display: "flex", fontFamily: "Bricolage Grotesque", fontSize: 128, fontWeight: 800, letterSpacing: -5 }}>
          aknewme<span style={{ color: "#c9f560" }}>.</span>
        </div>
        <div style={{ fontSize: 48, marginTop: 16, color: "#d9cffc" }}>
          Adivinhe o anime pelos emojis, pela abertura e pelas pistas.
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 48 }}>
          {["Emoji", "Opening", "Pistas"].map((mode) => (
            <div
              key={mode}
              style={{
                background: "#c9f560",
                color: "#1d0d66",
                fontSize: 34,
                fontWeight: 700,
                padding: "12px 32px",
                borderRadius: 999,
              }}
            >
              {mode}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
