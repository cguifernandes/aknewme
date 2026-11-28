// Notificações no navegador (specs/login-duelo/11-notificacoes.md): consulta /api/notifications ao abrir o site (junto
// do /api/me do AccountProvider) e a cada 60 s só com a aba visível; guarda a lista na memória da página e avisa quem
// mostra (bolinha do Menu e do item Amigos) pelo evento NOTIFY_EVENT. O que chega depois da 1ª consulta vira
// também um aviso (toast) com o link da ação. Sem conexão permanente, sem push e sem e-mail.

import { api, MODE_NAME } from "./account";
import { DUEL_TEXT } from "./duelTexts";
import { getDailyResult, type GameMode } from "./game";

export type NotificationItem = {
  id: string;
  type:
    | "friend_request"
    | "friend_accepted"
    | "room_invite"
    | "room_finished"
    | "duel_challenge"
    | "duel_answered";
  actor: {
    id: string;
    handle: string | null;
    name: string | null;
    image: string | null;
  };
  room: { id: string; mode: GameMode; day: number } | null;
  /** Desafio por notificação (15-desafio-por-notificacao.md); `href` = o link do duelo, no "te desafiou" */
  duel: {
    id: string;
    mode: GameMode;
    day: number;
    href: string | null;
    expiresAt: string | null;
  } | null;
  createdAt: string;
  read: boolean;
};
export type NotifyState = { unread: number; items: NotificationItem[] };

export const NOTIFY_EVENT = "aknewme:notifications";
export const POLL_MS = 60_000;
const EMPTY: NotifyState = { unread: 0, items: [] };

/** A frase de cada notificação, montada aqui (o banco guarda só ids e o tipo). */
export function notificationText(n: NotificationItem): string {
  const who =
    n.actor.name ?? (n.actor.handle ? `@${n.actor.handle}` : "Alguém");
  if (n.type === "friend_request")
    return `${who} te mandou um pedido de amizade.`;
  if (n.type === "friend_accepted")
    return `${who} aceitou seu pedido de amizade.`;
  if (n.type === "duel_challenge" && n.duel)
    return DUEL_TEXT.invited(who, MODE_NAME[n.duel.mode], n.duel.day);
  if (n.type === "duel_answered" && n.duel)
    return DUEL_TEXT.answered(who, MODE_NAME[n.duel.mode]);
  if (n.type === "room_invite")
    return `${who} te desafiou${n.room ? ` no ${MODE_NAME[n.room.mode]} #${n.room.day}` : ""}.`;
  return `${who} terminou o duelo. Veja o placar.`;
}

/** Para onde a notificação leva e o nome do link no aviso. */
export function notificationAction(n: NotificationItem): {
  href: string;
  label: string;
} {
  if (n.type === "friend_request")
    return { href: "/friends", label: "Ver pedidos" };
  if (n.type === "friend_accepted")
    return { href: "/friends", label: "Ver amigos" };
  // "Jogar" abre o duelo (o mesmo link do duelo por link); "Ver placar" abre a janela Duelos da home no rival
  if (n.type === "duel_challenge")
    return {
      href: n.duel?.href ?? "/friends",
      label: playedHere(n) ? DUEL_TEXT.seeDuel : DUEL_TEXT.play,
    };
  if (n.type === "duel_answered")
    return { href: `/?duelos=${n.actor.id}`, label: DUEL_TEXT.seeScore };
  return {
    href: n.room ? `/room/${n.room.id}` : "/friends",
    label: n.type === "room_invite" ? "Entrar na sala" : "Ver placar",
  };
}

let state: NotifyState = EMPTY;
let timer: ReturnType<typeof setInterval> | null = null;
/** ids já vistos nesta página; null até a 1ª consulta (o que já existia ao abrir não vira aviso). */
let known: Set<string> | null = null;
let onNew: ((n: NotificationItem) => void) | null = null;

export const notifyState = () => state;

/** Relógio do banco menos o do aparelho (ms): o prazo do convite (expires_at) é contado no relógio do banco */
let skew = 0;
let expiry: ReturnType<typeof setTimeout> | null = null;
/** Convite de duelo com o prazo vencido (15-desafio-por-notificacao.md): sai da tela e da bolinha na hora, sem esperar a próxima consulta */
export const expiredInvite = (n: NotificationItem) =>
  n.type === "duel_challenge" &&
  !!n.duel?.expiresAt &&
  !playedHere(n) &&
  Date.parse(n.duel.expiresAt) <= Date.now() + skew;

/** Quem recebeu o convite já tem neste aparelho o resultado daquele modo e dia: não expira, vira "Ver duelo" */
export function playedHere(n: NotificationItem): boolean {
  if (n.type !== "duel_challenge" || !n.duel || typeof window === "undefined")
    return false;
  return getDailyResult(n.duel.mode)?.day === n.duel.day;
}

/** Quanto falta (ms) para o convite de duelo vencer, no relógio do banco; null se não tem prazo */
export const inviteMsLeft = (n: NotificationItem) =>
  n.type === "duel_challenge" && n.duel?.expiresAt
    ? Date.parse(n.duel.expiresAt) - (Date.now() + skew)
    : null;

function set(next: NotifyState) {
  const gone = next.items.filter(expiredInvite);
  state = gone.length
    ? {
        unread: Math.max(0, next.unread - gone.filter((n) => !n.read).length),
        items: next.items.filter((n) => !expiredInvite(n)),
      }
    : next;
  // o próximo convite a vencer: tira da lista nessa hora
  if (expiry) clearTimeout(expiry);
  const at = Math.min(
    ...state.items
      .filter(
        (n) =>
          n.type === "duel_challenge" && n.duel?.expiresAt && !playedHere(n),
      )
      .map((n) => Date.parse(n.duel!.expiresAt!) - skew),
  );
  expiry = Number.isFinite(at)
    ? setTimeout(() => set(state), Math.max(0, at - Date.now()) + 50)
    : null;
  window.dispatchEvent(new Event(NOTIFY_EVENT));
}

async function refresh() {
  const r = await api<NotifyState & { now?: string }>("/api/notifications");
  if (!r.ok) {
    if (r.status === 401) stopNotifications(); // sem sessão: para de consultar
    return;
  }
  if (r.data.now) skew = Date.parse(r.data.now) - Date.now();
  const fresh = known
    ? r.data.items.filter(
        (n) => !n.read && !known!.has(n.id) && !expiredInvite(n),
      )
    : [];
  known = new Set(r.data.items.map((n) => n.id));
  set(r.data);
  // a mais nova das que chegaram (se vierem várias de uma vez, a bolinha mostra o total)
  if (fresh.length && onNew) onNew(fresh[0]);
}

/**
 * Começa a consultar (uma vez por página, só com conta): agora e a cada 60 s com a aba visível; ao voltar para a aba,
 * consulta na hora. `toast` recebe cada notificação nova que chega com o site aberto.
 */
export function startNotifications(toast: (n: NotificationItem) => void) {
  onNew = toast;
  if (timer) return;
  void refresh();
  timer = setInterval(
    () => document.visibilityState === "visible" && void refresh(),
    POLL_MS,
  );
  document.addEventListener("visibilitychange", onVisible);
}

const onVisible = () =>
  document.visibilityState === "visible" && void refresh();

/** Para de consultar e esvazia (sair da conta, 401). */
export function stopNotifications() {
  if (timer) clearInterval(timer);
  timer = null;
  known = null;
  document.removeEventListener("visibilitychange", onVisible);
  set(EMPTY);
}

/** Marca como lidas as não lidas que batem com `match`, na tela na hora e no servidor (uma por vez). */
export async function markReadWhere(match: (n: NotificationItem) => boolean) {
  const ids = state.items.filter((n) => !n.read && match(n)).map((n) => n.id);
  if (!ids.length) return;
  set({
    unread: Math.max(0, state.unread - ids.length),
    items: state.items.map((n) =>
      ids.includes(n.id) ? { ...n, read: true } : n,
    ),
  });
  for (const id of ids) await api("/api/notifications", "POST", { read: id });
}

/** O mesmo, quando a lista ainda pode não ter chegado (tela aberta pelo link do aviso): agora ou na próxima consulta. */
export function markReadSoon(match: (n: NotificationItem) => boolean) {
  if (state.items.some((n) => !n.read && match(n)))
    return void markReadWhere(match);
  const once = () => {
    window.removeEventListener(NOTIFY_EVENT, once);
    void markReadWhere(match);
  };
  window.addEventListener(NOTIFY_EVENT, once);
}

/** Marca como lida uma notificação (ou todas) na tela na hora, e no servidor. */
export async function markNotificationsRead(id?: string) {
  const items = state.items.map((n) =>
    !id || n.id === id ? { ...n, read: true } : n,
  );
  const cleared = state.items.filter(
    (n) => !n.read && (!id || n.id === id),
  ).length;
  set({ unread: id ? Math.max(0, state.unread - cleared) : 0, items });
  await api("/api/notifications", "POST", { read: id ?? "all" });
}
