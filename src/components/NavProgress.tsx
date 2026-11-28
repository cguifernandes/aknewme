"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Barra de progresso global no topo, estilo YouTube (specs/visual/05-barra-de-progresso.md): ao navegar entre páginas
// (clique num link interno ou navigateStart() antes de router.push/replace), uma barra fina lime avança enquanto a
// próxima página carrega e completa e some quando ela aparece. Só aparece depois de 150 ms (navegação instantânea não
// pisca). Com movimento reduzido, fica parada inteira enquanto carrega, sem animar. Não substitui o Loading das áreas.

const NAV_START = "aknewme:nav-start";
/** Antes de mostrar: navegação mais rápida que isso não mostra a barra */
const SHOW_AFTER = 150;
/** Segurança: se a página nunca trocar (erro, navegação cancelada), a barra some sozinha */
const GIVE_UP = 12_000;

/** Para navegações feitas pelo código (router.push/replace para outra página): avisa a barra. */
export function navigateStart() {
  window.dispatchEvent(new Event(NAV_START));
}

/** Clique que vai virar navegação para outra página deste site (não nova aba, não download, não âncora na mesma página). */
function isPageNav(e: MouseEvent): boolean {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return false;
  const url = new URL(a.href, location.href);
  return url.origin === location.origin && url.pathname !== location.pathname;
}

export default function NavProgress() {
  const path = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const [still, setStill] = useState(false);
  const pending = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const trickle = useRef<ReturnType<typeof setInterval>>(undefined);

  function clearAll() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    clearInterval(trickle.current);
  }

  useEffect(() => {
    const start = () => {
      if (pending.current) return;
      pending.current = true;
      clearAll();
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      setStill(reduced);
      timers.current.push(
        setTimeout(() => {
          if (!pending.current) return;
          setVisible(true);
          setWidth(reduced ? 100 : 12);
          // avança cada vez mais devagar até perto do fim, esperando a página
          if (!reduced) trickle.current = setInterval(() => setWidth((w) => w + (90 - w) * 0.12), 300);
        }, SHOW_AFTER),
        setTimeout(() => finish(), GIVE_UP),
      );
    };
    const onClick = (e: MouseEvent) => isPageNav(e) && start();
    // na captura: o Link do Next cancela o clique (preventDefault) antes de chegar ao document na fase normal
    document.addEventListener("click", onClick, true);
    window.addEventListener(NAV_START, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(NAV_START, start);
      clearAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    if (!pending.current) return;
    pending.current = false;
    clearAll();
    setVisible((shown) => {
      if (!shown) return false; // nem chegou a aparecer: some sem completar
      setWidth(100);
      timers.current.push(
        setTimeout(() => {
          setVisible(false);
          setWidth(0);
        }, 300),
      );
      return true;
    });
  }

  // a página nova apareceu: completa e some
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div
        data-nav-progress={visible ? "on" : "off"}
        style={{ width: `${width}%` }}
        className={`h-full bg-lime shadow-[0_0_8px_var(--color-lime),0_0_2px_var(--color-lime)] ${
          still ? "" : "transition-[width,opacity] duration-300 ease-out"
        } ${visible ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
