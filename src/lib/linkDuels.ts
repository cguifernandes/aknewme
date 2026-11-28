import { isUniqueViolation, rows } from "./db";
import type { GameMode } from "./game";
import type { Move, Replayed } from "./replay";

// Duelos por link salvos na conta (specs/login-duelo/14-duelos-na-conta-e-paginacao.md, migração 007). Uma linha por
// jogador logado em cada duelo; o placar é o que o servidor recalculou com as jogadas (replay). Sem conta, nada aqui.

/** Quanto tempo de duelos a janela "Duelos" mostra (como o navegador: 60 dias). */
const KEEP_DAYS = 60;

export type LinkRole = "challenger" | "responder";
type Result = Pick<Replayed, "won" | "score" | "tiles">;

/**
 * Grava a partida de quem está logado num duelo (uma vez por duelo: a primeira vale). Para quem respondeu, guarda quem
 * desafiou como veio no link e liga à conta do desafiante, se ele já tem a partida dele salva (excluir essa conta apaga
 * este duelo também). Devolve false se já havia (ou se for duelo contra si mesmo).
 */
export async function saveLinkDuel(me: string, d: {
  duelId: string; role: LinkRole; mode: GameMode; day: number; player: string | null; nick: string; moves: Move[]; result: Result;
  rival?: { nick: string; tiles: string[]; won: boolean } | null;
}): Promise<"saved" | "exists" | "self" | "taken"> {
  let rivalId: string | null = null;
  // o desafiante é um só: o id de duelo de outra pessoa não pode ganhar um 2º desafiante (o índice único parcial da
  // migração 011 garante também nas chamadas em paralelo)
  if (d.role === "challenger") {
    const [ch] = await rows<{ user_id: string }>("SELECT user_id FROM link_duels WHERE duel_id = $1 AND role = 'challenger'", [d.duelId]);
    if (ch && ch.user_id !== me) return "taken";
  }
  if (d.role === "responder") {
    const [ch] = await rows<{ user_id: string }>("SELECT user_id FROM link_duels WHERE duel_id = $1 AND role = 'challenger'", [d.duelId]);
    if (ch?.user_id === me) return "self";
    rivalId = ch?.user_id ?? null;
  }
  let saved: unknown[];
  try {
    saved = await rows(
      `INSERT INTO link_duels (duel_id, user_id, role, mode, day, player, nick, moves, result, rival_nick, rival_result, rival_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (duel_id, user_id) DO NOTHING RETURNING duel_id`,
      [
        d.duelId, me, d.role, d.mode, d.day, d.player, d.nick, JSON.stringify(d.moves),
        JSON.stringify({ won: d.result.won, score: d.result.score, tiles: d.result.tiles }),
        d.rival?.nick ?? null, d.rival ? JSON.stringify({ won: d.rival.won, tiles: d.rival.tiles }) : null, rivalId,
      ],
    );
  } catch (e) {
    if (isUniqueViolation(e)) return "taken"; // outra conta gravou como desafiante ao mesmo tempo
    throw e;
  }
  return saved.length ? "saved" : "exists";
}

/** Um duelo como a janela "Duelos" usa: o seu placar e o de um rival (com conta, `account` = id dele). */
export type LinkDuelItem = {
  duelId: string; mode: GameMode; day: number; t: number; role: LinkRole;
  me: { tiles: string[]; won: boolean };
  rival: { nick: string; tiles: string[]; won: boolean; account: string | null; player: string | null };
};
/** Duelo que você mandou e ainda está esperando (os rivais sem conta vêm do Redis, na rota). */
export type OpenChallenge = { duelId: string; mode: GameMode; day: number; t: number; me: { tiles: string[]; won: boolean }; skip: string[] };

type Row = {
  duel_id: string; mode: GameMode; day: number; role: LinkRole; result: Result; finished_at: string;
  rival_nick: string | null; rival_result: { won: boolean; tiles: string[] } | null; player: string | null;
  o_user: string | null; o_nick: string | null; o_result: Result | null; o_player: string | null; o_at: string | null;
};

/**
 * Os duelos de quem está logado nos últimos 60 dias. Rivais com conta vêm das linhas deles (placar conferido); quem
 * respondeu sem conta, a rota busca no Redis (`open`, com os códigos de jogador que já estão aqui, para não repetir).
 */
export async function listLinkDuels(me: string, today: number): Promise<{ items: LinkDuelItem[]; open: OpenChallenge[] }> {
  const list = await rows<Row>(
    `SELECT m.duel_id, m.mode, m.day, m.role, m.result, m.finished_at, m.rival_nick, m.rival_result, m.player,
            o.user_id AS o_user, o.nick AS o_nick, o.result AS o_result, o.player AS o_player, o.finished_at AS o_at
     FROM link_duels m
     LEFT JOIN link_duels o ON o.duel_id = m.duel_id AND o.user_id <> m.user_id
       AND ((m.role = 'challenger' AND o.role = 'responder') OR (m.role = 'responder' AND o.role = 'challenger'))
     WHERE m.user_id = $1 AND m.day > $2
     ORDER BY m.day DESC, m.finished_at DESC, o.finished_at DESC`,
    [me, today - KEEP_DAYS],
  );
  const items: LinkDuelItem[] = [];
  const open = new Map<string, OpenChallenge>();
  for (const r of list) {
    const mine = { tiles: r.result.tiles, won: r.result.won };
    if (r.role === "challenger") {
      const o = open.get(r.duel_id) ?? { duelId: r.duel_id, mode: r.mode, day: r.day, t: Date.parse(r.finished_at), me: mine, skip: r.player ? [r.player] : [] };
      if (r.o_user && r.o_result) {
        if (r.o_player) o.skip.push(r.o_player);
        items.push({ duelId: r.duel_id, mode: r.mode, day: r.day, t: Date.parse(r.o_at!), role: r.role, me: mine, rival: { nick: r.o_nick!, tiles: r.o_result.tiles, won: r.o_result.won, account: r.o_user, player: r.o_player } });
      }
      open.set(r.duel_id, o);
    } else {
      // quem desafiou: a partida dele (conferida) se tem conta; senão, como veio no link
      const rival = r.o_user && r.o_result
        ? { nick: r.o_nick!, tiles: r.o_result.tiles, won: r.o_result.won, account: r.o_user, player: r.o_player }
        : r.rival_nick && r.rival_result
          ? { nick: r.rival_nick, tiles: r.rival_result.tiles, won: r.rival_result.won, account: null, player: null }
          : null;
      if (rival) items.push({ duelId: r.duel_id, mode: r.mode, day: r.day, t: Date.parse(r.finished_at), role: r.role, me: mine, rival });
    }
  }
  return { items, open: [...open.values()] };
}
