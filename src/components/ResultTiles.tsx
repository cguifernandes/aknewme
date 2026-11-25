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

/** Cor de fundo de um quadradinho (para listas e placares que mostram só o bloco, sem ícone nem balão). */
export const tileBg = (t: string) => (TILE[t] ?? EMPTY).bg;
/** Quadradinho parado (sem balão nem foco), para listas e selos: a mesma cor e o mesmo ícone (✓, ✗, pulou) do resultado. */
export function Tile({ t, className = "size-6 rounded-md text-[11px]" }: { t: string; className?: string }) {
  const tile = TILE[t] ?? EMPTY;
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center text-ink ${tile.bg} ${className}`}>
      {"icon" in tile && tile.icon && <Icon icon={tile.icon} />}
    </span>
  );
}

/**
 * Cor de um quadradinho pequeno sobre fundo escuro ou roxo (placares do duelo). O "não usado" do site tem borda
 * tracejada grossa, que nesse tamanho fica torta: aqui ele vira só um contorno fino e claro.
 */
export const dotBg = (t: string) => (TILE[t] ? TILE[t].bg : "border border-white/35");

/** O que o quadradinho quer dizer ("Acertou", "Errou"...), para leitores de tela. */
export const tileLabel = (t: string) => (TILE[t] ?? EMPTY).label;

/**
 * 1ª linha do grid = quadradinhos; o resto (corações do Modo Emoji) segue como emoji.
 * `won`: resultados antigos do Modo Pistas vinham só com roxos ("pista usada"), sem mostrar o desfecho —
 * com ele, o último roxo vira verde (acertou) ou vermelho (errou), como nos resultados novos.
 */
export function splitGrid(grid?: string, won?: boolean) {
  const [squares = "", ...rest] = (grid ?? "").split("\n");
  const tiles = Array.from(squares);
  const lastUsed = tiles.lastIndexOf("🟪");
  if (won !== undefined && lastUsed >= 0 && !tiles.includes("🟩") && !tiles.includes("🟥")) tiles[lastUsed] = won ? "🟩" : "🟥";
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
              // nas pontas o balão alinha à borda do quadradinho, para não sair (e ser cortado) pelo lado do card
              data-tip-side={i < 2 ? "start" : i >= tiles.length - 2 ? "end" : undefined}
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
