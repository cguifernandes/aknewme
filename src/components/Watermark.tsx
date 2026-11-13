/**
 * Nome do jogo em japonês, apagado, no canto de baixo à direita do bloco de texto do card (mesmo lugar em todos).
 * O pai precisa de `relative isolate`: assim ela fica atrás do texto, mas na frente do fundo do card.
 */
export function CardKana({ text }: { text: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -right-2 -bottom-2 -z-10 font-kana text-7xl leading-none font-black whitespace-nowrap text-white/10 select-none"
    >
      {text}
    </span>
  );
}

/** Palavra japonesa decorativa atrás da página. Cor clarinha (mist): texto por cima continua legível. */
export default function Watermark({ text }: { text: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <span className="absolute -top-3 -right-5 font-kana text-[clamp(7rem,34vw,12rem)] leading-none font-black whitespace-nowrap text-mist select-none xl:-top-8 xl:-right-10 xl:text-[290px]">
        {text}
      </span>
    </div>
  );
}
