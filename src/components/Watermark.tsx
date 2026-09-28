/** Palavra japonesa decorativa atrás da página (só em telas largas, onde não cobre o conteúdo). */
export default function Watermark({ text }: { text: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden max-xl:hidden">
      <span className="absolute -top-8 -right-10 font-kana text-[290px] leading-none font-black text-mist select-none">
        {text}
      </span>
    </div>
  );
}
