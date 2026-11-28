// Identificador (handle, o "@") do jogador: é com ele que os amigos se encontram (specs/login-duelo, R5).
// Mesma regra no formulário e no servidor (o servidor nunca confia só no formulário).
import { isOffensive } from "./handleFilter";

export const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
export const RESERVED_HANDLES = new Set(["admin", "aknewme", "suporte"]);

/**
 * Troca do @ (01-requisitos.md, R5b): UMA troca por conta, para sempre. Não contam o @ automático do login (que é
 * provisório) nem a primeira escolha feita pela pessoa. Depois da troca o @ fica fixo: só o suporte muda.
 * A regra fica só aqui: o servidor (handleChange.ts) e os textos das telas usam estes valores.
 */
export const MAX_HANDLE_CHANGES = 1;
/** Dias em que o @ antigo fica guardado para a mesma conta depois de uma troca (R5a). */
export const HANDLE_HOLD_DAYS = 30;

/**
 * Em que ponto a conta está (R5b):
 * - "none": sem @ ainda; "auto": @ provisório, criado no login → a próxima escolha é livre (não conta);
 * - "chosen": @ escolhido pela pessoa → resta uma troca; "final": já trocou → @ definitivo.
 */
export type HandleState = "none" | "auto" | "chosen" | "final";

/** Textos da regra, os mesmos em todas as telas (R5c). */
export const HANDLE_TEXT = {
  /** escolha livre (sem @ ou saindo do automático) */
  free: "Escolha com calma: depois disso, você só pode trocar uma vez.",
  /** a única troca */
  once: "Você só pode trocar seu username uma vez.",
  confirm: (next: string) => `Trocar para @${next}? Não dá para mudar depois.`,
  offensive: "Esse username não é permitido. Escolha outro.",
} as const;

export type HandleProblem = "invalid" | "reserved" | "offensive";

/** O que há de errado com o handle, ou null se vale: formato, nomes reservados e termos ofensivos (R5f). */
export function handleProblem(h: string): HandleProblem | null {
  if (!HANDLE_RE.test(h)) return "invalid";
  if (RESERVED_HANDLES.has(h)) return "reserved";
  return isOffensive(h) ? "offensive" : null;
}
