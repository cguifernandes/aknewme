import type { Metadata } from "next";

export const SITE_NAME = "aknewme";

// Na Vercel o domínio de produção vem sozinho (VERCEL_PROJECT_PRODUCTION_URL,
// também nos previews — assim o canônico sempre aponta para produção).
// Com domínio próprio, defina NEXT_PUBLIC_SITE_URL=https://seudominio.com.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/** Título, descrição, canônico e prévias (Open Graph/Twitter) de uma página. */
export function pageMetadata(title: string, description: string, path: string): Metadata {
  const isHome = path === "/";
  const fullTitle = isHome ? title : `${title} | ${SITE_NAME}`;
  return {
    title: isHome ? { default: title, template: `%s | ${SITE_NAME}` } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: path, siteName: SITE_NAME, locale: "pt_BR", type: "website" },
    twitter: { card: "summary_large_image", title: fullTitle, description },
  };
}
