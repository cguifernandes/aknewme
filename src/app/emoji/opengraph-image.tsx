import { ImageResponse } from "next/og";
import { dailyNumber, todayEmojis } from "@/lib/game";
import { appleEmojiUrl, OG, OG_SIZE, ogFonts } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

// Prévia do /emoji com os 4 emojis da 1ª rodada de HOJE (sem resposta): quem vê o
// post já vê o enigma. Gerada a cada pedido, porque muda todo dia.
export const dynamic = "force-dynamic";
export const alt = "aknewme — adivinhe o anime do dia pelos emojis";
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
          alignItems: "center",
          justifyContent: "center",
          background: OG.grape,
          color: OG.white,
          fontFamily: "Figtree",
        }}
      >
        <div style={{ display: "flex", fontFamily: "Bricolage Grotesque", fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>
          aknewme<span style={{ color: OG.lime }}>.</span>
          <span style={{ color: OG.lavender, marginLeft: 24, fontWeight: 400 }}>#{dailyNumber()}</span>
        </div>
        {/* PNGs Apple do site (64px, ampliados): mesma cara dos emojis do jogo */}
        <div style={{ display: "flex", gap: 48, marginTop: 40 }}>
          {todayEmojis().map((e, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={appleEmojiUrl(SITE_URL, e)} width={128} height={128} alt="" />
          ))}
        </div>
        <div
          style={{ marginTop: 48, background: OG.lime, color: OG.ink, fontSize: 36, fontWeight: 700, padding: "14px 40px", borderRadius: 999 }}
        >
          Que anime é esse?
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
