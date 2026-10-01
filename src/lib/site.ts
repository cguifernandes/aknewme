import type { Metadata } from "next";

export const SITE_NAME = "aknewme";

// Na Vercel (produção e previews) o canônico sempre aponta para o domínio oficial.
// Fixo de propósito: VERCEL_PROJECT_PRODUCTION_URL pegaria "aknewme.com", que redireciona para o www.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL ? "https://www.aknewme.com" : "http://localhost:3000");

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
