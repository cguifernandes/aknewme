import Watermark from "@/components/Watermark";
import { pageMetadata } from "@/lib/site";

// A página é client component; o SEO da rota fica aqui.
export const metadata = pageMetadata(
  "Desafios anteriores",
  "Perdeu algum dia? Jogue os desafios anteriores do aknewme nos modos Emoji, Opening e Pistas.",
  "/archive",
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Watermark text="アーカイブ" />
      {children}
    </>
  );
}
