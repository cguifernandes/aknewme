"use client";

import { faCheck, faLink, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { api } from "@/lib/account";
import { myGame, saveDuelToAccount } from "@/lib/accountDuels";
import { challengeLink, cleanNick, DUEL_SENT_EVENT, sentDuelId } from "@/lib/challenge";
import { clock, DUEL_TEXT } from "@/lib/duelTexts";
import { challengeLine } from "@/lib/endcard";
import { MODE_LABEL, playDay, type GameMode } from "@/lib/game";
import { prefetchRivals } from "@/lib/accountDuels";
import { openDuelsFromHref } from "@/lib/duelsWindow";
import { GRAPE_PRIMARY } from "../buttons";
import { Icon } from "../icons";
import { useAccount } from "./AccountProvider";
import { Spinner } from "./ui";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const PILL = "relative grid min-h-11 place-items-center rounded-full px-4 py-2.5 text-sm font-bold";
/** Erro e "Link copiado!": 2,5 s, como o "Enviar" do Adicionar amigo */
const FEEDBACK_MS = 2500;
const ERRORS: Record<string, string> = {
  not_friend: "Vocês não são mais amigos.",
  expired: "Esse duelo já venceu. Jogue o de hoje.",
  no_duel: "Não deu para preparar o duelo. Tente de novo.",
  invalid_moves: "Não deu para conferir sua partida de hoje.",
  mismatch: "Não deu para conferir sua partida de hoje.",
  rate_limited: "Muitas tentativas. Tente de novo em 1 minuto.",
  offline: "Sem conexão. Tente de novo.",
};

/** O convite já mandado para esse amigo nesse modo hoje, como o servidor diz (GET /api/duel-challenges) */
export type Invite = { mode: GameMode; status: "pending" | "accepted" | "answered"; remaining: number | null };

/**
 * "Enviar duelo" na janela aberta de um amigo da lista (specs/login-duelo/15-desafio-por-notificacao.md): numa chamada
 * só, salva a sua partida de hoje na conta e manda o duelo como notificação para o amigo, sem copiar nada. Roxo primário
 * (GRAPE_PRIMARY); enviando, só o spinner na mesma largura; erro, danger + X com a explicação (volta em 2,5 s).
 * Enviado: lime-deep + check, "Duelo enviado · 1:59" contando o prazo do convite, desativado; quando o prazo acaba (o
 * amigo não abriu), volta para "Enviar duelo". Se o amigo abriu no prazo: "Duelo aceito" (não dá para mandar de novo
 * naquele modo no dia). Ao lado (embaixo no celular), "Copiar link", secundário com contorno, para mandar por fora.
 */
export default function FriendChallengeButton({
  friend,
  mode,
  tiles,
  won,
  invite,
  onPending,
}: {
  friend: { id: string; name: string };
  mode: GameMode;
  tiles: string[];
  won: boolean;
  /** o convite de hoje para esse amigo nesse modo (chega depois de abrir a janela, com o tempo que falta) */
  invite?: Invite;
  /** mandou (ou já havia um esperando): a janela passa a conferir se o amigo aceitou */
  onPending?: (seconds: number) => void;
}) {
  const me = useAccount();
  const day = playDay();
  // começa já no estado que veio do servidor (a janela mostra o Skeleton até ele chegar): sem piscar "Enviar duelo"
  const [state, setState] = useState<"idle" | "sending" | "pending" | "accepted" | "answered">(
    invite?.status === "answered" ? "answered" : invite?.status === "accepted" ? "accepted" : invite?.status === "pending" && invite.remaining ? "pending" : "idle",
  );
  /** quando o convite vence (ms, relógio do aparelho a partir dos segundos que o servidor deu) */
  const [deadline, setDeadline] = useState(() => (invite?.status === "pending" && invite.remaining ? Date.now() + invite.remaining * 1000 : 0));
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const nick = (me ? cleanNick(me.name ?? me.handle ?? "") : "") || "Alguém";

  function waitFor(seconds: number) {
    setDeadline(Date.now() + seconds * 1000);
    setNow(Date.now());
    setState("pending");
  }

  // o estado que o servidor deu ao abrir a janela
  useEffect(() => {
    if (invite?.status === "answered") setState("answered");
    else if (invite?.status === "accepted") setState("accepted");
    else if (invite?.status === "pending" && invite.remaining) waitFor(invite.remaining);
  }, [invite]);
  // contagem regressiva; no fim, dá para mandar de novo
  useEffect(() => {
    if (state !== "pending") return;
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= deadline) setState("idle");
    }, 250);
    return () => clearInterval(t);
  }, [state, deadline]);
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [error]);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), FEEDBACK_MS);
    return () => clearTimeout(t);
  }, [copied]);

  async function send() {
    if (state !== "idle" || error) return;
    const game = myGame(mode, day);
    if (!game) return setError(ERRORS.no_duel);
    setState("sending");
    const r = await api<{ expiresIn: number }>("/api/duel-challenges", "POST", { friend: friend.id, mode, day, duelId: sentDuelId(mode, day), nick, ...game });
    if (r.ok) {
      waitFor(r.data.expiresIn); // assim que o servidor confirma
      onPending?.(r.data.expiresIn);
      window.dispatchEvent(new Event(DUEL_SENT_EVENT));
      return;
    }
    // já há um convite esperando (outra aba, outro aparelho): mostra o tempo que falta
    if (r.error === "pending" && typeof r.body?.retryIn === "number") {
      onPending?.(r.body.retryIn);
      return waitFor(r.body.retryIn);
    }
    if (r.error === "accepted") return setState("accepted");
    setState("idle");
    setError(ERRORS[r.status === 429 ? "rate_limited" : r.status === 0 ? "offline" : r.error] ?? "Não deu para enviar. Tente de novo.");
  }

  /** Por fora: o mesmo link do duelo (com o seu resultado), copiado; a partida também vai para a conta */
  async function copyLink() {
    const id = sentDuelId(mode, day)!;
    const link = challengeLink(mode, { day, nick, tiles, won, id });
    const text = `⚔️ ${nick} te desafiou no aknewme · Modo ${MODE_LABEL[mode]}\n${challengeLine(mode, tiles, won, day)} Consegue bater?\n👉 ${link}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {}
    window.dispatchEvent(new Event(DUEL_SENT_EVENT));
    void saveDuelToAccount("challenger", mode, day, id, nick);
  }

  const busy = state === "sending";
  const done = state === "pending" || state === "accepted";
  const left = Math.max(0, Math.ceil((deadline - now) / 1000));
  const doneText = state === "accepted" ? DUEL_TEXT.acceptedShort : `${DUEL_TEXT.sent} · ${clock(left)}`;
  const look = error
    ? "bg-danger text-white"
    : state === "accepted"
      ? "bg-lime-deep text-ink cursor-not-allowed opacity-60" // aceito: bloqueado, mas legível
      : done
        ? "bg-lime-deep text-ink"
        : GRAPE_PRIMARY;
  const errorId = `challenge-error-${mode}`;

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        {state === "answered" ? (
          // o amigo já terminou: o placar abre aqui mesmo (janela Duelos no rival); os dados começam a vir no hover/foco
          <button
            type="button"
            onClick={() => openDuelsFromHref(`/?duelos=${friend.id}`) || (location.href = `/?duelos=${friend.id}`)}
            onPointerEnter={() => prefetchRivals()}
            onFocus={() => prefetchRivals()}
            className={`${PILL} min-w-0 ${GRAPE_PRIMARY} ${FOCUS}`}
          >
            {DUEL_TEXT.seeScoreMode}
          </button>
        ) : (
        <button
          type="button"
          onClick={send}
          disabled={done}
          aria-disabled={state !== "idle" || !!error}
          aria-busy={busy}
          aria-describedby={error ? errorId : undefined}
          className={`${PILL} min-w-0 ${look} ${FOCUS}`}
        >
          {/* o texto segura a largura; spinner e X vêm por cima, no centro. Enviado: check + o tempo que falta */}
          {done && !error ? (
            <span className="flex items-center gap-2 tabular-nums">
              <Icon icon={faCheck} /> {doneText}
            </span>
          ) : (
            <>
              <span className={`max-w-full truncate ${busy || error ? "invisible" : ""}`}>{DUEL_TEXT.send}</span>
              {(busy || error) && (
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                  {busy ? <Spinner /> : <Icon icon={faXmark} className="text-base" />}
                </span>
              )}
            </>
          )}
        </button>
        )}
        <button
          type="button"
          onClick={copyLink}
          disabled={state === "accepted" || state === "answered"}
          className={`${PILL} grid-flow-col gap-2 border-2 border-lavender bg-paper text-grape sweep-track disabled:cursor-not-allowed disabled:opacity-60 disabled:[background-image:none] sm:min-w-36 ${FOCUS}`}
        >
          <Icon icon={copied ? faCheck : faLink} />
          {copied ? "Link copiado!" : "Copiar link"}
        </button>
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-sm font-bold text-danger">
          {error}
        </p>
      )}
      {/* leitor de tela: só as mudanças (não lê a contagem a cada segundo) */}
      <p aria-live="polite" className="sr-only">
        {error ?? (state === "accepted" ? DUEL_TEXT.acceptedShort : state === "pending" ? DUEL_TEXT.sent : busy ? "Enviando" : copied ? "Link copiado" : "")}
      </p>
    </div>
  );
}
