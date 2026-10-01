import SiteHeader from "@/components/SiteHeader";
import SupportCard from "@/components/SupportCard";
import Watermark from "@/components/Watermark";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(
  "Apoie o projeto",
  "Ajude a manter o quiz diário de anime no ar: faça uma doação no Buy Me a Coffee ou compre na Amazon e no Mercado Livre pelos nossos links.",
  "/support",
);

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 md:px-10">
      <Watermark text="応援" />
      <SiteHeader />

      {/* texto centralizado e o card de apoio logo abaixo */}
      <main className="mt-6 w-full items-center gap-10 lg:mt-12 flex flex-col">
        <div className="flex w-full flex-col items-center gap-y-2">
          <span className="rounded-full text-center w-fit bg-lime px-4 py-1.5 text-sm font-bold text-ink">
            Apoie o projeto
          </span>
          <h1 className="max-w-3xl text-center font-display text-3xl leading-[1.02] font-extrabold tracking-tight text-ink ">
            Curtiu o projeto? Dá uma força pra ele continuar.
          </h1>
          <p className="max-w-3xl text-center text-lg leading-relaxed text-muted">
            O jogo é de graça e feito por fãs. Com uma doação no Buy Me a
            Coffee ou comprando nas lojas pelos nossos links, você ajuda a pagar o
            servidor e a trazer mais animes e aberturas.
          </p>
          {/* aviso de afiliado (exigido pela Amazon) */}
          <p className="max-w-3xl text-center text-xs leading-relaxed text-muted">
            Links de afiliado: comprando por eles você paga o mesmo preço e o
            projeto pode receber uma pequena comissão da loja. Como associado da
            Amazon, o projeto ganha com compras qualificadas.
          </p>
        </div>

        <SupportCard />
      </main>
    </div>
  );
}
