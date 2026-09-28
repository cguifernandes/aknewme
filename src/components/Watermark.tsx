/** Palavra japonesa decorativa atrás da página. Cor clarinha (mist): texto por cima continua legível. */
export default function Watermark({ text }: { text: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <span className="absolute -top-3 -right-5 font-kana text-[clamp(7rem,34vw,12rem)] leading-none font-black text-mist select-none xl:-top-8 xl:-right-10 xl:text-[290px]">
        {text}
      </span>
    </div>
  );
}
