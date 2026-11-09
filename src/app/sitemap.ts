import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Desafio novo todo dia → "daily"
  return [
    ...["", "/emoji", "/opening", "/clues", "/higher-lower"].map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "daily" as const,
    })),
    { url: `${SITE_URL}/archive`, changeFrequency: "daily" },
    { url: `${SITE_URL}/support`, changeFrequency: "monthly" },
  ];
}
