"use client";

import { faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { useRef, useState } from "react";
import { api } from "@/lib/account";
import { ROOMS_ENABLED } from "@/lib/features";
import { closeOnBackdrop } from "@/lib/dialog";
import { Icon } from "../icons";
import { useAccount } from "./AccountProvider";
import { leaveAccount } from "./leave";
import { Alert, BTN_SMALL, FOCUS, Spinner } from "./ui";

/** Pílula (totalmente arredondada) dos botões do cartão Conta e do diálogo de excluir; o fundo vem de quem usa. */
const PILL_BASE = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 px-4 text-sm font-bold disabled:opacity-60 ${FOCUS}`;
/** Pílula de contorno (fundo paper), com o sweep do projeto. */
const PILL = `${PILL_BASE} bg-paper`;

/**
 * "Sair da conta" (mantém os dados: R3), em danger com ícone, sem confirmação (08-conta.md). Volta para `redirectTo`.
 * `plain`: pílula com contorno ink e sweep, ao lado do "Excluir conta" (janela Meu perfil, 09-menu-perfil.md). Sai sem "pulo" (leave.ts).
 */
export function SignOutButton({ redirectTo = "/", plain = false, wide = false }: { redirectTo?: string; plain?: boolean; wide?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={async () => {
        setBusy(true);
        await leaveAccount(redirectTo);
      }}
      // plain: contorno ink com o sweep do projeto (a cor entra da esquerda; texto branco sobre ink)
      className={`${plain ? `${PILL} border-ink text-ink sweep-ink not-disabled:hover:text-white not-disabled:focus-visible:text-white` : `${BTN_SMALL} gap-2 border-danger text-danger hover:bg-track`} ${wide ? "w-full" : ""}`}
    >
      {busy ? <Spinner /> : !plain && <Icon icon={faArrowRightFromBracket} />} Sair da conta
    </button>
  );
}

/**
 * "Excluir conta" (R4, LGPD) e o diálogo "Excluir sua conta?" (09-menu-perfil.md, "Modal Excluir sua conta?"): a lista só
 * do que o servidor apaga (o usuário e, em cascata, logins, e-mail, amizades e pedidos, vitórias dos duelos, salas,
 * participações, notificações e a reserva do @). A sequência e as estatísticas ficam no localStorage, que a exclusão não
 * toca (leaveAccount só tira a marca da conta). Sem campo "digite excluir". Enquanto exclui: spinner e botões desativados,
 * Esc e clique fora não fecham. Depois sai e vai para a home sem "pulo" (leaveAccount).
 * `soft`: pílula com contorno danger e sweep, no cartão Conta da janela Meu perfil.
 */
export function DeleteAccount({ soft = false, className = "" }: { soft?: boolean; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const me = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function open() {
    setError("");
    ref.current?.showModal();
  }

  async function remove() {
    setBusy(true);
    setError("");
    const r = await api("/api/me", "DELETE");
    if (!r.ok && r.status !== 401) {
      setBusy(false);
      return setError(r.status === 0 ? "Sem conexão. Sua conta não foi excluída: tente de novo." : "Não deu para excluir sua conta. Tente de novo.");
    }
    await leaveAccount("/");
  }

  const items = [
    // sem as salas (13-escopo-lancamento.md): só amigos, pedidos e notificações
    ...(ROOMS_ENABLED
      ? ["Seus amigos, pedidos de amizade e o placar dos duelos.", "Suas salas de duelo e as notificações."]
      : ["Seus amigos e os pedidos de amizade.", "As notificações."]),
    "Seu login com Google ou Discord e o e-mail guardado.",
    // o @ de verdade (vem da conta); sem @ ainda, o item não aparece
    ...(me?.handle ? [`O @${me.handle}, que fica livre para outra pessoa.`] : []),
  ];

  return (
    <div className={className}>
      <button type="button" onClick={open} className={soft ? `${PILL} w-full border-danger text-danger sweep-danger not-disabled:hover:text-white not-disabled:focus-visible:text-white` : `${BTN_SMALL} border-danger text-danger hover:bg-track`}>
        Excluir conta
      </button>
      <dialog
        ref={ref}
        aria-labelledby="delete-title"
        aria-describedby="delete-what"
        // enquanto exclui, Esc e clique fora não cancelam
        onCancel={(e) => busy && e.preventDefault()}
        onClick={(e) => !busy && closeOnBackdrop(e)}
        className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-3xl bg-white p-6 text-ink shadow-pop-lg backdrop:bg-ink/60 sm:p-7"
      >
        <h2 id="delete-title" className="font-display text-3xl font-extrabold tracking-tight">
          Excluir sua conta?
        </h2>
        <p id="delete-what" className="mt-3 text-sm text-muted">
          Isso apaga para sempre:
        </p>
        <ul className="mt-2 list-disc space-y-1 rounded-2xl bg-blush/20 py-3 pr-4 pl-8 text-sm font-semibold marker:text-danger">
          {items.map((t) => (
            <li key={t} className="break-words">
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">A sequência e as estatísticas deste aparelho continuam aqui, sem conta.</p>
        {error && <Alert>{error}</Alert>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            disabled={busy}
            className={`${PILL} border-ink text-ink sweep-ink not-disabled:hover:text-white not-disabled:focus-visible:text-white`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            aria-busy={busy}
            className={`${PILL_BASE} border-danger bg-danger text-white transition-colors not-disabled:hover:border-danger-deep not-disabled:hover:bg-danger-deep`}
          >
            {busy && <Spinner />} Excluir para sempre
          </button>
        </div>
      </dialog>
    </div>
  );
}
