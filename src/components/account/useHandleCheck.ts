"use client";

import { useEffect, useRef, useState } from "react";
import { api, type Me } from "@/lib/account";
import { HANDLE_TEXT, type HandleState } from "@/lib/handle";
import type { DotState } from "./HandleDot";

// Verificação ao vivo e gravação do @ (specs/login-duelo/06-usuario.md): a mesma no passo 2 do login (HandleStep)
// e na edição dentro da janela Meu perfil (09-menu-perfil.md). A verificação de verdade é a do servidor.

export type HandleStatus = "available" | "taken" | "held" | "invalid" | "reserved" | "offensive";
export type Suggestion = { candidate: string | null; status: HandleStatus | null; alternatives: string[] };
type Check = "idle" | "checking" | HandleStatus;
type Failure = "offline" | "rate_limited" | "final" | null;

export const HANDLE_FAILURE: Record<Exclude<Failure, null>, string> = {
  offline: "Sem conexão. Nada foi perdido: tente de novo.",
  rate_limited: "Muitas tentativas. Espere um minuto e tente de novo.",
  final: "Você já usou sua troca de usuário. Agora só o suporte pode mudar.",
};
export const HANDLE_MAX = 20;
export const HANDLE_FORMAT = "Use de 3 a 20 letras minúsculas, números ou _.";
/** Só o que o @ aceita: minúsculas, números e _ (o resto some enquanto digita). */
export const cleanHandle = (v: string) => v.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, HANDLE_MAX);

export function useHandleCheck(me: Pick<Me, "handle">, initial?: Suggestion | null) {
  const [value, setValue] = useState(initial?.candidate ?? me.handle ?? "");
  const [check, setCheck] = useState<Check>(initial?.status ?? (me.handle ? "available" : "idle"));
  const [alts, setAlts] = useState<string[]>(initial?.alternatives ?? []);
  const [failure, setFailure] = useState<Failure>(null);
  const [saving, setSaving] = useState(false);
  const seq = useRef(0);
  const first = useRef(true);

  // 400 ms depois de parar de digitar (a 1ª vez já veio pronta do servidor)
  useEffect(() => {
    if (first.current && initial) {
      first.current = false;
      return;
    }
    first.current = false;
    setFailure(null);
    if (value.length < 3) {
      setAlts([]);
      return setCheck("idle");
    }
    if (value === me.handle) return setCheck("available");
    setCheck("checking");
    const id = ++seq.current;
    const t = setTimeout(async () => {
      const r = await api<{ status: HandleStatus; alternatives?: string[] }>(`/api/me/handle?h=${encodeURIComponent(value)}`);
      if (id !== seq.current) return; // chegou depois de outra digitação
      if (!r.ok) {
        setFailure(r.status === 429 ? "rate_limited" : "offline");
        return setCheck("idle");
      }
      setCheck(r.data.status);
      setAlts(r.data.alternatives ?? []);
    }, 400);
    return () => clearTimeout(t);
  }, [value, me.handle, initial]);

  /** Grava o @ (POST /api/me/handle). Devolve o @ salvo e o novo estado da conta, ou null (o motivo fica em `check`/`failure`). */
  async function save(): Promise<{ handle: string; state?: HandleState } | null> {
    if (check !== "available" || saving) return null;
    if (value === me.handle) return { handle: value };
    setSaving(true);
    setFailure(null);
    const r = await api<{ handle: string; state: HandleState }>("/api/me/handle", "POST", { handle: value });
    setSaving(false);
    if (r.ok) return r.data;
    if (r.status === 409 && r.error === "handle_final") setFailure("final");
    else if (r.status === 409) setCheck(r.error === "held" ? "held" : "taken");
    else if (r.status === 400) setCheck(r.error === "reserved" || r.error === "offensive" ? r.error : "invalid");
    else setFailure(r.status === 429 ? "rate_limited" : "offline");
    return null;
  }

  /** Em uso, guardado, reservado ou não permitido: a bolinha fica com o X. */
  const busy = check === "taken" || check === "held" || check === "reserved" || check === "offensive";
  const free = check === "available" && value.length >= 3;
  /** Estado da bolinha do campo (HandleDot). */
  const dot: DotState = check === "checking" ? "checking" : free ? "free" : busy ? "busy" : "empty";
  const dotLabel = check === "checking" ? "Verificando" : free ? "Disponível" : check === "offensive" ? "Não permitido" : check === "reserved" ? "Reservado" : busy ? "Já tem dono" : "";
  /** A explicação da linha de baixo do campo, só quando há o que dizer (null = nada). */
  const note = failure
    ? HANDLE_FAILURE[failure]
    : check === "offensive"
      ? HANDLE_TEXT.offensive
      : check === "invalid"
        ? HANDLE_FORMAT
        : busy
          ? `${check === "reserved" ? "Esse é reservado." : "Esse já foi."} ${alts.length ? "Tenta um desses:" : "Tenta outro."}`
          : null;
  return { value, setValue: (v: string) => setValue(cleanHandle(v)), check, alts, failure, saving, save, busy, free, dot, dotLabel, note };
}
