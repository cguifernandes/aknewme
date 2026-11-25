import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "./icons";

/** O "Fechar" de todas as janelas (<dialog>): mesmo tamanho, cor e hover. Posição pelo `className`. */
export default function CloseButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Fechar"
      className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-track bg-white text-grape sweep-track focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape ${className}`}
    >
      <Icon icon={faXmark} className="text-sm" />
    </button>
  );
}
