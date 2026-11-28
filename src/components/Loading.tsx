// Carregamento único do projeto (specs/login-duelo/09-menu-perfil.md, "Carregamento: padrão único"): toda tela ou área
// que carrega usa este componente, sempre igual: o spinner do projeto e, embaixo, o texto "Carregando" com três pontos
// que aparecem um a um, em loop. Sem texto por tela ("Entrando", "Carregando seus amigos"...). Os spinners pequenos de
// dentro dos botões (Spinner, em account/ui.tsx) continuam sem texto.
// role="status" para leitor de tela (lê só "Carregando"). Com prefers-reduced-motion: "Carregando..." parado.

const DOTS = ["animate-loading-dot-1", "animate-loading-dot-2", "animate-loading-dot-3"];

/** `size`: "lg" para a tela inteira, "sm" para uma área dentro da tela. */
export default function Loading({ size = "lg", className = "" }: { size?: "sm" | "lg"; className?: string }) {
  const lg = size === "lg";
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 text-ink ${lg ? "py-16" : "py-6"} ${className}`}>
      <span aria-hidden="true" className={`animate-spin rounded-full border-current border-t-transparent ${lg ? "size-10 border-4" : "size-6 border-[3px]"}`} />
      <span className={`font-bold ${lg ? "text-base" : "text-sm"}`}>
        Carregando
        {/* os pontos ocupam sempre o mesmo espaço (só a opacidade muda): o texto não treme */}
        <span aria-hidden="true">
          {DOTS.map((dot) => (
            <span key={dot} className={dot}>
              .
            </span>
          ))}
        </span>
      </span>
    </div>
  );
}
