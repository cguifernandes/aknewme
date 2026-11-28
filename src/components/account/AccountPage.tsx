"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ACCOUNT_EVENT, loadMe, savedAccount, type Me } from "@/lib/account";
import Loading from "../Loading";
import { DeleteAccount, SignOutButton } from "./AccountActions";
import { openProfileEdit } from "./profileEdit";
import { Alert, BTN_SMALL, LINK, ProfileAvatar } from "./ui";

/**
 * Página da conta (/account, specs/login-duelo/08-conta.md): cartão com foto, nome e @; "Seu @" com Trocar (ou
 * Escolher meu @), que abre a janela Meu perfil já editando (09-menu-perfil.md); Sair da conta; Excluir conta;
 * link da Política de privacidade. Sem conta: /login?next=/account.
 */
export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadMe().then((r) => {
      if (!r.ok && r.status === 401) return router.replace("/login?next=/account");
      if (!r.ok) return setError(true);
      setMe(r.data);
    });
  }, [router]);

  // o @ salvo na janela Meu perfil chega pelo cache da conta
  useEffect(() => {
    const sync = () => {
      const handle = savedAccount()?.handle;
      if (handle) setMe((m) => (m && m.handle !== handle ? { ...m, handle } : m));
    };
    window.addEventListener(ACCOUNT_EVENT, sync);
    return () => window.removeEventListener(ACCOUNT_EVENT, sync);
  }, []);

  if (error)
    return (
      <main className="mx-auto mt-6 w-full max-w-xl pb-12">
        <Alert>Não deu para carregar sua conta. Confira sua conexão e recarregue a página.</Alert>
      </main>
    );
  if (!me) return <Loading />;

  const SECTION = "mt-6 rounded-3xl border-2 border-track p-5";
  return (
    <main className="mx-auto mt-6 w-full max-w-xl animate-enter pb-12">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">Sua conta</h1>

      <section className="mt-6 flex items-center gap-4 rounded-3xl bg-track p-5" aria-label="Perfil">
        <ProfileAvatar image={me.image} name={me.name} size={64} className="text-xl" />
        <div className="min-w-0">
          <p className="truncate font-display text-2xl font-extrabold text-ink">{me.name ?? "Você"}</p>
          {me.handle ? <p className="truncate font-bold text-grape">@{me.handle}</p> : <p className="text-muted">sem username ainda</p>}
        </div>
      </section>

      <section className={SECTION} aria-labelledby="handle-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="handle-title" className="font-display text-xl font-extrabold text-ink">
              Seu username
            </h2>
            <p className="text-muted">{me.handle ? `@${me.handle}` : "Você ainda não escolheu um username."}</p>
          </div>
          {/* depois da única troca: só o @, sem botão e sem selo (01-requisitos.md, R5c) */}
          {me.handleState !== "final" && (
            <button type="button" onClick={openProfileEdit} className={`${BTN_SMALL} border-ink text-ink hover:bg-track`}>
              {me.handle ? "Trocar" : "Escolher username"}
            </button>
          )}
        </div>
      </section>

      <section className={SECTION} aria-labelledby="session-title">
        <h2 id="session-title" className="font-display text-xl font-extrabold text-ink">
          Sessão
        </h2>
        <p className="mt-1 text-sm text-muted">Ao sair, seus amigos continuam guardados.</p>
        <div className="mt-3">
          <SignOutButton redirectTo="/" />
        </div>
      </section>

      <section className={SECTION} aria-labelledby="delete-section-title">
        <h2 id="delete-section-title" className="font-display text-xl font-extrabold text-ink">
          Excluir conta
        </h2>
        <p className="mt-1 mb-3 text-sm text-muted">Apaga sua conta, seus amigos e seu username. Pede confirmação antes.</p>
        <DeleteAccount />
      </section>

      <p className="mt-6 text-sm">
        <Link href="/privacy" className={LINK}>
          Política de privacidade
        </Link>
      </p>
    </main>
  );
}
