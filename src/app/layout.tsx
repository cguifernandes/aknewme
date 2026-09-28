import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, Zen_Kaku_Gothic_New } from "next/font/google";
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

export const metadata: Metadata = {
  title: "aknewme — Jogos de Anime",
  description:
    "Adivinhe o anime pelos emojis, pela opening ou pelas pistas. Novo desafio todo dia à meia-noite.",
};

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
