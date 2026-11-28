"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/account";
import { CHALLENGE_VERB } from "@/lib/duelTexts";
import {
  getDailyResult,
  MODE_LABEL,
  MODE_PATH,
  playDay,
  type DailyResult,
  type GameMode,
} from "@/lib/game";
import FriendChallengeButton, { type Invite } from "./account/FriendChallengeButton";
import Skeleton from "./Skeleton";
import { LIME_DARKEN } from "./buttons";
import ChallengeButton from "./ChallengeButton";
import { Icon } from "./icons";
import { splitGrid } from "./ResultTiles";

const MODES = Object.keys(MODE_LABEL) as GameMode[];
/** Com convite esperando, de quanto em quanto confere se o amigo aceitou */
const POLL_MS = 4000;
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";

/**
 * Os modos de hoje para desafiar, um cartão por modo (specs/login-duelo/13 e 14): modo jogado hoje mostra o botão do fim
 * de jogo (ChallengeButton: com conta, "como <nome> ✏️" e já copia o link; sem conta, pede o apelido do jeito dele);
 * modo não jogado mostra "Jogue agora" (lime) e leva para jogar; o desafio sai no fim do jogo. Usado na janela de Desafiar da tela de Amigos
 * (ChallengeDialog) e no "Chamar pro duelo" da janela Duelos (DuelInvite).
 * Com `friend` (a janela aberta de um amigo da lista), o modo jogado vira "Desafiar <nome>" e manda o desafio como
 * notificação (FriendChallengeButton, 15-desafio-por-notificacao.md); sem amigo, continua copiando o link.
 */
export default function ChallengeModes({
  className = "",
  friend,
}: {
  className?: string;
  friend?: { id: string; name: string };
}) {
  /** Resultado de hoje de cada modo (lido do navegador ao montar) */
  const [done, setDone] = useState<Partial<
    Record<GameMode, DailyResult | null>
  > | null>(null);
  /**
   * Com amigo: em quais modos já foi desafiado hoje. Os cartões NÃO esperam por isso (no dev a consulta leva segundos e
   * a janela ficava vazia): aparecem na hora e o "Desafio enviado" entra quando a resposta chega. Se a consulta falhar,
   * um aviso discreto; enviar de novo continua seguro (o servidor recusa repetido e o botão mostra "Desafio enviado").
   */
  /** null = ainda consultando (os modos jogados mostram o Skeleton no lugar dos botões) */
  const [sent, setSent] = useState<Invite[] | null>(friend ? null : []);
  const [sentFailed, setSentFailed] = useState(false);
  /** quando veio a última resposta (os "remaining" contam a partir daí) */
  const fetchedAt = useRef(0);
  useEffect(
    () => setDone(Object.fromEntries(MODES.map((m) => [m, getDailyResult(m)]))),
    [],
  );
  useEffect(() => {
    if (!friend) return;
    void api<{ sent: Invite[] }>(
      `/api/duel-challenges?friend=${friend.id}&day=${playDay()}`,
    ).then((r) => {
      fetchedAt.current = Date.now();
      setSent(r.ok ? r.data.sent : []); // falhou: os botões normais e o aviso discreto
      if (!r.ok) setSentFailed(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o amigo é o mesmo enquanto a janela está aberta
  }, [friend?.id]);
  // Convite esperando: confere de leve se o amigo aceitou (GET a cada 4 s, só com a aba à mostra) e para quando
  // ninguém mais está esperando (aceitou ou venceu). O botão muda sozinho para "<nome> aceitou".
  const [waitUntil, setWaitUntil] = useState(0);
  // aceitou e ainda não terminou: continua conferindo (o botão vira "Ver placar" quando ele termina), até 10 min
  const opened = useRef(Date.now());
  const pendingUntil = Math.max(
    waitUntil,
    ...(sent ?? []).map((s) => (s.status === "pending" && s.remaining ? fetchedAt.current + s.remaining * 1000 : s.status === "accepted" ? opened.current + 10 * 60_000 : 0)),
  );
  useEffect(() => {
    if (!friend || pendingUntil <= Date.now()) return;
    const t = setInterval(() => {
      if (Date.now() > pendingUntil) return clearInterval(t);
      if (document.visibilityState !== "visible") return;
      void api<{ sent: Invite[] }>(`/api/duel-challenges?friend=${friend.id}&day=${playDay()}`).then((r) => {
        if (!r.ok) return;
        fetchedAt.current = Date.now();
        setWaitUntil(0);
        setSent(r.data.sent);
      });
    }, POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o amigo é o mesmo enquanto a janela está aberta
  }, [friend?.id, pendingUntil]);

  if (!done) return null;

  return (
    <div className={className}>
      <ul className="grid gap-3">
        {MODES.map((m) => {
          const r = done[m];
          const tiles = r ? splitGrid(r.grid, r.won).tiles : [];
          return (
            <li key={m} className="rounded-2xl border-2 border-track p-3">
              <p className="mb-2 flex items-baseline justify-between gap-2">
                <span className="font-display text-lg font-extrabold text-ink">
                  {MODE_LABEL[m]}
                </span>
              </p>
              {r && tiles.length > 0 && friend && sent === null ? (
                // o estado ainda não chegou: o lugar dos dois botões (mesma altura e largura), sem "Enviar duelo" falso
                <div role="status" aria-label="Carregando" className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Skeleton className="h-11" />
                  <Skeleton className="h-11 sm:w-36" />
                </div>
              ) : r && tiles.length > 0 && friend ? (
                <FriendChallengeButton
                  friend={friend}
                  mode={m}
                  tiles={tiles}
                  won={r.won}
                  invite={sent!.find((s) => s.mode === m)}
                  onPending={(sec) => setWaitUntil(Date.now() + sec * 1000)}
                />
              ) : r && tiles.length > 0 ? (
                <ChallengeButton
                  mode={m}
                  won={r.won}
                  tiles={tiles}
                  label={`${CHALLENGE_VERB} no ${MODE_LABEL[m]}`} tone="grape"
                />
              ) : (
                <Link
                  href={MODE_PATH[m]}
                  // não jogado: o lime que escurece (LIME_DARKEN); o desafio sai no fim do jogo
                  className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold ${LIME_DARKEN} ${FOCUS}`}
                >
                  Jogue agora <Icon icon={faArrowRight} className="text-xs" />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {sentFailed && (
        <p role="status" className="mt-3 text-xs text-muted">
          Não deu para conferir os desafios que você já mandou hoje. Se mandar
          de novo, o site avisa.
        </p>
      )}
    </div>
  );
}
