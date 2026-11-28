import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "../icons";

/** O que o campo do @ sabe sobre o que foi digitado. */
export type DotState = "empty" | "checking" | "free" | "busy";

const LABEL: Record<DotState, string> = { empty: "", checking: "Verificando", free: "Disponível", busy: "Já tem dono ou não é permitido" };

/**
 * Indicador de disponibilidade do @ (specs/login-duelo/06-usuario.md, seção 5): uma bolinha de tamanho FIXO (28 px)
 * dentro do campo, à direita. Nunca muda de largura nem de altura entre os estados, então o campo não pula.
 * - vazio ou formato inválido: só o contorno;
 * - verificando: o spinner do projeto, inteiro, centrado;
 * - livre: check em ink sobre lime;
 * - já tem dono, reservado ou não permitido: X em ink sobre blush (a explicação fica na linha de baixo do campo).
 * Para leitor de tela, o estado em texto, com aria-live.
 */
export default function HandleDot({ state, label }: { state: DotState; label?: string }) {
  const look = state === "free" ? "border-lime bg-lime text-ink" : state === "busy" ? "border-blush bg-blush text-ink" : "border-lavender bg-paper text-grape";
  return (
    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs transition-colors ${look}`}>
      {state === "checking" && <span aria-hidden="true" className="block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {state === "free" && <Icon icon={faCheck} />}
      {state === "busy" && <Icon icon={faXmark} />}
      <span className="sr-only" aria-live="polite">
        {label ?? LABEL[state]}
      </span>
    </span>
  );
}
