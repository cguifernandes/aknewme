"use client";

import { useEffect, useRef, useState } from "react";
import { DUEL_SENT_EVENT, outcome, recordDuel, sentDuelId } from "./challenge";
import type { GameMode } from "./game";

/** Sem `tiles`: ainda não terminou (abriu o convite ou está jogando). */
export type DuelAnswer = { player?: string; nick: string; tiles?: string[]; won?: boolean; status?: "opened" | "playing"; t: number };
export type FinishedAnswer = DuelAnswer & { tiles: string[]; won: boolean };

/** De quanto em quanto tempo a janela pergunta ao servidor se alguém respondeu o desafio. */
const POLL_MS = 10_000;
/** "Abriu"/"jogando" mais velho que isso não conta mais (fechou a aba sem terminar). */
const LIVE_MS = 30 * 60_000;

/**
 * Respostas ao desafio que este navegador mandou naquele modo e dia (/api/duel), para a janela de fim de jogo de quem
 * desafiou. Pergunta a cada 10 s (só com a aba à mostra), na hora em que a aba volta e logo depois de mandar
 * (DUEL_SENT_EVENT). O código do desafio é lido a cada volta: ele pode ser mandado com a janela já aberta.
 * Cada placar que chega entra no "Seus duelos esta semana". `fresh`: o placar que acabou de chegar com a janela aberta
 * (para o aviso "Você venceu!"); os que já estavam lá quando a janela abriu não contam.
 */
export function useDuelAnswers(mode: GameMode, day: number, mine: { tiles: string[]; won: boolean }) {
  const [answers, setAnswers] = useState<DuelAnswer[]>([]);
  const [fresh, setFresh] = useState<FinishedAnswer | null>(null);
  /** Placares já vistos (pelo jogador e pela hora); null = ainda não veio a primeira resposta do servidor */
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    let stop = false;
    const check = async () => {
      const id = sentDuelId(mode, day, false);
      if (!id || stop || document.visibilityState !== "visible") return;
      try {
        const r = await fetch(`/api/duel?id=${id}`, { cache: "no-store" });
        const list: DuelAnswer[] = (await r.json()).answers ?? [];
        if (stop) return;
        const done = list.filter((a): a is FinishedAnswer => !!a.tiles);
        for (const a of done)
          recordDuel(mode, { day, nick: a.nick, tiles: a.tiles, won: a.won, player: a.player }, outcome(mode, mine, { day, ...a }), mine, a.t);
        const keyOf = (a: DuelAnswer) => `${a.player ?? a.nick}:${a.t}`;
        // 1ª resposta do servidor: o que já estava lá não vira aviso
        if (seen.current) {
          const novo = done.find((a) => !seen.current!.has(keyOf(a)));
          if (novo) setFresh(novo);
        }
        seen.current = new Set(done.map(keyOf));
        setAnswers((old) => (JSON.stringify(old) === JSON.stringify(list) ? old : list));
      } catch {} // sem rede: tenta de novo na próxima volta
    };
    // desafio mandado com a janela aberta: a 1ª consulta depois dele já pode trazer aviso
    const sent = () => {
      seen.current ??= new Set();
      check();
    };
    check();
    const timer = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener(DUEL_SENT_EVENT, sent);
    return () => {
      stop = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener(DUEL_SENT_EVENT, sent);
    };
    // o desafio e o resultado não mudam com a janela aberta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, day]);

  const done = answers.filter((a): a is FinishedAnswer => !!a.tiles);
  const live = answers.filter((a) => !a.tiles && Date.now() - a.t < LIVE_MS);
  return { answers, done, live, fresh, clearFresh: () => setFresh(null) };
}
