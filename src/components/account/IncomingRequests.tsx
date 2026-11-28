"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { api } from "@/lib/account";
import { ago, monthYear } from "@/lib/relTime";
import Loading from "../Loading";
import Pagination, { usePage } from "../Pagination";
import { Icon } from "../icons";
import { ProfileAvatar, Spinner } from "./ui";

export type Person = {
  id: string;
  handle: string | null;
  name: string | null;
  image: string | null;
};
/** Pedido recebido com o que ajuda a decidir (do banco): quando pediu, amigos em comum e desde quando joga */
type Request = Person & { askedAt?: string; mutual?: number; joined?: string };

/** "pediu há 3 horas · 2 amigos em comum" (sem amigos em comum: "jogando desde nov/2026") */
function requestInfo(p: Request) {
  const asked = p.askedAt ? `pediu ${ago(p.askedAt)}` : null;
  const extra = p.mutual
    ? `${p.mutual} ${p.mutual === 1 ? "amigo" : "amigos"} em comum`
    : p.joined
      ? `jogando desde ${monthYear(p.joined)}`
      : null;
  return [asked, extra].filter(Boolean).join(" · ");
}

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
/** Pílula menor das linhas de pedido: 44 px de toque no celular, 32 px no computador. */
const SMALL = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border-2 px-3 text-[13px] font-bold whitespace-nowrap disabled:opacity-60 sm:min-h-8 ${FOCUS}`;
/** Caixa do Loading quando ainda não há lista: a mesma altura mínima nos "Pedidos" e em "Seus amigos", Loading no centro */
export const LOADING_BOX = "flex min-h-40 items-center justify-center";
/** Itens por página (pedidos e amigos): o servidor devolve só a página (14-duelos-na-conta-e-paginacao.md) */
export const PER_PAGE = 10;

/**
 * "Pedidos · N" no topo de /friends (specs/login-duelo/10 e 14), sempre à mostra (com 0: "Nenhum pedido no momento."): acordeão fechado por padrão, com a mesma borda do cartão
 * "Seus amigos". A quantidade vem com a página; a lista é buscada só ao abrir, uma página (10) por vez, no banco
 * (`/api/friends?list=incoming&page=N`), com o Loading do projeto na lista. Fechar e abrir de novo reaproveita a página
 * que veio, a não ser que a quantidade mude. Aceitar e Recusar só aqui; quem foi respondido sai da lista na hora e a
 * página é buscada de novo (se ela ficar vazia, volta para a anterior).
 * `act(...)` responde, recarrega a página de amigos (e, com ela, a quantidade) e diz se deu certo.
 */
export default function IncomingRequests({
  count,
  acting,
  act,
}: {
  count: number;
  /** pedido sendo respondido ("<id>:accept" | "<id>:decline") */
  acting: string | null;
  act: (
    path: string,
    method: string,
    body: unknown,
    who: string,
  ) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Request[] | null>(null);
  /** Página e quantidade da última busca: muda uma das duas (com a lista aberta), busca de novo */
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  /** Buscando outra página com a lista já à mostra: ela fica (apagada) e o Loading vem por cima, sem pular de altura */
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage, pages] = usePage(count, PER_PAGE);
  const want = `${page}:${count}`;

  useEffect(() => {
    if (!open || loadedFor === want) return;
    if (count === 0) {
      // sem pedidos: nada a buscar ("Nenhum pedido no momento.")
      setItems([]);
      setLoadedFor(want);
      return;
    }
    let gone = false;
    setFailed(false);
    setRefreshing(true); // 1ª vez (sem lista): Loading numa caixa de altura mínima; depois, por cima da lista
    api<{ items: Request[] }>(`/api/friends?list=incoming&page=${page}`).then(
      (r) => {
        if (gone) return;
        setRefreshing(false);
        if (!r.ok) return setFailed(true);
        setItems(r.data.items);
        setLoadedFor(want);
      },
    );
    return () => {
      gone = true;
    };
  }, [open, want, loadedFor, page]);

  /** Responde; se deu certo, tira a pessoa da lista já (a página vem de novo com a quantidade nova) */
  async function answer(p: Person, action: "accept" | "decline") {
    if (
      !(await act(
        `/api/friends/${p.id}`,
        "PATCH",
        { action },
        `${p.id}:${action}`,
      ))
    )
      return;
    setItems((list) => list?.filter((x) => x.id !== p.id) ?? list);
  }

  return (
    <section
      aria-labelledby="incoming-title"
      className="rounded-3xl border-2 border-track bg-paper"
    >
      <h2 id="incoming-title">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="incoming-list"
          onClick={() => setOpen((o) => !o)}
          className={`flex min-h-12 w-full items-center gap-2 rounded-[1.375rem] px-4 text-left font-display text-lg font-extrabold text-ink ${FOCUS}`}
        >
          <span className="flex-1">
            Pedidos <span className="text-grape">· {count}</span>
          </span>
          <Icon
            icon={faChevronDown}
            className={`text-sm text-grape transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h2>
      <div id="incoming-list" hidden={!open} className="px-4 pb-4">
        {failed ? (
          <p className="text-sm font-bold text-danger">
            Não deu para carregar os pedidos. Feche e abra de novo.
          </p>
        ) : items === null ? (
          // a mesma altura mínima do Loading de "Seus amigos", com ele no centro; só com o acordeão aberto (a 1ª carga
          // de /friends vem do servidor sem nenhum "Carregando...")
          open && (
            <div className={LOADING_BOX}>
              <Loading size="sm" />
            </div>
          )
        ) : items.length === 0 ? (
          <p className="pb-1 text-sm text-muted">Nenhum pedido no momento.</p>
        ) : (
          <div className="relative">
            {refreshing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <Loading size="sm" />
              </div>
            )}
            {/* grid de cartões: 2 colunas no computador, 1 no celular (a paginação continua embaixo) */}
            <ul
              className={`grid gap-3 transition-opacity sm:grid-cols-2 ${refreshing ? "pointer-events-none opacity-30" : ""}`}
            >
              {items.map((p) => {
                const busy = acting?.startsWith(p.id) ?? false;
                return (
                  <li
                    key={p.id}
                    className="flex flex-col gap-3 rounded-2xl border-2 border-track p-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <ProfileAvatar
                        image={p.image}
                        name={p.name ?? p.handle}
                        size={40}
                        className="text-sm"
                      />
                      <p className="min-w-0 flex-1 text-sm leading-tight">
                        <span className="flex min-w-0 items-baseline gap-x-2 whitespace-nowrap">
                          <span className="min-w-0 truncate font-bold text-ink">
                            {p.name ?? `@${p.handle}`}
                          </span>
                          {p.name && (
                            <span className="min-w-0 shrink-[2] truncate text-xs font-semibold text-grape">
                              @{p.handle}
                            </span>
                          )}
                        </span>
                        <span
                          suppressHydrationWarning
                          className="mt-0.5 block text-xs text-muted"
                        >
                          {requestInfo(p)}
                        </span>
                      </p>
                    </div>
                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => answer(p, "accept")}
                        disabled={busy}
                        aria-busy={acting === `${p.id}:accept`}
                        className={`${SMALL} border-grape bg-grape text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink`}
                        aria-label={`Aceitar o pedido de @${p.handle}`}
                      >
                        {acting === `${p.id}:accept` && <Spinner />} Aceitar
                      </button>
                      <button
                        type="button"
                        onClick={() => answer(p, "decline")}
                        disabled={busy}
                        aria-busy={acting === `${p.id}:decline`}
                        className={`${SMALL} border-lavender bg-paper text-ink sweep-track`}
                        aria-label={`Recusar o pedido de @${p.handle}`}
                      >
                        {acting === `${p.id}:decline` && <Spinner />} Recusar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {open && (
          <Pagination
            page={page}
            pages={pages}
            onChange={setPage}
            label="Páginas de pedidos"
            className="mt-4"
          />
        )}
      </div>
    </section>
  );
}
