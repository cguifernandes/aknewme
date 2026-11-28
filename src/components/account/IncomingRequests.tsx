"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/account";
import { ago } from "@/lib/relTime";
import Loading from "../Loading";
import Pagination, { usePage } from "../Pagination";
import { Icon } from "../icons";
import { PILL } from "./FriendRow";
import { ProfileAvatar, Spinner } from "./ui";

export type Person = {
  id: string;
  handle: string | null;
  name: string | null;
  image: string | null;
};
/** Pedido recebido: a pessoa e quando pediu */
export type Request = Person & { askedAt?: string };

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
/** Caixa do Loading quando ainda não há lista ("Seus amigos"): altura mínima, Loading no centro */
export const LOADING_BOX = "flex min-h-40 items-center justify-center";
/** Itens por página (pedidos e amigos): o servidor devolve só a página (14-duelos-na-conta-e-paginacao.md) */
export const PER_PAGE = 10;
/** Recusar: a bolinha grape do "⋯" dos amigos, com um X */
const DECLINE = `flex size-11 shrink-0 items-center justify-center rounded-full bg-grape text-white transition-colors not-disabled:hover:bg-grape-deep disabled:opacity-60 sm:size-9 ${FOCUS}`;

/**
 * "Pedidos de amizade" em /friends (specs/login-duelo/16-pedidos-sem-acordeao.md): sempre aberto, sem acordeão. Seção
 * branca com a quantidade numa bolinha grape e a grade de cartões (2 colunas no computador, 1 no celular): avatar, nome,
 * @, "pediu há X" e, à direita, "Aceitar" (o "Duelar" dos amigos) e a bolinha grape de X para recusar. Sem pedidos, só a
 * faixa tracejada "Nenhum pedido novo".
 * A página atual vem pronta com as listas (1ª carga no servidor e cada recarga de /api/friends): ao abrir, sem
 * "Carregando..." e sem clique. Trocar de página busca `/api/friends?list=incoming&page=N`, com o Loading por cima da
 * grade. Quem foi respondido sai na hora; `act(...)` responde e recarrega as listas (com a página nova e a quantidade).
 */
export default function IncomingRequests({
  count,
  initial,
  acting,
  act,
  onPage,
}: {
  count: number;
  /** a página de pedidos que veio com as listas */
  initial: { items: Request[]; page: number };
  /** pedido sendo respondido ("<id>:accept" | "<id>:decline") */
  acting: string | null;
  act: (path: string, method: string, body: unknown, who: string) => Promise<boolean>;
  /** a página mostrada (o painel pede essa mesma página ao recarregar as listas) */
  onPage: (page: number) => void;
}) {
  const [page, setPage, pages] = usePage(count, PER_PAGE);
  /** página buscada aqui (quando não é a que veio com as listas) */
  const [fetched, setFetched] = useState<{ page: number; count: number; items: Request[] } | null>(null);
  const [failed, setFailed] = useState(false);
  /** respondidos nesta página: saem na hora, antes de a lista nova chegar */
  const [answered, setAnswered] = useState<string[]>([]);
  /** a última lista mostrada: fica (apagada) com o Loading por cima enquanto a outra página chega */
  const last = useRef<Request[]>(initial.items);

  useEffect(() => onPage(page), [page, onPage]);
  useEffect(() => setAnswered([]), [initial]);

  const fromLists = initial.page === page;
  const ready = fromLists ? initial.items : fetched && fetched.page === page && fetched.count === count ? fetched.items : null;
  useEffect(() => {
    if (ready || count === 0) return;
    let gone = false;
    setFailed(false);
    void api<{ items: Request[] }>(`/api/friends?list=incoming&page=${page}`).then((r) => {
      if (gone) return;
      if (!r.ok) return setFailed(true);
      setFetched({ page, count, items: r.data.items });
    });
    return () => {
      gone = true;
    };
  }, [ready, page, count]);
  if (ready) last.current = ready;
  const items = (ready ?? last.current).filter((p) => !answered.includes(p.id));

  async function answer(p: Request, action: "accept" | "decline") {
    if (!(await act(`/api/friends/${p.id}`, "PATCH", { action }, `${p.id}:${action}`))) return;
    setAnswered((a) => [...a, p.id]);
  }

  // sem pedidos: só a faixa tracejada, sem botão
  if (count === 0)
    return (
      <section aria-label="Pedidos de amizade" className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-3xl border-2 border-dashed border-lavender px-5 py-4">
        <p className="font-bold text-ink">Nenhum pedido novo</p>
        <p className="text-sm text-muted">Quando alguém te adicionar, aparece aqui.</p>
      </section>
    );

  return (
    <section aria-labelledby="incoming-title" className="rounded-3xl border-2 border-track bg-paper p-4 sm:p-5">
      <h2 id="incoming-title" className="flex items-center gap-2.5 font-display text-lg font-extrabold text-ink">
        Pedidos de amizade
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-grape px-1.5 text-xs font-extrabold text-white tabular-nums">
          <span aria-hidden="true">{count}</span>
          <span className="sr-only">, {count}</span>
        </span>
      </h2>
      {failed ? (
        <p className="mt-3 text-sm font-bold text-danger">Não deu para carregar os pedidos. Recarregue a página para tentar de novo.</p>
      ) : (
        <div className="relative mt-3">
          {!ready && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <Loading size="sm" />
            </div>
          )}
          <ul className={`grid gap-3 transition-opacity sm:grid-cols-2 ${ready ? "" : "pointer-events-none opacity-30"}`}>
            {items.map((p) => {
              const busy = acting?.startsWith(p.id) ?? false;
              return (
                <li key={p.id} className="flex min-w-0 items-center gap-3 rounded-2xl border-2 border-track bg-paper p-3">
                  <ProfileAvatar image={p.image} name={p.name ?? p.handle} size={40} className="text-sm" />
                  {/* nome e @ cortam com "…" antes de os botões empurrarem a tela */}
                  <p className="min-w-0 flex-1 text-sm leading-tight">
                    <span className="flex min-w-0 items-baseline gap-x-2 whitespace-nowrap">
                      <span className="min-w-0 truncate font-bold text-ink">{p.name ?? `@${p.handle}`}</span>
                      {p.name && <span className="min-w-0 shrink-[2] truncate text-xs font-semibold text-grape">@{p.handle}</span>}
                    </span>
                    {p.askedAt && (
                      <span suppressHydrationWarning className="mt-0.5 block text-xs text-muted">
                        pediu {ago(p.askedAt)}
                      </span>
                    )}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => answer(p, "accept")}
                      disabled={busy}
                      aria-busy={acting === `${p.id}:accept`}
                      aria-label={`Aceitar o pedido de @${p.handle}`}
                      className={`${PILL} border-track bg-paper text-ink sweep-lime`}
                    >
                      {acting === `${p.id}:accept` && <Spinner />} Aceitar
                    </button>
                    <button
                      type="button"
                      onClick={() => answer(p, "decline")}
                      disabled={busy}
                      aria-busy={acting === `${p.id}:decline`}
                      aria-label={`Recusar o pedido de @${p.handle}`}
                      className={DECLINE}
                    >
                      {acting === `${p.id}:decline` ? <Spinner /> : <Icon icon={faXmark} />}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <Pagination page={page} pages={pages} onChange={setPage} label="Páginas de pedidos" className="mt-4" />
    </section>
  );
}
