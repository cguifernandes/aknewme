// Pixel do Meta. Só liga com NEXT_PUBLIC_META_PIXEL_ID definido (produção); sem ele, tudo aqui é no-op.
type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
  disablePushState: boolean;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

import { isInternal } from "./metrics";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Snippet oficial do Meta, tipado: cria a fila do fbq e carrega o fbevents.js. */
function load(id: string) {
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  // O PageView de troca de rota é disparado à mão (MetaPixel), para o /plays nunca ser enviado.
  fbq.disablePushState = true;
  window.fbq = window._fbq = fbq;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  fbq("init", id);
}

/** PageView da rota atual; carrega o pixel na primeira chamada. */
export function trackPageView(pathname: string) {
  // O painel não é visita de jogador, e a URL dele leva a chave (?key=) que não pode ir para o Meta.
  // Navegador interno (o do dono do site, marcado ao abrir o /plays): o pixel nem é carregado.
  if (!PIXEL_ID || pathname.startsWith("/plays") || isInternal()) return;
  if (!window.fbq) load(PIXEL_ID);
  window.fbq?.("track", "PageView");
}

/** Evento personalizado; não faz nada se o pixel não carregou (sem env, /plays). */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined") window.fbq?.("trackCustom", event, params);
}
