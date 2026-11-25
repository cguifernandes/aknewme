import Watermark from "@/components/Watermark";
import { pageMetadata } from "@/lib/site";

// Convite do duelo ("te desafio"): a página é client component (lê o desafio da URL); o SEO da rota fica aqui.
export const metadata = {
  ...pageMetadata("Te desafiaram no aknewme", "Seu amigo jogou o desafio de anime do dia. Jogue o mesmo e compare os placares lado a lado.", "/duel"),
  robots: { index: false }, // cada link é de um desafio só: nada para indexar
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Watermark text="決闘" />
      {children}
    </>
  );
}
