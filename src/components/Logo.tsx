import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display text-[1.75rem] font-extrabold tracking-tight text-ink ${className}`}
    >
      aknewme<span className="text-grape">.</span>
    </Link>
  );
}
