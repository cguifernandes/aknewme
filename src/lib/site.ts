import type { Metadata } from "next";

export const SITE_NAME = "aknewme";
/** Descrição da home: meta description, manifest e dados estruturados. */
export const SITE_DESCRIPTION =
  "Quiz diário de anime: descubra o anime pelos emojis, por 1 segundo da abertura ou por pistas como ano e estúdio. Novo desafio todo dia à meia-noite.";
/** Conta oficial no X: cabeçalho, fim de jogo, apoio e texto de compartilhar. */
export const X_HANDLE = "aknewmee";
export const X_URL = `https://x.com/${X_HANDLE}`;
/** Abre direto a confirmação de seguir (1 clique), em vez do perfil. */
export const X_FOLLOW_URL = `https://x.com/intent/follow?screen_name=${X_HANDLE}`;
/**
 * Post do X em destaque: quem estiver no site vê um aviso chamando para curtir (src/components/XPostAlert.tsx).
 * Troca-se pelo painel /plays (grava no Redis, vale sem deploy); este link é o reserva, usado se não houver
 * nada gravado. Vazio = sem aviso. Trocar o link faz o aviso reaparecer para quem já tinha fechado.
 */
export const X_POST_URL: string = "https://x.com/aknewmee/status/2118687997180661882";
/** Chave do Redis com o post em destaque escolhido no painel (/plays → /api/xpost). */
export const X_POST_KEY = "xpost";

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
    twitter: { card: "summary_large_image", title: fullTitle, description, site: `@${X_HANDLE}`, creator: `@${X_HANDLE}` },
  };
}
