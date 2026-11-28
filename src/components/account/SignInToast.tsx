"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { prefetchRivals } from "@/lib/accountDuels";
import { openDuelsFromHref } from "@/lib/duelsWindow";
import { Icon } from "../icons";

// Aviso (toast) do projeto, embaixo ao centro: cartão ink que entra deslizando e some sozinho (barra lime esvaziando). Usos:
// - notificação que chega com o site aberto (11-notificacoes.md), com o link da ação ("Ver pedidos", "Entrar na sala").
// - erro ao entrar (/login, 09-menu-perfil.md): no canto superior direito (`place: "top-right"`), lido na hora (role=alert).
// Mouse em cima ou foco de teclado dentro: o tempo e a barrinha param; ao sair, continuam de onde pararam (11-notificacoes.md).
// Quem dispara chama showToast (que também guarda o aviso na sessão, para o caso de a página recarregar).

export const TOAST_EVENT = "aknewme:toast";
const KEY = "aknewme.toast";
const AUTO_HIDE_MS = 6000;
/** `action`: link da ação, só para caminhos deste site ("/friends", "/room/..."). */
type Toast = { message: string; action?: { href: string; label: string }; place?: "top-right"; alert?: boolean };
type Options = Pick<Toast, "place" | "alert">;

export function showToast(message: string, action?: Toast["action"], options: Options = {}) {
  const toast: Toast = { message, action, ...options };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(toast));
  } catch {}
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: toast }));
}

/** Aviso guardado na sessão (formato novo em JSON; o antigo era só o texto). */
function parse(saved: string): Toast | null {
  try {
    const t = JSON.parse(saved);
    if (t && typeof t.message === "string") {
      const a = t.action;
      const ok = a && typeof a.href === "string" && a.href.startsWith("/") && !a.href.startsWith("//") && typeof a.label === "string";
      return { message: t.message, action: ok ? { href: a.href, label: a.label } : undefined, place: t.place === "top-right" ? "top-right" : undefined, alert: t.alert === true };
    }
  } catch {}
  return saved ? { message: saved } : null;
}

export default function SignInToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const [leaving, setLeaving] = useState(false);
  /** Novo aviso: recomeça a barra (key do aviso) */
  const [seq, setSeq] = useState(0);
  /** Mouse em cima ou foco dentro: o tempo e a barrinha param e continuam de onde pararam (todos os avisos) */
  const [paused, setPaused] = useState(false);
  const hover = useRef(false);
  const focused = useRef(false);
  const left = useRef(AUTO_HIDE_MS);
  const since = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const show = (t: Toast) => {
      try {
        sessionStorage.removeItem(KEY);
      } catch {}
      setLeaving(false);
      setToast(t);
      setSeq((n) => n + 1);
    };
    try {
      const saved = parse(sessionStorage.getItem(KEY) ?? "");
      if (saved) show(saved);
    } catch {}
    const onToast = (e: Event) => show((e as CustomEvent<Toast>).detail);
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  // relógio do aviso: conta só enquanto não está parado; parar guarda o que falta, continuar usa o resto
  useEffect(() => {
    if (!toast) return;
    left.current = AUTO_HIDE_MS;
    since.current = Date.now();
    hover.current = focused.current = false;
    setPaused(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLeaving(true), AUTO_HIDE_MS);
    return () => clearTimeout(timer.current);
  }, [toast, seq]);

  function hold(on: boolean) {
    if (leaving) return;
    if (on) {
      if (paused) return;
      clearTimeout(timer.current);
      left.current = Math.max(0, left.current - (Date.now() - since.current));
      setPaused(true);
    } else {
      if (!paused || hover.current || focused.current) return;
      since.current = Date.now();
      timer.current = setTimeout(() => setLeaving(true), left.current);
      setPaused(false);
    }
  }

  if (!toast) return null;
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-50 flex px-4 ${toast.place === "top-right" ? "top-4 justify-end" : "bottom-4 justify-center"}`}
    >
      <aside
        key={seq}
        role={toast.alert ? "alert" : "status"}
        onMouseEnter={() => {
          hover.current = true;
          hold(true);
        }}
        onMouseLeave={() => {
          hover.current = false;
          hold(false);
        }}
        onFocus={() => {
          focused.current = true;
          hold(true);
        }}
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return; // o foco só andou lá dentro
          focused.current = false;
          hold(false);
        }}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && leaving) setToast(null);
        }}
        className={`pointer-events-auto relative flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl bg-ink p-4 text-white shadow-pop-lg transition-colors ${
          toast.action ? "has-[[data-toast-action]:hover]:bg-grape-deep" : ""
        } ${leaving ? "animate-toast-out" : "animate-toast-in"}`}
      >
        {/* com ação, o aviso inteiro é o link (menos o X): clicar em qualquer parte faz o que o link verde fazia */}
        {toast.action && (
          <Link
            data-toast-action
            href={toast.action.href}
            aria-label={toast.action.label}
            aria-describedby="toast-message"
            onPointerEnter={() => toast.action!.href.includes("duelos=") && prefetchRivals()}
            onFocus={() => toast.action!.href.includes("duelos=") && prefetchRivals()}
            onKeyDown={(e) => {
              if (e.key !== " ") return; // Enter já aciona o link; Espaço também, como num botão
              e.preventDefault();
              e.currentTarget.click();
            }}
            onClick={(e) => {
              setLeaving(true);
              if (openDuelsFromHref(toast.action!.href)) e.preventDefault(); // "Ver placar": a janela Duelos abre nesta página
            }}
            className="absolute inset-0 cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lime"
          />
        )}
        <p id="toast-message" className="pointer-events-none relative flex-1 text-sm leading-relaxed font-semibold">
          {toast.message}
        </p>
        <button
          type="button"
          onClick={() => setLeaving(true)}
          aria-label="Fechar aviso"
          className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-grape text-white transition hover:bg-grape-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
        >
          <Icon icon={faXmark} className="text-sm" />
        </button>
        <span aria-hidden="true" style={{ animationDuration: `${AUTO_HIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" }} className="absolute inset-x-0 bottom-0 h-1 origin-left bg-lime animate-drain" />
      </aside>
    </div>
  );
}
