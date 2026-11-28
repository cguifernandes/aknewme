"use client";

import { useState } from "react";
import {
  ALL_MANGAS,
  DONATION_LABEL,
  DONATION_LINK,
  PIX_KEY,
} from "@/lib/support";
import { AmazonLogo, MercadoLivreLogo } from "./StoreLogos";

// Botões dentro de card: sem sombra (padrão do projeto)
const BTN =
  "block rounded-full py-3 text-center text-sm font-bold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * Botões das lojas na cor de cada marca, com o logo (Amazon do Font Awesome Free; Mercado Livre, o símbolo do logo
 * oficial enviado pelo dono). Sem sweep, como os botões de marca do login: no hover a cor só escurece um pouco.
 */
const STORE_BTN = "flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Card de apoio: doação (Pix e/ou link, ex.: Buy Me a Coffee) + lojas com link de afiliado (src/data/support.ts). */
export default function SupportCard() {
  const [copied, setCopied] = useState(false);
  const donate = !!(PIX_KEY || DONATION_LINK);

  async function copy() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // sem acesso à área de transferência: a chave continua na tela para copiar à mão
    }
  }

  return (
    <section
      aria-label="Apoie o projeto"
      className="rounded-3xl max-w-lg bg-grape p-6 text-white shadow-pop-lg sm:p-8"
    >
      {donate && (
        <>
          <h2
            id="donate-title"
            className="mt-3 text-center font-display text-3xl font-extrabold"
          >
            Faça uma doação
          </h2>
          <p className="mt-2 text-[15px] text-center leading-relaxed text-lavender">
            Qualquer valor ajuda a pagar o servidor e a trazer mais animes e
            aberturas. Sem cadastro e sem mensalidade.
          </p>

          {PIX_KEY && (
            <div className="mt-6 gap-y-3 flex flex-col rounded-2xl bg-white p-4 text-ink">
              <p className="text-xs font-bold tracking-wider text-muted uppercase">
                Chave Pix
              </p>
              <code className="min-w-0 font-bold break-all">{PIX_KEY}</code>
              <button
                type="button"
                onClick={copy}
                className="rounded-full bg-lime px-5 py-2.5 text-sm font-bold text-ink sweep-lime-deep active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          )}

          {DONATION_LINK && (
            <a
              href={DONATION_LINK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${DONATION_LABEL} (abre em nova aba)`}
              className={`${BTN} mt-6 bg-lime text-ink sweep-lime-deep`}
            >
              {DONATION_LABEL}
            </a>
          )}
        </>
      )}

      {/* lojas: na Amazon a comissão vale para o que a pessoa comprar depois do clique */}
      <div className={donate ? "pt-6" : "mt-3"}>
        <h2
          className={
            donate
              ? "font-display text-center text-xl font-extrabold"
              : "font-display text-center text-3xl font-extrabold"
          }
        >
          {donate ? "Ou compre pelas lojas" : "Compre pelas lojas"}
        </h2>
        <p className="mt-1 text-center text-sm leading-relaxed text-lavender">
          Comprando por estes links, o projeto pode receber uma pequena comissão
          da loja, sem custo a mais para você.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={ALL_MANGAS.amazon}
            target="_blank"
            rel="sponsored noopener noreferrer"
            aria-label="Amazon (abre em nova aba)"
            className={`${STORE_BTN} bg-amazon text-paper hover:bg-amazon-deep`}
          >
            <AmazonLogo />
            Amazon
          </a>
          <a
            href={ALL_MANGAS.mercadoLivre}
            target="_blank"
            rel="sponsored noopener noreferrer"
            aria-label="Mercado Livre (abre em nova aba)"
            className={`${STORE_BTN} bg-meli text-meli-ink hover:bg-meli-deep`}
          >
            <MercadoLivreLogo />
            Mercado Livre
          </a>
        </div>
      </div>
    </section>
  );
}
