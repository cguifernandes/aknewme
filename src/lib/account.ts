// Conta no navegador (login opcional, specs/login-duelo). A sessão em si é um cookie httpOnly que o JavaScript não lê.
// Aqui fica só um cache dos campos públicos da conta (id, nome, @, URL da foto; 08-conta.md), para o cabeçalho mostrar
// o avatar na hora, sem token. A verdade é sempre a do servidor: /api/me é consultado uma vez por carregamento (loadMe).

import { ROOMS_ENABLED } from "./features";
import type { GameMode } from "./game";

export type Me = { id: string; handle: string | null; name: string | null; image: string | null; /** sem @, provisório do login, escolhido (resta uma troca) ou definitivo */ handleState?: "none" | "auto" | "chosen" | "final"; created_at?: string; /** mascarado ("g••••@gmail.com"); null até o próximo login */ email?: string | null };
export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: string; body?: Record<string, unknown> | null };

const FLAG = "aknewme.account";
export const ACCOUNT_EVENT = "aknewme:account";

/** Campos públicos da conta guardados no navegador (sem token nem e-mail). */
export type CachedAccount = { id: string | null; name: string | null; handle: string | null; image: string | null };
const str = (v: unknown) => (typeof v === "string" ? v : null);

export function savedAccount(): CachedAccount | null {
  try {
    const v = JSON.parse(localStorage.getItem(FLAG) ?? "null");
    return v && typeof v === "object" ? { id: str(v.id), name: str(v.name), handle: str(v.handle), image: str(v.image) } : null;
  } catch {
    return null;
  }
}

let mePromise: Promise<ApiResult<Me>> | null = null;

/**
 * Atualiza o cache (junta com o que já havia: trocar o @ manda só o handle) e avisa a página (ACCOUNT_EVENT).
 * null apaga tudo: sair, excluir a conta ou 401.
 */
export function rememberAccount(me: Partial<CachedAccount> | null) {
  try {
    if (me) {
      const next = { ...(savedAccount() ?? { id: null, name: null, handle: null, image: null }) };
      for (const k of ["id", "name", "handle", "image"] as const) if (k in me) next[k] = me[k] ?? null;
      localStorage.setItem(FLAG, JSON.stringify(next));
      // a resposta de /api/me já carregada também passa a ter o @ novo
      const patch = me;
      if (mePromise) mePromise = mePromise.then((r) => (r.ok ? { ...r, data: { ...r.data, ...("handle" in patch && { handle: patch.handle ?? null }) } } : r));
    } else {
      localStorage.removeItem(FLAG);
      mePromise = null;
    }
    window.dispatchEvent(new Event(ACCOUNT_EVENT));
  } catch {}
}

/**
 * Apaga o cache sem avisar a página (sem ACCOUNT_EVENT): ao sair ou excluir a conta a página vai ser trocada logo em
 * seguida, e avisar faria o cabeçalho perder o perfil antes da navegação (o "pulo" da 09-menu-perfil.md).
 */
export function forgetAccountQuietly() {
  try {
    localStorage.removeItem(FLAG);
  } catch {}
  mePromise = null;
}

/** /api/me uma vez por carregamento de página (as telas e o cabeçalho dividem a mesma resposta). */
export function loadMe(): Promise<ApiResult<Me>> {
  mePromise ??= api<Me>("/api/me").then((r) => {
    if (r.ok) rememberAccount({ id: r.data.id, name: r.data.name, handle: r.data.handle, image: r.data.image });
    return r;
  });
  return mePromise;
}

/** Chamada às rotas de conta. Sem rede: status 0, erro "offline". 401 apaga a marca de "entrou". */
export async function api<T = unknown>(path: string, method = "GET", body?: unknown): Promise<ApiResult<T>> {
  try {
    const r = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    if (r.status === 401) rememberAccount(null);
    const data = r.status === 204 ? null : await r.json().catch(() => null);
    if (r.ok) return { ok: true, status: r.status, data: data as T };
    return { ok: false, status: r.status, error: (data as { error?: string } | null)?.error ?? "server_error", body: data as Record<string, unknown> | null };
  } catch {
    return { ok: false, status: 0, error: "offline" };
  }
}

/** Destino depois do login: só caminhos deste site ("/x"), nunca outro domínio ("//x", "https://..."). */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}

/** Nomes dos modos nas telas novas (como o MODE_LABEL). */
export const MODE_NAME: Record<GameMode, string> = { emoji: "Emoji", opening: "Opening", pistas: "Pistas" };

// Sala em que o jogador está em cada modo hoje: o fim de jogo mostra "Voltar para a sala".
const roomKey = (mode: GameMode) => `aknewme.room.${mode}`;
export function activeRoom(mode: GameMode, day: number): string | null {
  if (!ROOMS_ENABLED) return null; // salas desligadas (13-escopo-lancamento.md)
  try {
    const v = JSON.parse(localStorage.getItem(roomKey(mode)) ?? "null");
    return v?.day === day && typeof v.id === "string" ? v.id : null;
  } catch {
    return null;
  }
}
export function setActiveRoom(mode: GameMode, day: number, id: string) {
  try {
    localStorage.setItem(roomKey(mode), JSON.stringify({ day, id }));
  } catch {}
}
