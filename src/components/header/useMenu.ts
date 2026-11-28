"use client";

import { useEffect, useId, useRef, useState } from "react";

// Comportamento do Menu do cabeçalho (specs/cabecalho e login-duelo/09-menu-perfil.md):
// abre abaixo do botão, o foco vai ao 1º item, setas ↑/↓, Home e End andam pelos itens, Esc fecha e devolve o foco ao
// botão, Tab sai e fecha, clique fora fecha (sem roubar o foco de onde a pessoa clicou).

/** Classes dos itens e do painel, as mesmas nos dois painéis. */
export const ITEM_BASE =
  "flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl px-3 text-left text-[15px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape sm:min-h-9";
/**
 * Hover e foco dos itens (specs/login-duelo/09-menu-perfil.md, segunda rodada): só um fundo roxo claro (`track`), com
 * transição de cor; o foco de teclado é igual, mais o contorno grape. Sem sweep (ele fica só no "Entrar").
 * Altura: 44 px de toque no celular, 36 px no computador.
 */
export const ITEM_HOVER = "transition-colors duration-200 hover:bg-track focus-visible:bg-track";
export const ITEM = `${ITEM_BASE} text-ink ${ITEM_HOVER}`;
export const PANEL =
  "absolute top-full right-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] origin-top-right animate-menu-in rounded-3xl border-2 border-mist bg-paper p-2 shadow-pop-lg";

export function useMenu() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  // só os itens visíveis (ex.: o "Duelos" do Menu some no computador, onde ele já está no cabeçalho)
  const entries = () => [...(panel.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])].filter((el) => el.offsetParent !== null);
  function close(refocus: boolean) {
    setOpen(false);
    if (refocus) button.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    entries()[0]?.focus();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !button.current?.contains(t)) close(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function onKey(e: React.KeyboardEvent) {
    const list = entries();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      list[(n + list.length) % list.length]?.focus();
    };
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Tab") setOpen(false);
  }

  /** Props do botão que abre o painel (aria + abrir com clique ou com ↓). */
  const buttonProps = {
    ref: button,
    type: "button" as const,
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    "aria-controls": open ? id : undefined,
    onClick: () => setOpen((o) => !o),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown" && !open) {
        e.preventDefault();
        setOpen(true);
      }
    },
  };
  /** Props do painel. */
  const panelProps = { ref: panel, id, role: "menu" as const, onKeyDown: onKey };

  return { open, close, buttonProps, panelProps };
}
