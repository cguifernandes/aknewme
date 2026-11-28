"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { loadMe, rememberAccount, type Me } from "@/lib/account";
import { closeOnBackdrop } from "@/lib/dialog";
import type { HandleState } from "@/lib/handle";
import { DeleteAccount, SignOutButton } from "./account/AccountActions";
import { useAccount } from "./account/AccountProvider";
import InlineHandle from "./account/InlineHandle";
import { PROFILE_EDIT_EVENT, takeProfileEdit } from "./account/profileEdit";
import { LINK, ProfileAvatar } from "./account/ui";
import CloseButton from "./CloseButton";
import type { DialogHandle } from "./HowToPlay";
import StatsTabs from "./StatsTabs";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const ROW = "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3";

/** "26 de novembro de 2026", no fuso de Brasília. */
const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

/**
 * Janela "Meu perfil" (specs/login-duelo/09-menu-perfil.md, terceira rodada), aberta pelo bloco do perfil no Menu
 * (`ref.open()`) ou já editando o @ (openProfileEdit: é o único lugar de trocar o @ depois do login). <dialog> nativo:
 * foco preso, Esc fecha e o foco volta ao Menu. Cartão grape (foto, nome, @ com "Editar" no mesmo lugar, desde quando
 * joga, Adicionar amigos), "Estatísticas" (o mesmo conteúdo do diálogo de Estatísticas, StatsTabs: com
 * conta ele fica aqui, na versão compacta, e sai do Menu) e "Conta" (e-mail mascarado, @, privacidade, sair e excluir).
 */
export default function ProfileDialog({ ref: handle }: { ref?: React.Ref<DialogHandle> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const cached = useAccount();
  const path = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [editing, setEditing] = useState(false);
  /** Quantas vezes a janela abriu: as estatísticas só montam com ela aberta e releem o navegador a cada abertura. */
  const [opened, setOpened] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  function show(edit = false) {
    setEditing(edit);
    if (!ref.current?.open) {
      setOpened((n) => n + 1);
      setIsOpen(true);
      ref.current?.showModal();
    }
    void loadMe().then((r) => r.ok && setMe(r.data));
  }
  useImperativeHandle(handle, () => ({ open: () => show() }));

  // pedido de "abrir já editando" (toast do @, /account, Amigos, criar sala), também o feito antes de a janela montar
  useEffect(() => {
    const onEdit = () => takeProfileEdit() && show(true);
    onEdit();
    window.addEventListener(PROFILE_EDIT_EVENT, onEdit);
    return () => window.removeEventListener(PROFILE_EDIT_EVENT, onEdit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = me?.name ?? cached?.name ?? null;
  const image = me?.image ?? cached?.image ?? null;
  const userHandle = me?.handle ?? cached?.handle ?? null;
  // regra do @ (01-requisitos.md, R5b): sem @ ou provisório = escolha livre; escolhido = resta uma troca; definitivo =
  // sem "Editar". Até o /api/me responder não dá para saber, então a edição espera por ele.
  const handleState: HandleState | null = me ? (me.handleState ?? (me.handle ? "chosen" : "none")) : null;
  const isFinal = handleState === "final";
  const close = () => ref.current?.close(); // fecha antes de navegar: o <dialog> fica no cabeçalho, que não desmonta

  function edit() {
    setEditing(true);
    ref.current?.scrollTo({ top: 0, behavior: "smooth" });
  }
  function doneEditing(saved?: string, state?: HandleState) {
    if (saved) {
      rememberAccount({ handle: saved }); // cabeçalho, telas abertas e /api/me já carregado passam a ter o @ novo
      setMe((m) => (m ? { ...m, handle: saved, handleState: state ?? m.handleState } : m));
    }
    setEditing(false);
    requestAnimationFrame(() => editButton.current?.focus());
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="profile-title"
      onClick={closeOnBackdrop}
      onClose={(e) => {
        // o React faz o "close" de um <dialog> de dentro (o "Excluir sua conta?") subir até aqui: sem esta conferência,
        // fechar aquele diálogo marcava esta janela como fechada e as estatísticas sumiam com ela ainda aberta
        if (e.target !== e.currentTarget) return;
        setEditing(false); // fechar a janela desfaz a edição
        setIsOpen(false);
      }}
      className="m-auto max-h-[90dvh] w-[min(64rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-paper p-4 text-ink shadow-pop-lg backdrop:bg-ink/60 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="profile-title" className="font-display text-2xl font-extrabold">
          Meu perfil
        </h2>
        <CloseButton onClick={close} />
      </div>

      {/* cartão grape, sem sombra: foto com anel, nome, @ (vira campo no mesmo lugar), desde quando joga, Adicionar amigos */}
      <section aria-label="Seu perfil" className="relative mt-4 overflow-hidden rounded-3xl bg-grape p-5 text-white sm:p-6">
        <span aria-hidden="true" className="pointer-events-none absolute -top-4 right-4 font-kana text-8xl leading-none font-extrabold text-white/10 select-none">
          選手
        </span>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* no celular a foto fica em cima: o nome e o @ (e o campo, ao editar) ganham a largura toda do cartão */}
          <div className="flex min-w-0 flex-1 items-center gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-3">
            <ProfileAvatar image={image} name={name ?? userHandle} size={88} className="text-3xl ring-4 ring-white max-sm:!size-16 max-sm:text-2xl" />
            <div className="w-full min-w-0 flex-1">
              <p className="font-display text-2xl leading-tight font-extrabold break-words sm:text-3xl">{name ?? "Você"}</p>
              {editing && handleState && !isFinal ? (
                <InlineHandle handle={userHandle} state={handleState} onSaved={doneEditing} onCancel={() => doneEditing()} />
              ) : (
                <p className="mt-1 flex flex-wrap items-center gap-2">
                  {userHandle ? <span className="font-bold break-all text-lime">@{userHandle}</span> : <span className="text-on-grape">sem username ainda</span>}
                  {/* depois da única troca: só o @, sem "Editar" e sem selo (01-requisitos.md, R5c) */}
                  {!isFinal && (
                    <button
                      ref={editButton}
                      type="button"
                      onClick={edit}
                      aria-label={userHandle ? "Editar seu username" : "Escolher seu username"}
                      className={`min-h-8 rounded-full bg-white/15 px-3 text-xs font-bold text-white sweep-lime hover:text-ink focus-visible:text-ink ${FOCUS}`}
                    >
                      {userHandle ? "Editar" : "Escolher username"}
                    </button>
                  )}
                </p>
              )}
              {me?.created_at && <p className="mt-2 text-sm font-semibold text-on-grape">Jogando desde {longDate(me.created_at)}</p>}
            </div>
          </div>
          <Link
            href="/friends"
            onClick={close}
            className={`flex min-h-11 shrink-0 items-center justify-center rounded-full bg-lime px-5 font-bold text-ink shadow-pop sweep-lime-deep ${FOCUS}`}
          >
            Adicionar amigos
          </Link>
        </div>
      </section>

      {/* estatísticas compactas (abas por modo, sem a distribuição) e Conta lado a lado; no celular, uma embaixo da outra */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="profile-stats-title" className="min-w-0 rounded-3xl border-2 border-track p-5">
          {isOpen && (
            <StatsTabs
              key={opened}
              id="profile-stats"
              compact
              title={
                <h3 id="profile-stats-title" className="font-display text-xl font-extrabold">
                  Estatísticas
                </h3>
              }
            />
          )}
        </section>
        <section aria-labelledby="profile-account" className="min-w-0 rounded-3xl border-2 border-track p-5">
          <h3 id="profile-account" className="font-display text-xl font-extrabold">
            Conta
          </h3>
          <dl className="mt-2 divide-y-2 divide-track text-sm">
            {/* só a versão mascarada chega aqui; sem edição (vem do Google ou do Discord). Conta sem e-mail gravado
                (entrou antes de o e-mail ser guardado): a linha não aparece */}
            {me?.email && (
              <div className={ROW}>
                <dt className="font-semibold text-muted">E-mail</dt>
                <dd className="min-w-0 text-right font-bold break-all">{me.email}</dd>
              </div>
            )}
            <div className={ROW}>
              <dt className="font-semibold text-muted">Username</dt>
              {/* a edição fica só no "Editar" do cartão roxo; sem @ ainda, o atalho para escolher */}
              <dd className="min-w-0 text-right">
                {userHandle ? (
                  <span className="font-bold break-all">@{userHandle}</span>
                ) : (
                  <button type="button" onClick={edit} className={LINK}>
                    escolher
                  </button>
                )}
              </dd>
            </div>
            {/* rótulo e links numa linha só, como as outras: "Política de privacidade" não cabia ao lado do rótulo no
                cartão de 20rem e caía para a linha de baixo; com "Legal" + "Privacidade" cabe em 1280 e em 375 */}
            <div className={`${ROW} flex-nowrap`}>
              <dt className="font-semibold text-muted">Legal</dt>
              <dd className="ml-auto flex justify-end gap-x-3 text-right whitespace-nowrap">
                <Link href="/privacy" onClick={close} aria-label="Política de privacidade" className={LINK}>
                  Privacidade
                </Link>
                <Link href="/terms" onClick={close} className={LINK}>
                  Termos
                </Link>
              </dd>
            </div>
          </dl>
          {/* as duas pílulas dividem a linha (50% cada); "Excluir conta" abre o diálogo de confirmação */}
          <div className="grid grid-cols-2 items-start gap-2 pt-4">
            <SignOutButton redirectTo={path} plain wide />
            <DeleteAccount soft className="min-w-0" />
          </div>
        </section>
      </div>
    </dialog>
  );
}
