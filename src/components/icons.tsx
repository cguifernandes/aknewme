import { config } from "@fortawesome/fontawesome-svg-core";
import { faCheck, faHeart, faLock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Ícones do projeto: Font Awesome (free-solid). O CSS dele entra pelo app/layout.tsx;
// sem isto ele injetaria uma segunda cópia no navegador.
config.autoAddCss = false;

/** Ícone do Font Awesome: tamanho pelo font-size (text-*), cor por currentColor. Já sai com aria-hidden. */
export { FontAwesomeIcon as Icon };

export function HeartIcon() {
  return <FontAwesomeIcon icon={faHeart} className={`text-[15px]`} />;
}

export function LockIcon() {
  return <FontAwesomeIcon icon={faLock} className="shrink-0 text-sm" />;
}

export function CheckIcon() {
  return <FontAwesomeIcon icon={faCheck} className="shrink-0 text-[11px]" />;
}
