/**
 * Lugar reservado enquanto um dado ainda não chegou (ex.: o estado do duelo na janela "Duelar com…"): pílula em track
 * com um brilho suave (mist) passando, do tamanho do que vai entrar no lugar, para nada pular quando o dado chegar.
 * Com movimento reduzido, fica parada (a regra global de prefers-reduced-motion). Passe o tamanho e o raio em className.
 */
export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--color-track)_25%,var(--color-mist)_50%,var(--color-track)_75%)] bg-[length:200%_100%] ${className}`}
    />
  );
}
