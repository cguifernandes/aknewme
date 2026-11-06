import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // api e painel interno não têm o que indexar
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/plays"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
