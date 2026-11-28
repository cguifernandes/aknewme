"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  duelsSeen,
  initials,
  markDuelsSeen,
  outcome,
  recentDuels,
  recordDuel,
  rivals,
  sentToday,
  type Rival,
} from "@/lib/challenge";
import { closeOnBackdrop } from "@/lib/dialog";
import type { DuelAnswer } from "@/lib/duelAnswers";
import { dailyNumber, getDailyResult } from "@/lib/game";
import { accountRivals } from "@/lib/accountDuels";
import { registerDuelsWindow } from "@/lib/duelsWindow";
import { markReadSoon } from "@/lib/notify";
import { useAccount } from "./account/AccountProvider";
import CloseButton from "./CloseButton";
import Skeleton from "./Skeleton";
import DuelInvite from "./DuelInvite";
import { HEADER_BTN } from "./header/buttons";
import type { DialogHandle } from "./HowToPlay";
import { splitGrid } from "./ResultTiles";

import { FOCUS, tone, lead, RivalView } from "./DuelsRival";

/**
 * Botão "Duelos" do cabeçalho da home (com a quantidade de duelos novos) + janela em duas colunas.
 * Esquerda: "Duelos deste aparelho" (com o aviso de que ficam neste navegador), o placar contra cada rival, e "Desafiar um amigo". Direita: o "Chamar pro duelo"
 * (DuelInvite) ou, ao tocar num rival, o placar contra ele e os duelos um a um. Ao abrir, consulta /api/duel dos
 * desafios mandados hoje: o placar que chegou entra no placar (recordDuel).
 */
export default function DuelsDialog({
  ref: handle,
  className = "",
  button = true,
}: {
  ref?: React.Ref<DialogHandle>;
  className?: string;
  /** o botão "Duelos" (só na home); sem ele, só a janela, aberta pelo Menu ou pelo "Ver placar" */ button?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState(0);
  const [seen, setSeen] = useState(0);
  const [board, setBoard] = useState<Rival[]>([]);
  /** com conta, buscando os duelos: Skeleton na lista e, aberto num rival, no placar */
  const [loading, setLoading] = useState(false);
  /** O rival aberto à direita; sem ele, o "Chamar pro duelo" */
  const [pick, setPick] = useState<string | null>(null);
  const today = dailyNumber();
  /** Logado: os duelos vêm da conta (iguais em qualquer aparelho); sem conta, do navegador (14-duelos-na-conta) */
  const me = useAccount();
  const signedIn = !!me;

  useEffect(() => {
    const s = duelsSeen();
    setFresh(recentDuels(dailyNumber()).filter((d) => d.t > s).length);
  }, []);

  async function load() {
    if (signedIn) {
      // logado: só os duelos da conta (os do navegador ficam guardados e voltam ao sair)
      setBoard([]);
      setLoading(true);
      const list = await accountRivals();
      setLoading(false);
      if (list) setBoard(list);
      return;
    }
    setBoard(rivals());
    for (const { mode, id } of sentToday(today)) {
      const r = getDailyResult(mode);
      if (!r) continue;
      const mine = { tiles: splitGrid(r.grid, r.won).tiles, won: r.won };
      try {
        const answers: DuelAnswer[] =
          (
            await (
              await fetch(`/api/duel?id=${id}`, { cache: "no-store" })
            ).json()
          ).answers ?? [];
        for (const a of answers)
          if (a.tiles && a.won !== undefined) {
            const theirs = {
              day: today,
              nick: a.nick,
              tiles: a.tiles,
              won: a.won,
            };
            recordDuel(
              mode,
              { ...theirs, player: a.player },
              outcome(mode, mine, theirs),
              mine,
              a.t,
            );
          }
      } catch {} // sem rede: fica o que já estava guardado
    }
    setBoard(rivals());
  }

  /** Abre a janela; `key` = já com esse rival aberto à direita (ex.: "u:<id>" vindo do aviso "respondeu seu desafio") */
  function show(key: string | null = null) {
    setSeen(duelsSeen());
    markDuelsSeen();
    setFresh(0);
    setPick(key);
    setOpen(true);
    ref.current?.showModal();
    void load();
  }
  // o item "Duelos" do Menu (no celular, onde o botão do cabeçalho não cabe) abre a mesma janela
  useImperativeHandle(handle, () => ({ open: () => show() }));

  // "Ver placar" na página atual (cartão "Desafios" e aviso): abre já no rival, sem navegar, e marca o aviso como lido
  const showRef = useRef(show);
  showRef.current = show;
  useEffect(
    () =>
      registerDuelsWindow((rival) => {
        showRef.current(`u:${rival}`);
        markReadSoon((n) => n.type === "duel_answered" && n.actor.id === rival);
      }),
    [],
  );

  // quem chega de fora pelo link "/?duelos=<id da conta dela>": abre já no rival, com a conta lida,
  // tira o parâmetro do endereço e marca o aviso como lido (15-desafio-por-notificacao.md)
  useEffect(() => {
    if (!signedIn) return;
    const q = new URLSearchParams(location.search);
    const rival = q.get("duelos");
    if (!rival) return;
    q.delete("duelos");
    history.replaceState(
      history.state,
      "",
      `${location.pathname}${q.size ? `?${q}` : ""}`,
    );
    show(`u:${rival}`);
    markReadSoon((n) => n.type === "duel_answered" && n.actor.id === rival);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uma vez, quando a conta aparece
  }, [signedIn]);

  /**
   * Troca o lado direito; no celular ele fica embaixo dos rivais, então rola até ele. Para o "Chamar pro duelo" (key null)
   * também leva o foco ao campo do nome (ou ao "Copiar link") e pisca a borda: sem rival aberto ele já estava na tela, e o
   * clique em "Desafiar um amigo" parecia não fazer nada.
   */
  function go(key: string | null) {
    setPick(key);
    requestAnimationFrame(() => {
      document
        .getElementById("duels-title")
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
      if (key !== null) return;
      const invite = document.getElementById("duel-invite");
      const target = invite?.querySelector<HTMLElement>(
        "li button:not(:disabled), li a",
      );
      target?.focus({ preventScroll: true });
      invite?.animate(
        [
          { boxShadow: "0 0 0 4px var(--color-lime)" },
          { boxShadow: "0 0 0 4px transparent" },
        ],
        { duration: 900, easing: "ease-out" },
      );
    });
  }

  const rival = board.find((r) => r.key === pick);

  return (
    <>
      {/* "Duelos" com a quantidade de duelos novos; a bolinha lime fixa no canto (como antes) sempre mostra que há duelos */}
      {button && (
        <button
          type="button"
          onClick={() => show()}
          aria-label={
            fresh
              ? `Meus duelos, ${fresh} ${fresh === 1 ? "novo" : "novos"}`
              : "Meus duelos"
          }
          className={`relative ${HEADER_BTN} ${className}`}
        >
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 size-3 rounded-full border-2 border-white bg-lime"
          />
          Duelos
          {fresh > 0 && (
            <span
              aria-hidden="true"
              className="flex size-5 items-center justify-center rounded-full bg-blush text-xs font-extrabold text-ink"
            >
              {fresh}
            </span>
          )}
        </button>
      )}

      <dialog
        ref={ref}
        aria-label={signedIn ? "Duelos" : "Duelos deste aparelho"}
        onClose={() => setOpen(false)}
        onClick={closeOnBackdrop}
        className="m-auto max-h-[90dvh] w-[min(52rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-white text-ink shadow-pop-lg backdrop:bg-ink/60 md:h-[min(34rem,90dvh)] md:overflow-hidden"
      >
        {open && (
          <div className="relative grid grid-cols-1 md:h-full md:grid-cols-[17rem_minmax(0,1fr)]">
            <CloseButton
              onClick={() => ref.current?.close()}
              className="absolute top-4 right-4 z-10"
            />

            {/* rivais: o placar geral contra cada amigo; tocar num abre os duelos contra ele à direita */}
            <aside className="flex min-h-0 flex-col overflow-hidden bg-grape p-5 text-white">
              {/* sem conta os duelos ficam só no navegador (o nome da janela diz isso); com conta, ficam na conta */}
              <h2 className="pr-10 font-display text-2xl leading-tight font-extrabold md:pr-0">
                {signedIn ? "Duelos" : "Duelos deste aparelho"}
              </h2>
              <p className="mt-0.5 text-xs text-lavender">
                {signedIn
                  ? "Placar de cada rival."
                  : "Placar de cada rival. Partidas e duelos ficam neste navegador."}
              </p>
              {/* sem rival ainda, o "Chamar pro duelo" já está aberto ao lado: o botão sai e fica só o aviso */}
              {!loading && board.length > 0 && (
                <button
                  type="button"
                  onClick={() => go(null)}
                  className={`mt-4 w-full rounded-full bg-lime py-3 text-sm font-bold text-ink shadow-pop sweep-lime-deep active:translate-y-0.5 ${FOCUS}`}
                >
                  Desafiar um amigo
                </button>
              )}
              {loading ? (
                // carregando: o lugar do "Desafiar um amigo" e de 3 rivais, no tamanho deles
                <div role="status" aria-label="Carregando os duelos" className="mt-4 flex flex-col gap-2">
                  <Skeleton className="h-11 opacity-30" />
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="mt-1 h-[52px] rounded-2xl opacity-20" />
                  ))}
                </div>
              ) : board.length > 0 ? (
                // só a lista rola (o título e o botão ficam no lugar)
                <ul className="-mx-2 mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1 py-1 scroll-slim">
                  {board.map((r) => (
                    <li key={r.key}>
                      <button
                        type="button"
                        aria-pressed={pick === r.key}
                        onClick={() => go(r.key)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-white ${
                          pick === r.key
                            ? "bg-grape-deep"
                            : "hover:bg-grape-deep/60"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`relative flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-ink ${tone(r.nick)}`}
                        >
                          {initials(r.nick)}
                          {r.duels.some((d) => d.t > seen) && (
                            <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-grape bg-lime" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">
                            {r.nick}
                          </span>
                          <span className="block text-[11px] text-lavender">
                            {lead(r)}
                          </span>
                        </span>
                        <span className="shrink-0 font-display text-lg font-extrabold">
                          <span className="sr-only">
                            {r.wins} a {r.losses}
                          </span>
                          <span aria-hidden="true">
                            {r.wins}{" "}
                            <span className="text-sm text-lavender">x</span>{" "}
                            {r.losses}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-lavender">
                  Você ainda não tem duelos. Desafie alguém e o placar aparece
                  aqui.
                </p>
              )}
            </aside>

            {/* barra de rolagem fina; o respiro de baixo fica dentro do conteúdo (o botão não cola na borda ao rolar) */}
            <div className="flex min-h-0 flex-col px-5 pt-5 sm:px-6 sm:pt-6 md:overflow-y-auto scroll-slim">
              <div className="flex flex-1 flex-col pb-5 sm:pb-6">
                {loading && pick ? (
                  // aberto num rival que ainda está chegando: o título, o placar grande e os duelos, no tamanho deles
                  <div role="status" aria-label="Carregando o placar" className="flex flex-col gap-3">
                    <Skeleton className="h-7 w-48 rounded-xl" />
                    <Skeleton className="h-28 rounded-3xl" />
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-14 rounded-2xl" />
                    ))}
                  </div>
                ) : rival ? (
                  <RivalView
                    key={rival.key}
                    rival={rival}
                    today={today}
                    onChallenge={() => go(null)}
                  />
                ) : (
                  <DuelInvite />
                )}
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
