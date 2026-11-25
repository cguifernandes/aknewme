/** Bolinha com as iniciais de um jogador do duelo ("VC", "GU", "?"). Tamanho pelo `className` (size-* e text-*). */
export default function DuelAvatar({
  label,
  tone = "grape",
  className = "size-10 text-sm",
  ring = "ring-white",
}: {
  label: string;
  tone?: "grape" | "lime" | "ink";
  className?: string;
  /** Cor do contorno: a do fundo em que a bolinha está (branco na janela, escuro na faixa do duelo) */
  ring?: string;
}) {
  const color = tone === "lime" ? "bg-lime text-ink" : tone === "ink" ? "bg-ink text-lime" : "bg-grape text-white";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-extrabold ring-2 ${ring} ${color} ${className}`}
    >
      {label}
    </span>
  );
}
