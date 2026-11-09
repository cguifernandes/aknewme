"use client";

import { useEffect, useState } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { trackClick } from "@/lib/follow";
import { X_POST_URL } from "@/lib/site";
import { Icon, XLogo } from "./icons";

const SEEN_KEY = "aknewme.xpost";

/**
 * Aviso flutuante (celular: abaixo do cabeçalho; telas maiores: canto inferior direito) chamando para curtir
 * o post do X em destaque (escolhido no painel /plays; reserva em src/lib/site.ts). Some ao fechar ou ao abrir o post e
 * só volta quando o link mudar, ou seja, a cada post novo.
 */
export default function XPostAlert() {
  /** Link do post a mostrar; "" = sem aviso (nenhum post, ou este já foi visto/fechado). */
  const [url, setUrl] = useState("");

  // Só depois de montar: /api/xpost diz qual é o post (trocado no painel /plays, sem deploy)
  // e o localStorage diz se ele já foi visto/fechado.
  useEffect(() => {
    fetch("/api/xpost")
      .then((r) => r.json())
      .then((d) => d.url as unknown)
      .catch(() => X_POST_URL)
      .then((u) => {
        if (typeof u !== "string" || !u.startsWith("https://x.com/")) return;
        try {
          if (localStorage.getItem(SEEN_KEY) === u) return;
        } catch {} // sem localStorage (aba privada): mostra, só não lembra
        setUrl(u);
      });
  }, []);

  if (!url) return null;

  function dismiss() {
    try {
      localStorage.setItem(SEEN_KEY, url);
    } catch {}
    setUrl("");
  }

  return (
    // Camada fixa com o mesmo container das páginas (max-w-7xl + px): o aviso alinha com a
    // borda direita do conteúdo, não com a da janela. pointer-events-none: só o aviso recebe clique.
    // Nunca em cima de um controle: no celular fica logo abaixo do cabeçalho (embaixo cobriria o
    // "Chutar"); do tablet para cima, no canto de baixo. Entre 640 e 1024px some enquanto o botão
    // "Ver resultado" (EndCard) está na tela, porque os dois se encostam.
    <div className="pointer-events-none fixed inset-x-0 z-40 max-sm:top-20 sm:bottom-4 sm:max-lg:[html:has(#ver-resultado)_&]:hidden">
      <div className="mx-auto flex max-w-7xl justify-end px-6 md:px-10">
        <aside
          aria-label="Post novo no X"
          className="pointer-events-auto flex w-full items-center sm:w-80 gap-3 rounded-2xl bg-white p-3 shadow-pop-lg"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-x text-[15px] text-white">
            <XLogo />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">Post novo no X!</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackClick("post");
                dismiss();
              }}
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
