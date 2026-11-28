import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

/**
 * Política de conteúdo (specs/login-duelo/03-seguranca.md). Por enquanto em REPORT-ONLY: o navegador só avisa no
 * console o que seria bloqueado, sem bloquear. Depois de o QA confirmar que nada quebra, vira Content-Security-Policy.
 * Origens: Next (scripts inline da hidratação; eval só no dev), Meta Pixel (connect.facebook.net e o pixel em
 * www.facebook.com), Vercel Analytics (va.vercel-scripts.com e vitals.vercel-insights.com), fontes do layout (next/font
 * serve do próprio site; Google Fonts por segurança), capas do AniList (s4.anilist.co) e do MAL, avatares do Google e do
 * Discord, áudio das prévias (audio-ssl.itunes.apple.com) e o login (Google e Discord recebem o formulário do Auth.js).
 */
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://connect.facebook.net https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://s4.anilist.co https://cdn.myanimelist.net https://lh3.googleusercontent.com https://cdn.discordapp.com https://www.facebook.com",
  "media-src 'self' https://audio-ssl.itunes.apple.com",
  `connect-src 'self' https://www.facebook.com https://connect.facebook.net https://va.vercel-scripts.com https://vitals.vercel-insights.com${dev ? " ws:" : ""}`,
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com https://discord.com",
  "frame-ancestors 'none'",
].join("; ");

/** Cabeçalhos de segurança em todas as rotas */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  // frame-ancestors não vale em Report-Only: esta parte já é aplicada de verdade (não quebra nada: ninguém embute o site)
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

const nextConfig: NextConfig = {
  // sem "X-Powered-By: Next.js"
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // URL antiga do Modo Pistas → nova (301: links e buscadores migram sozinhos)
  async redirects() {
    return [
      { source: "/pistas", destination: "/clues", permanent: true },
      // modo treino foi removido: links antigos caem no desafio do dia
      { source: "/:mode(emoji|opening|clues)/:old(treino|practice)", destination: "/:mode", permanent: false },
    ];
  },
};

export default nextConfig;
