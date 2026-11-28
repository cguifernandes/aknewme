"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  loadMe,
  rememberAccount,
  type Me,
} from "@/lib/account";
import AddFriendCard, { ADD_ERROR } from "./AddFriendCard";
import ChallengeDialog from "./ChallengeDialog";
import DuelNotices from "./DuelNotices";
import Loading from "../Loading";
import EmptyFriends from "./EmptyFriends";
import FriendRow, { type FriendItem } from "./FriendRow";
import IncomingRequests, {
  LOADING_BOX,
  PER_PAGE,
  type Person,
  type Request,
} from "./IncomingRequests";
import Pagination, { usePage } from "../Pagination";
import NeedHandle from "./NeedHandle";
import { useReadOnArrival } from "./Notifications";
import {
  notificationAction,
  NOTIFY_EVENT,
  notifyState,
  type NotificationItem,
} from "@/lib/notify";
import { Alert, LINK, ProfileAvatar, Spinner } from "./ui";

/** O que vem do servidor (na 1ª carga, pela página; depois, por /api/friends): só a página de cada lista (10) e os totais (paginação no banco, 14-duelos-na-conta-e-paginacao.md) */
export type Lists = {
  friends: FriendItem[];
  friendsTotal: number;
  friendsPage: number;
  incoming: Request[];
  incomingCount: number;
  incomingPage: number;
  outgoing: Person[];
  outgoingTotal: number;
  outgoingPage: number;
};
type Page<T> = { items: T[]; total: number; page: number };

const CARD = "rounded-3xl border-2 border-track bg-paper";
/** Notificações que levam a esta tela (pedido, aceite): ao abrir /friends, contam como lidas. */
const toFriends = (n: NotificationItem) =>
  notificationAction(n).href === "/friends";
const SECTION_TITLE = "text-xs font-bold tracking-wider uppercase";

/**
 * Tela de amigos (specs/login-duelo/10-amigos.md e 13-escopo-lancamento.md): à esquerda, os pedidos recebidos e a lista
 * com "Desafiar" (a janela de desafio por link do fim de jogo, ChallengeDialog); à direita, o cartão "Adicionar amigo".
 * No celular é uma coluna, com "Adicionar amigo" logo abaixo do título.
 */
export default function FriendsPanel({ initial }: { initial?: { me: Me; lists: Lists | null } }) {
  const router = useRouter();
  // primeira carga feita no servidor (app/friends/page.tsx): a tela já abre com a conta e as listas, sem "Carregando..."
  const [me, setMe] = useState<Me | null>(initial?.me.handle ? initial.me : null);
  const [lists, setLists] = useState<Lists | null>(initial?.lists ?? null);
  const [error, setError] = useState("");
  const [needHandle, setNeedHandle] = useState(!!initial && !initial.me.handle);
  /** A 1ª vez usa o que veio do servidor; depois (ex.: "Escolher username" pronto), busca no navegador como antes */
  const fromServer = useRef(!!initial);
  /** Amigo da janela de desafio aberta */
  const [challenging, setChallenging] = useState<FriendItem | null>(null);
  /** Pedido sendo respondido ou cancelado (id da pessoa): spinner no botão e os da linha desativados */
  const [acting, setActing] = useState<string | null>(null);
  /** Páginas dos amigos e dos pedidos enviados (10 por página; o servidor devolve só a página pedida) */
  const [friendsPage, setFriendsPage, friendsPages] = usePage(
    lists?.friendsTotal ?? 0,
    PER_PAGE,
  );
  const [outPage, setOutPage, outPages] = usePage(
    lists?.outgoingTotal ?? 0,
    PER_PAGE,
  );
  /** Trocando de página: Loading só na lista */
  const [paging, setPaging] = useState<"friends" | "outgoing" | null>(null);
  /** a página de pedidos recebidos que a seção mostra: a recarga das listas pede a mesma */
  const inPage = useRef(1);
  const pagesRef = useRef({ fp: 1, op: 1 });
  pagesRef.current = { fp: friendsPage, op: outPage };
  const onIncomingPage = useCallback((p: number) => {
    inPage.current = p;
  }, []);
  /** a página de pedidos que veio com as listas (nova a cada recarga) */
  const incomingInitial = useMemo(() => ({ items: lists?.incoming ?? [], page: lists?.incomingPage ?? 1 }), [lists]);
  useReadOnArrival(toFriends);

  const load = useCallback(async () => {
    // a página atual de cada lista (depois de aceitar/remover/cancelar, a mesma página vem de novo, já atualizada)
    const { fp, op } = pagesRef.current;
    const f = await api<Lists>(`/api/friends?fp=${fp}&op=${op}&ip=${inPage.current}`);
    if (f.ok) setLists(f.data);
    else
      setError(
        f.status === 0
          ? "Sem conexão. Recarregue a página para tentar de novo."
          : "Não deu para carregar seus amigos. Tente de novo.",
      );
  }, []);

  const start = useCallback(() => {
    if (fromServer.current && initial) {
      fromServer.current = false;
      rememberAccount(initial.me); // cabeçalho e Menu com a conta certa
      return;
    }
    loadMe().then((r) => {
      if (!r.ok && r.status === 401)
        return router.replace("/login?next=/friends");
      if (!r.ok)
        return setError("Não deu para carregar sua conta. Tente de novo.");
      rememberAccount(r.data);
      // sem @: escolhe na janela Meu perfil (a tela /handle saiu) e o painel segue sozinho depois
      if (!r.data.handle) return setNeedHandle(true);
      setNeedHandle(false);
      setMe(r.data);
      load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial é só da 1ª carga
  }, [router, load]);
  useEffect(start, [start]);

  // a lista de notificações mudou (chegou um pedido, ou um foi cancelado do outro lado): relê pedidos e amigos
  const seen = useRef("");
  useEffect(() => {
    if (!me) return;
    const onNotify = () => {
      // só as de amizade mexem nas listas (as de desafio, não)
      const key = notifyState()
        .items.filter(toFriends)
        .map((n) => n.id)
        .join();
      if (seen.current && key !== seen.current) void load();
      seen.current = key;
    };
    onNotify();
    window.addEventListener(NOTIFY_EVENT, onNotify);
    return () => window.removeEventListener(NOTIFY_EVENT, onNotify);
  }, [me, load]);

  // trocou de página (ou a página ficou vazia e voltou para a anterior): busca só aquela página da lista
  useEffect(() => {
    if (!lists || lists.friendsPage === friendsPage) return;
    let gone = false;
    setPaging("friends");
    api<Page<FriendItem>>(`/api/friends?list=friends&page=${friendsPage}`).then(
      (r) => {
        if (gone) return;
        if (r.ok)
          setLists((l) =>
            l
              ? {
                  ...l,
                  friends: r.data.items,
                  friendsTotal: r.data.total,
                  friendsPage: r.data.page,
                }
              : l,
          );
        setPaging(null);
      },
    );
    return () => {
      gone = true;
    };
  }, [lists, friendsPage]);
  useEffect(() => {
    if (!lists || lists.outgoingPage === outPage) return;
    let gone = false;
    setPaging("outgoing");
    api<Page<Person>>(`/api/friends?list=outgoing&page=${outPage}`).then(
      (r) => {
        if (gone) return;
        if (r.ok)
          setLists((l) =>
            l
              ? {
                  ...l,
                  outgoing: r.data.items,
                  outgoingTotal: r.data.total,
                  outgoingPage: r.data.page,
                }
              : l,
          );
        setPaging(null);
      },
    );
    return () => {
      gone = true;
    };
  }, [lists, outPage]);

  /** Aceitar, recusar, remover, cancelar: faz e recarrega as listas (sem recarregar a página). `who` = spinner nessa linha. Diz se deu certo. */
  async function act(
    path: string,
    method: string,
    body?: unknown,
    who?: string,
  ): Promise<boolean> {
    setError("");
    if (who) setActing(who);
    const r = await api(path, method, body);
    if (!r.ok)
      setError(
        r.status === 0 ? ADD_ERROR.offline : "Não deu certo. Tente de novo.",
      );
    await load();
    setActing(null);
    return r.ok;
  }

  if (needHandle)
    return (
      <NeedHandle
        text="Seus amigos te acham pelo usuário. Escolha o seu para adicionar amigos."
        onReady={start}
      />
    );
  if (!me || !lists)
    return (
      <main className="mx-auto mt-6 w-full max-w-xl pb-12">
        {error ? <Alert>{error}</Alert> : <Loading />}
      </main>
    );

  return (
    <main className="mt-4 animate-enter pb-16 sm:mt-6">
      {/* sem "‹ Início" e sem o número de amigos no título (10-amigos.md, ajuste de 27/11) */}
      <h1 className="font-display text-4xl leading-tight font-extrabold tracking-tight text-ink md:text-5xl">
        Amigos
      </h1>
      <p className="mt-1 text-base text-muted">
        Seus amigos e um atalho para desafiar no desafio de hoje.
      </p>
      {error && <Alert>{error}</Alert>}

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* direita no computador; no celular vem primeiro, logo abaixo do título */}
        <aside className="grid gap-4 lg:order-2">
          {/* adicionar pelo username: o botão mostra enviando/enviado/erro (AddFriendCard) */}
          <AddFriendCard myHandle={me.handle} onSent={load} />

          {lists.outgoingTotal > 0 && (
            <section aria-labelledby="sent-title" className={`${CARD} p-4`}>
              <h2 id="sent-title" className={`${SECTION_TITLE} text-muted`}>
                Pedidos enviados · {lists.outgoingTotal}
              </h2>
              {paging === "outgoing" ? (
                <Loading size="sm" />
              ) : (
                <ul className="mt-2 grid gap-2">
                  {lists.outgoing.map((p) => (
                    <li key={p.id} className="flex items-center gap-2.5">
                      <ProfileAvatar
                        image={p.image}
                        name={p.name ?? p.handle}
                        size={32}
                        className="text-xs"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                        @{p.handle}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          act(`/api/friends/${p.id}`, "DELETE", undefined, p.id)
                        }
                        disabled={acting === p.id}
                        aria-busy={acting === p.id}
                        className={`${LINK} inline-flex items-center gap-1.5 text-sm disabled:opacity-60`}
                      >
                        {acting === p.id && <Spinner />} Cancelar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Pagination
                page={outPage}
                pages={outPages}
                onChange={setOutPage}
                label="Páginas de pedidos enviados"
                className="mt-3"
              />
            </section>
          )}
        </aside>

        <div className="grid gap-4 lg:order-1">
          {/* desafios recebidos por notificação e respostas (15-desafio-por-notificacao.md); some sem nenhum */}
          <DuelNotices />
          {/* pedidos recebidos: sempre abertos, com a página que veio com as listas (spec 16) */}
          <IncomingRequests
            count={lists.incomingCount}
            initial={incomingInitial}
            onPage={onIncomingPage}
            acting={acting}
            act={act}
          />

          {/* sem amigos: o cartão roxo com os três passos (10-amigos.md, "Lista vazia") */}
          {lists.friendsTotal === 0 ? (
            <EmptyFriends handle={me.handle} />
          ) : (
            <section aria-labelledby="friends-title">
              <h2
                id="friends-title"
                className="mb-2 px-1 font-display text-lg font-extrabold text-ink"
              >
                Seus amigos{" "}
                <span className="text-grape">· {lists.friendsTotal}</span>
              </h2>
              {/* trocando de página: a lista atual fica (apagada) e o Loading vem no centro dela, sem pular de altura;
                  sem lista ainda, a caixa tem a mesma altura mínima do Loading dos "Pedidos" */}
              <div className="relative">
                {paging === "friends" && (
                  <div className={`absolute inset-0 z-10 ${LOADING_BOX}`}>
                    <Loading size="sm" />
                  </div>
                )}
                {lists.friends.length === 0 ? (
                  <div className={`${CARD} ${LOADING_BOX}`} />
                ) : (
                  <ul
                    aria-label="Seus amigos"
                    className={`${CARD} divide-y-2 divide-track transition-opacity ${paging === "friends" ? "pointer-events-none opacity-30" : ""}`}
                  >
                    {lists.friends.map((f) => (
                      <FriendRow
                        key={f.id}
                        friend={f}
                        onChallenge={() => setChallenging(f)}
                        onRemove={async () =>
                          void (await act(`/api/friends/${f.id}`, "DELETE"))
                        }
                      />
                    ))}
                  </ul>
                )}
              </div>
              {/* 10 por página, buscadas no banco (14-duelos-na-conta-e-paginacao.md) */}
              <Pagination
                page={friendsPage}
                pages={friendsPages}
                onChange={setFriendsPage}
                label="Páginas de amigos"
                className="mt-4"
              />
            </section>
          )}
        </div>
      </div>
      {/* "Desafiar": o desafio por link do fim de jogo, com os modos de hoje */}
      {challenging && (
        <ChallengeDialog
          friend={{ id: challenging.id, name: challenging.name ?? `@${challenging.handle}` }}
          onClose={() => setChallenging(null)}
        />
      )}
    </main>
  );
}
