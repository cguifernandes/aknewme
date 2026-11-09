import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, Zen_Kaku_Gothic_New } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { pageMetadata, SITE_DESCRIPTION, SITE_NAME, SITE_URL, X_URL } from "@/lib/site";
import VisitBeacon from "@/components/VisitBeacon";
import MetaPixel from "@/components/MetaPixel";
import XPostAlert from "@/components/XPostAlert";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";

// Display: sempre 800. Arquivo variável com eixo opsz para os títulos grandes
// ganharem o desenho condensado do design (optical sizing automático).
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
});

// Só o "アニメ" decorativo da home; sem preload (fonte japonesa fatiada por unicode-range).
const zenKaku = Zen_Kaku_Gothic_New({
  weight: "900",
  preload: false,
  variable: "--font-zen-kaku",
});

// Metadados da home (e base herdada pelas páginas de jogo, que sobrescrevem o que muda).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  ...pageMetadata(
    "aknewme — Quiz diário de anime: emojis, openings e pistas",
    SITE_DESCRIPTION,
    "/",
  ),
  category: "games",
  // Deixa o Google usar a prévia grande (imagem OG) e o trecho inteiro nos resultados e no Discover
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
};

// Dados estruturados: nome do site nos resultados, a conta do X ligada à marca e o jogo como app gratuito.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#site`,
      name: SITE_NAME,
      alternateName: "aknewme.com",
      url: `${SITE_URL}/`,
      inLanguage: "pt-BR",
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/apple-icon`,
      sameAs: [X_URL],
    },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      applicationCategory: "GameApplication",
      genre: "Quiz de anime",
      operatingSystem: "Any",
      inLanguage: "pt-BR",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    },
  ],
};

// Cor da barra do navegador no celular (roxo da marca).
export const viewport: Viewport = { themeColor: "#4b2bd6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // As variáveis de fonte ficam no <html> (= :root), onde o @theme do Tailwind as resolve.
    <html lang="pt-BR" className={`${bricolage.variable} ${figtree.variable} ${zenKaku.variable}`}>
      <body className="min-h-screen antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        {children}
        <XPostAlert />
        <VisitBeacon />
        <MetaPixel />
        <Analytics />
      </body>
    </html>
  );
}
