import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display text-2xl font-extrabold tracking-tight text-white ${className}`}
    >
      aknewme<span className="text-lime">.</span>
    </Link>
  );
}
