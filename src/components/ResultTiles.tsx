import {
  faAnglesRight,
  faCheck,
  faXmark,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "./icons";

/** Quadradinho do compartilhamento → cor, ícone e explicação (tooltip `tip` do tema) no tema. */
const TILE: Record<string, { bg: string; icon?: IconDefinition; label: string }> = {
  "🟩": { bg: "bg-lime", icon: faCheck, label: "Acertou" },
  "🟨": { bg: "bg-sun", icon: faCheck, label: "Acertou" },
  "🟥": { bg: "bg-blush", icon: faXmark, label: "Errou" },
  "⬛": { bg: "bg-lavender", icon: faAnglesRight, label: "Pulou" },
  "🟪": { bg: "bg-lavender", label: "Pista usada" },
};
/** Quadradinho não usado: roxo bem claro com borda tracejada, visível também sobre os fundos pastel da Home. */
const EMPTY = { bg: "bg-track border-2 border-dashed border-grape/40", label: "Não usado" };

/** 1ª linha do grid = quadradinhos; o resto (corações do Modo Emoji) segue como emoji. */
export function splitGrid(grid?: string) {
  const [squares = "", ...rest] = (grid ?? "").split("\n");
  const tiles = Array.from(squares);
  return { tiles, extra: rest.join("\n"), tried: tiles.filter((t) => t !== "⬜").length };
}

/**
 * Fileira dos quadradinhos do resultado (EndCard e cards da Home).
 * Entrada (pop, escalonada) fica num span externo; `hoverClass` anima o interno, assim o hover
 * não reinicia a entrada nem faz o quadradinho sumir ao tirar o mouse.
 */
export default function ResultTiles({
  tiles,
  size = "size-9 rounded-lg text-sm",
  animate = true,
  hoverClass = "",
  className = "",
}: {
  tiles: string[];
  size?: string;
  animate?: boolean;
  hoverClass?: string;
  className?: string;
}) {
  return (
    <p className={`flex flex-wrap gap-2 ${className}`}>
      {tiles.map((t, i) => {
        const tile = TILE[t] ?? EMPTY;
        return (
          <span
            key={i}
            style={animate ? { animationDelay: `${200 + i * 80}ms` } : undefined}
            className={`flex ${animate ? "animate-pop" : ""}`}
          >
            <span
              tabIndex={0}
              data-tip={tile.label}
              aria-label={tile.label}
              className={`tip flex items-center justify-center text-ink ${size} ${hoverClass} ${tile.bg}`}
            >
              {"icon" in tile && tile.icon && <Icon icon={tile.icon} />}
            </span>
          </span>
        );
      })}
    </p>
  );
}
