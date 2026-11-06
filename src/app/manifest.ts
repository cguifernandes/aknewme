import type { MetadataRoute } from "next";
import { OG } from "@/lib/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// Web app manifest: "Adicionar à tela inicial" abre o jogo em tela cheia, com nome e cor da marca.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Quiz diário de anime`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "pt-BR",
    start_url: "/?utm_source=pwa",
    display: "standalone",
    background_color: OG.white,
    theme_color: OG.grape,
    categories: ["games", "entertainment"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
