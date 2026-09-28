import Watermark from "@/components/Watermark";
import { pageMetadata } from "@/lib/site";

// A página é client component; o SEO da rota fica aqui.
export const metadata = pageMetadata(
  "Adivinhe o anime pelos emojis",
  "Quatro emojis, um anime: adivinhe qual é com 3 vidas — cada erro libera uma pista. Quiz de anime com novo desafio todo dia.",
  "/emoji",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Watermark text="絵文字" />
      {children}
    </>
  );
}
