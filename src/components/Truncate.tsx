"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = { text: string; className?: string; children?: ReactNode };

/** Texto cortado com reticências; o balão (utilitário `tip`) só aparece quando realmente cortou. */
export default function Truncate({ text, className = "", children }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setCut(el.scrollWidth > el.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);
  return (
    <span className="tip block min-w-0" data-tip={cut ? text : undefined}>
      <span ref={ref} className={`block truncate ${className}`}>
        {children}
        {text}
      </span>
    </span>
  );
}
