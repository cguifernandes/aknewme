"use client";

import { useEffect, useState } from "react";
import { markReadWhere, NOTIFY_EVENT, notifyState, type NotificationItem, type NotifyState } from "@/lib/notify";

/** Notificações de quem está logado (lista e não lidas), atualizadas quando o site consulta o servidor. */
export function useNotifications(): NotifyState {
  const [state, setState] = useState<NotifyState>({ unread: 0, items: [] });
  useEffect(() => {
    const read = () => setState(notifyState());
    read();
    window.addEventListener(NOTIFY_EVENT, read);
    return () => window.removeEventListener(NOTIFY_EVENT, read);
  }, []);
  return state;
}

/** Bolinha lime com o número de não lidas (some com 0). `label` = o que o leitor de tela fala. */
export function UnreadDot({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span className={`flex h-5 min-w-5 items-center justify-center rounded-full bg-lime px-1 text-[11px] leading-none font-extrabold text-ink tabular-nums ${className}`}>
      <span aria-hidden="true">{count > 9 ? "9+" : count}</span>
      <span className="sr-only">
        {count} {count === 1 ? "notificação não lida" : "notificações não lidas"}
      </span>
    </span>
  );
}

/**
 * Na tela onde a ação acontece, marca como lidas as notificações dela (agora e quando chegarem outras com a tela
 * aberta): /friends lê as de amizade, a sala lê as da própria sala. Sem o cartão da janela Meu perfil, é assim que a
 * bolinha zera (11-notificacoes.md). `match` deve ser estável (fora do componente ou com useCallback).
 */
export function useReadOnArrival(match: (n: NotificationItem) => boolean) {
  useEffect(() => {
    const run = () => void markReadWhere(match);
    run();
    window.addEventListener(NOTIFY_EVENT, run);
    return () => window.removeEventListener(NOTIFY_EVENT, run);
  }, [match]);
}
