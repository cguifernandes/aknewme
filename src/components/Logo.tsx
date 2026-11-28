import Link from "next/link";

/** Site logo (links home). `light`: white text and lime dot, for dark backgrounds such as the login brand panel. */
export default function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <Link
      href="/"
      className={`font-display text-[1.75rem] font-extrabold tracking-tight ${light ? "text-paper" : "text-ink"} ${className}`}
    >
      aknewme<span className={light ? "text-lime" : "text-grape"}>.</span>
    </Link>
  );
}
