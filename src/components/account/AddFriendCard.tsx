"use client";

import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { api } from "@/lib/account";
import { LIME_DARKEN } from "../buttons";
import { Icon } from "../icons";
import { Spinner } from "./ui";

/** Mensagens dos erros de /api/friends (também usadas pelo painel para "sem conexão"). */
export const ADD_ERROR: Record<string, string> = {
  not_found: "Nenhum jogador tem esse usuário.",
  invalid: "O usuário tem de 3 a 20 caracteres: letras minúsculas, números ou _.",
  self: "Esse é o seu próprio usuário.",
  already_friends: "Vocês já são amigos.",
  they_asked_you: "Essa pessoa já te mandou um pedido. Aceite na lista de pedidos.",
  too_many_pending: "Você tem pedidos pendentes demais. Espere algumas respostas.",
  rate_limited: "Muitas tentativas. Espere um minuto e tente de novo.",
  offline: "Sem conexão. Nada foi perdido: tente de novo.",
};
/** Tempo do botão verde (enviado) ou vermelho (erro) antes de voltar ao normal */
const RESULT_MS = 2500;
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";

/**
 * Cartão "Adicionar amigo" de /friends (specs/login-duelo/10-amigos.md): o "@" fixo, o campo e o botão "Enviar".
 * O botão: hover/foco no lime que escurece (LIME_DARKEN); enviando, só o spinner, na mesma largura; enviado, fica verde
 * (lime-deep) com um check, o campo limpa e não há mensagem embaixo; erro, fica vermelho (danger) com um X e a explicação
 * curta embaixo do campo. Os dois voltam ao normal em 2,5 s. Leitor de tela: "Pedido enviado" ou o erro (aria-live).
 * `onSent`: recarrega as listas (o pedido entra em "Pedidos enviados").
 */
export default function AddFriendCard({ myHandle, onSent }: { myHandle: string | null; onSent: () => void }) {
  const [handle, setHandle] = useState("");
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  // verde/vermelho por 2,5 s; a explicação do erro some junto
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), RESULT_MS);
    return () => clearTimeout(t);
  }, [result]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const h = handle.trim().replace(/^@/, "").toLowerCase();
    if (!h || adding) return;
    setAdding(true);
    setResult(null);
    const r = await api("/api/friends", "POST", { handle: h });
    setAdding(false);
    if (r.ok) {
      setHandle("");
      setResult({ ok: true, text: "Pedido enviado" });
      onSent();
    } else setResult({ ok: false, text: ADD_ERROR[r.status === 429 ? "rate_limited" : r.error] ?? ADD_ERROR.offline });
  }

  const look = result
    ? result.ok
      ? "bg-lime-deep text-ink" // enviado (o projeto não tem token de "sucesso": lime-deep)
      : "bg-danger text-white"
    : `${LIME_DARKEN} disabled:bg-track disabled:text-muted disabled:[background-image:none]`;

  return (
    <section aria-labelledby="add-title" className="rounded-3xl bg-grape p-5 text-white">
      <h2 id="add-title" className="font-display text-xl font-extrabold">
        Adicionar amigo
      </h2>
      <form onSubmit={add} noValidate className="mt-3">
        <div className="flex items-center gap-1.5 rounded-2xl bg-paper p-1.5 pl-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-lime">
          <span aria-hidden="true" className="font-bold text-grape">
            @
          </span>
          <input
            aria-label="Usuário do amigo"
            aria-describedby={result && !result.ok ? "add-error" : undefined}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            maxLength={21}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-2 font-bold text-ink outline-none placeholder:font-semibold placeholder:text-muted"
          />
          <button
            type="submit"
            // enviando ou mostrando o resultado, o botão não recebe outro envio; vazio, fica desligado
            disabled={!adding && !result && !handle.trim()}
            aria-disabled={adding || !!result}
            aria-busy={adding}
            aria-label={adding ? "Enviando" : result ? (result.ok ? "Pedido enviado" : "Não enviado") : undefined}
            className={`relative grid min-h-10 place-items-center rounded-xl px-4 text-sm font-bold ${look} ${FOCUS}`}
          >
            {/* o texto segura a largura; spinner e ícones vêm por cima, no centro (o botão não muda de tamanho) */}
            <span className={adding || result ? "invisible" : ""}>Enviar</span>
            {(adding || result) && (
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                {adding ? <Spinner /> : <Icon icon={result!.ok ? faCheck : faXmark} className="text-base" />}
              </span>
            )}
          </button>
        </div>
      </form>
      {/* só o erro tem explicação embaixo (sem ela não dá para saber o que corrigir); some junto com o vermelho */}
      {result && !result.ok && (
        <p id="add-error" className="mt-3 rounded-xl bg-paper px-3 py-2 text-sm font-bold text-danger">
          {result.text}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {result ? result.text : ""}
      </p>
      <p className="mt-3 text-sm text-on-grape">
        Seu usuário é <strong className="text-white">@{myHandle}</strong>. Passe para quem quiser te adicionar.
      </p>
    </section>
  );
}
