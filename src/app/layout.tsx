import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, Zen_Kaku_Gothic_New } from "next/font/google";
import { pageMetadata, SITE_NAME, SITE_URL } from "@/lib/site";
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
    "Quiz diário de anime: descubra o anime pelos emojis, por 1 segundo da abertura ou por pistas como ano e estúdio. Novo desafio todo dia à meia-noite.",
    "/",
  ),
};

// Cor da barra do navegador no celular (roxo da marca).
export const viewport: Viewport = { themeColor: "#4b2bd6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // As variáveis de fonte ficam no <html> (= :root), onde o @theme do Tailwind as resolve.
    <html lang="pt-BR" className={`${bricolage.variable} ${figtree.variable} ${zenKaku.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
