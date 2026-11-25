"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { trackClick } from "@/lib/follow";
import { dailyNumber } from "@/lib/game";
import { X_POST_URL } from "@/lib/site";
import { Icon } from "./icons";

const SEEN_KEY = "aknewme.xpost";
/** Tempo que o aviso fica na tela antes de sumir sozinho. */
const AUTO_HIDE_MS = 12_000;

/** "há 2 h" a partir do ID do tweet: o snowflake do X guarda o instante de criação (ms desde a época do Twitter). */
function postedAgo(url: string): string {
  const id = url.match(/status\/(\d+)/)?.[1];
  if (!id) return "";
  const ms = Number(BigInt(id) >> 22n) + 1288834974657;
  const min = Math.max(1, Math.round((Date.now() - ms) / 60_000));
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.round(h / 24)} d`;
}

/**
 * Aviso flutuante (celular: abaixo do cabeçalho; telas maiores: canto inferior direito) no estilo de um post do X,
 * chamando para o post em destaque (escolhido no painel /plays; reserva em src/lib/site.ts).
 * Some sozinho depois de AUTO_HIDE_MS (volta no próximo carregamento) e para de vez ao fechar ou abrir o post,
 * até o link mudar, ou seja, a cada post novo.
 */
export default function XPostAlert() {
  /** Link do post a mostrar; "" = sem aviso (nenhum post, ou este já foi visto/fechado). */
  const [url, setUrl] = useState("");
  /** Texto do post, escrito no painel /plays; "" = frase padrão. */
  const [text, setText] = useState("");
  /** Saindo: toca a animação de saída antes de desmontar. */
  const [leaving, setLeaving] = useState(false);
  const home = usePathname() === "/";

  // Só depois de montar: /api/xpost diz qual é o post (trocado no painel /plays, sem deploy)
  // e o localStorage diz se ele já foi visto/fechado.
  useEffect(() => {
    fetch("/api/xpost")
      .then((r) => r.json())
      .catch(() => ({ url: X_POST_URL }))
      .then((d: { url?: unknown; text?: unknown }) => {
        const u = d.url;
        if (typeof u !== "string" || !u.startsWith("https://x.com/")) return;
        try {
          if (localStorage.getItem(SEEN_KEY) === u) return;
        } catch {} // sem localStorage (aba privada): mostra, só não lembra
        if (typeof d.text === "string") setText(d.text);
        setUrl(u);
      });
  }, []);

  // ponytail: some sem marcar como visto, então reaparece a cada carregamento até clicar/fechar.
  useEffect(() => {
    if (!url) return;
    const t = setTimeout(() => setLeaving(true), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [url]);

  if (!url || !home) return null; // só na Home: nos jogos cobriria o tabuleiro

  function dismiss() {
    try {
      localStorage.setItem(SEEN_KEY, url);
    } catch {}
    setLeaving(true);
  }

  return (
    // Camada fixa com o mesmo container das páginas (max-w-7xl + px): o aviso alinha com a
    // borda direita do conteúdo, não com a da janela. pointer-events-none: só o aviso recebe clique.
    // Nunca em cima de um controle: no celular fica logo abaixo do cabeçalho (embaixo cobriria o
    // campo de palpite); do tablet para cima, no canto de baixo. Entre 640 e 1024px some enquanto o botão
    // "Ver resultado" (EndCard) está na tela, porque os dois se encostam.
    <div className="pointer-events-none fixed inset-x-0 z-40 max-sm:top-20 sm:bottom-4 sm:max-lg:[html:has(#ver-resultado)_&]:hidden">
      <div className="mx-auto flex max-w-7xl justify-end px-6 md:px-10">
        <aside
          aria-label="Post novo no X"
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget && leaving) {
              setUrl("");
              setLeaving(false);
            }
          }}
          className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl bg-ink p-4 text-white shadow-pop-lg sm:w-80 ${
            leaving ? "animate-toast-out" : "animate-toast-in"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-grape font-display text-lg font-extrabold text-white">
              a.
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-bold">Post novo no X</p>
              <p className="truncate text-xs text-lavender">
                @aknewmee · {postedAgo(url)}
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fechar aviso"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-grape-ink text-white transition hover:bg-grape focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
            >
              <Icon icon={faXmark} className="text-[13px]" />
            </button>
          </div>
          {/* texto do post (até 5 linhas, com as quebras de quem escreveu); sem texto gravado, a frase padrão */}
          <p className="mt-3 line-clamp-5 text-sm leading-relaxed whitespace-pre-line">
            {text || `Desafio #${dailyNumber()} no ar! Quem acertar de primeira, manda o print aqui.`}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackClick("post");
              dismiss();
            }}
            className="mt-3 inline-flex rounded-full bg-lime px-5 py-2 text-sm font-bold text-ink transition hover:bg-white active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
          >
            Ver post
          </a>
          {/* barra em lime que esvazia enquanto o aviso fica na tela */}
          <span
            aria-hidden="true"
            style={{ animationDuration: `${AUTO_HIDE_MS}ms` }}
            className="absolute inset-x-0 bottom-0 h-1 origin-left bg-lime animate-drain"
          />
        </aside>
      </div>
    </div>
  );
}
