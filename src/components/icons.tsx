export function HeartIcon({ dim = false }: { dim?: boolean }) {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true" className={dim ? "text-white/25" : "text-blush"}>
      <path
        d="M8 13.4 1.9 7.6A4.2 4.2 0 0 1 4.9.5c1.2 0 2.3.5 3.1 1.4A4.2 4.2 0 0 1 11.1.5a4.2 4.2 0 0 1 3 7.1L8 13.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="13" height="15" viewBox="0 0 13 15" aria-hidden="true" className="shrink-0">
      <rect x="1" y="6" width="11" height="8.5" rx="2" fill="currentColor" opacity="0.85" />
      <path d="M3.5 6V4.5a3 3 0 0 1 6 0V6" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M1.5 5.2 4.5 8.2 10.5 1.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
