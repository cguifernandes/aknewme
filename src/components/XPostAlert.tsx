"use client";

import { useEffect, useState } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { X_POST_URL } from "@/lib/site";
import { Icon, XLogo } from "./icons";

const SEEN_KEY = "aknewme.xpost";

/**
 * Aviso flutuante (canto superior direito, abaixo do cabeçalho) chamando para curtir
 * o post do X em X_POST_URL (src/lib/site.ts). Some ao fechar ou ao abrir o post e
 * só volta quando o link mudar, ou seja, a cada post novo.
 */
export default function XPostAlert() {
  const [show, setShow] = useState(false);

  // Só depois de montar: o localStorage diz se este post já foi visto/fechado.
  useEffect(() => {
    if (!X_POST_URL.startsWith("https://x.com/")) return;
    try {
      setShow(localStorage.getItem(SEEN_KEY) !== X_POST_URL);
    } catch {
      setShow(true); // sem localStorage (aba privada): mostra, só não lembra
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(SEEN_KEY, X_POST_URL);
    } catch {}
  }

  return (
    // Camada fixa com o mesmo container das páginas (max-w-7xl + px): o aviso alinha com a
    // borda direita do conteúdo, não com a da janela. pointer-events-none: só o aviso recebe clique.
    <div className="pointer-events-none fixed inset-x-0 top-4 z-40">
      <div className="mx-auto flex max-w-7xl justify-end px-6 md:px-10">
        <aside
          aria-label="Post novo no X"
          className="pointer-events-auto flex w-80 max-w-full items-center gap-3 rounded-2xl bg-white p-3 shadow-pop-lg"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-x text-[15px] text-white">
            <XLogo />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">Post novo no X!</p>
            <a
              href={X_POST_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismiss}
              className="text-sm font-semibold text-grape underline underline-offset-2 hover:text-grape-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
            >
              Ver o post e deixar uma curtida
            </a>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fechar aviso"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-track focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
          >
            <Icon icon={faXmark} />
          </button>
        </aside>
      </div>
    </div>
  );
}
