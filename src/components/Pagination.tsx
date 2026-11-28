"use client";

import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { pageSlots } from "@/lib/pagination";
import { Icon } from "./icons";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const BTN = `inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums ${FOCUS}`;


/**
 * Paginação por páginas do projeto: pílulas com os números (a atual em grape), anterior/próxima com setas e desativadas
 * nas pontas. No computador até 7 posições; no celular até 5 (com reticências). Some com uma página só.
 * `page` começa em 1. `label`: nome para o leitor de tela ("Páginas de amigos").
 */
export default function Pagination({ page, pages, onChange, label, className = "" }: { page: number; pages: number; onChange: (page: number) => void; label: string; className?: string }) {
  if (pages <= 1) return null;
  const list = (max: number, cls: string) => (
    <ul className={`flex items-center gap-1 ${cls}`}>
      {pageSlots(page, pages, max).map((p, i) =>
        p === "…" ? (
          <li key={`gap-${i}`} aria-hidden="true" className="w-5 text-center text-sm font-bold text-muted">
            …
          </li>
        ) : (
          <li key={p}>
            <button
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Página ${p}`}
              className={`${BTN} ${p === page ? "bg-grape text-white" : "border-2 border-track bg-paper text-ink sweep-track"}`}
            >
              {p}
            </button>
          </li>
        ),
      )}
    </ul>
  );
  const arrow = (to: number, icon: typeof faChevronLeft, name: string) => (
    <button
      type="button"
      onClick={() => onChange(to)}
      disabled={to < 1 || to > pages}
      aria-label={name}
      className={`${BTN} border-2 border-track bg-paper text-grape sweep-track disabled:opacity-40 disabled:[background-image:none]`}
    >
      <Icon icon={icon} className="text-xs" />
    </button>
  );
  return (
    <nav aria-label={label} className={`flex items-center justify-center gap-1 ${className}`}>
      {arrow(page - 1, faChevronLeft, "Página anterior")}
      {list(5, "sm:hidden")}
      {list(7, "max-sm:hidden")}
      {arrow(page + 1, faChevronRight, "Próxima página")}
    </nav>
  );
}

/**
 * Página atual de uma lista que muda de tamanho (`total` = itens na lista toda, como o servidor conta): se a página em
 * que a pessoa está deixou de existir (a lista encolheu e ela ficou vazia), volta para a última que existe (a anterior,
 * 14-duelos-na-conta-e-paginacao.md). Devolve [página, trocar página, total de páginas].
 */
export function usePage(total: number, perPage: number): [number, (p: number) => void, number] {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);
  return [Math.min(page, pages), setPage, pages];
}
