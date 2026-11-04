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

/** Logo do X (não está no Font Awesome free-solid). Tamanho pelo font-size. */
export function XLogo() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true">
      <path d="M18.9 1.2h3.7l-8 9.2L24 22.8h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.4h2L6.5 3.3H4.3l13.3 17.3Z" />
    </svg>
  );
}
