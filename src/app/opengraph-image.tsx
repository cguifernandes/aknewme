import { ImageResponse } from "next/og";
import { OG, OG_SIZE, ogFonts } from "@/lib/og";

// Prévia ao compartilhar o link (WhatsApp, Twitter, Discord...). Gerada no build;
// vale para todas as páginas (o modo Emoji tem a sua, com os emojis do dia).
export const alt = "aknewme — quiz diário de anime";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpengraphImage() {
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
          background: OG.grape,
          color: OG.white,
          fontFamily: "Figtree",
        }}
      >
        <div style={{ display: "flex", fontFamily: "Bricolage Grotesque", fontSize: 128, fontWeight: 800, letterSpacing: -5 }}>
          aknewme<span style={{ color: OG.lime }}>.</span>
        </div>
        <div style={{ fontSize: 48, marginTop: 16, color: OG.lavender }}>
          Adivinhe o anime pelos emojis, pela abertura e pelas pistas.
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 48 }}>
          {["Emoji", "Opening", "Pistas"].map((mode) => (
            <div
              key={mode}
              style={{
                background: OG.lime,
                color: OG.ink,
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
    { ...size, fonts: await ogFonts() },
  );
}
