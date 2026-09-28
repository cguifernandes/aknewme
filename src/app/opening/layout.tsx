import Watermark from "@/components/Watermark";
import { pageMetadata } from "@/lib/site";

// A página é client component; o SEO da rota fica aqui.
export const metadata = pageMetadata(
  "Adivinhe o anime pela abertura",
  "Ouça 1 segundo da opening e adivinhe o anime. Errou ou pulou? O trecho aumenta — são 6 tentativas. Novo desafio todo dia.",
  "/opening",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Watermark text="主題歌" />
      {children}
    </>
  );
}
