import Watermark from "@/components/Watermark";
import { pageMetadata } from "@/lib/site";

// A página é client component; o SEO da rota fica aqui.
export const metadata = pageMetadata(
  "Adivinhe o anime pelas pistas",
  "Ano de estreia, estúdio, gênero, episódios e sinopse: descubra o anime com o mínimo de pistas e ganhe de 5 a 1 pontos. Novo desafio todo dia.",
  "/clues",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Watermark text="ヒント" />
      {children}
    </>
  );
}
