import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import CluesGame from "@/components/games/CluesGame";

// Treino: mesma tela, animes aleatórios e sem limite. Fora do Google (duplicaria a página do modo).
export const metadata: Metadata = {
  title: `Treino: adivinhe o anime pelas pistas | ${SITE_NAME}`, // o layout do modo não repassa o modelo "%s | aknewme"
  robots: { index: false, follow: true },
};

export default function Page() {
  return <CluesGame practice />;
}
