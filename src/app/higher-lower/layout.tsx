import Watermark from "@/components/Watermark";
import { HL_PATH } from "@/lib/higherLower";
import { pageMetadata } from "@/lib/site";

// A página é client component; o SEO da rota fica aqui.
export const metadata = pageMetadata(
  "Mais ou Menos: qual anime tem mais episódios?",
  "Jogo infinito de anime: qual tem mais episódios, estreou antes, tem a maior nota ou é mais popular no MyAnimeList? Acerte em sequência e bata seu recorde.",
  HL_PATH,
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Watermark text="比較" />
      {children}
    </>
  );
}
