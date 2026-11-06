import { ImageResponse } from "next/og";
import { OG, ogFonts } from "@/lib/og";

// Ícone da tela inicial do iPhone (o iOS não aceita o icon.svg): mesmo "a." do favicon.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: OG.grape,
          color: OG.white,
          fontFamily: "Bricolage Grotesque",
          fontSize: 120,
          fontWeight: 800,
        }}
      >
        a<span style={{ color: OG.lime }}>.</span>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
