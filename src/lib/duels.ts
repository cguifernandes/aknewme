import { randomInt } from "node:crypto";
import { rank } from "./challenge";
import { rows } from "./db";
import { notifyQuietly } from "./notifications";
import type { GameMode } from "./game";
import type { Move, Replayed } from "./replay";

// Salas de duelo com amigos (specs/login-duelo, R9 a R14). Uma sala é de um modo e de um dia (o desafio de hoje no
// horário de Brasília, como o resto do servidor) e expira com ele. Até 4 jogadores: o dono e 3 amigos aceitos.
// Sem espiar: as jogadas de quem terminou só aparecem para quem também já terminou.

export const ROOM_MAX = 4;
export const ROOM_ID_RE = /^[a-z0-9]{10}$/;
export const MODES: GameMode[] = ["emoji", "opening", "pistas"];
export type PlayerStatus = "invited" | "joined" | "declined" | "finished";

const newRoomId = () => Array.from({ length: 10 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[randomInt(36)]).join("");

/** Cria a sala com os convidados (todos amigos aceitos do dono). "not_friends" se algum não for. */
export async function createRoom(owner: string, mode: GameMode, day: number, invite: string[]): Promise<string | "not_friends"> {
  const ok = await rows<{ friend_id: string }>(
    "SELECT friend_id FROM friendships WHERE user_id = $1 AND status = 'accepted' AND friend_id = ANY($2::uuid[])",
    [owner, invite],
  );
  if (ok.length !== invite.length) return "not_friends";
  // R14: sala de dias que já passaram some (fica a de ontem, pela diferença de fuso de quem joga)
  await rows("DELETE FROM duels WHERE day < $1", [day - 1]);
  const id = newRoomId();
  await rows(
    `WITH d AS (INSERT INTO duels (id, mode, day, owner_id) VALUES ($1, $2, $3, $4) RETURNING id)
     INSERT INTO duel_players (duel_id, user_id, status)
     SELECT d.id, x.uid, CASE WHEN x.uid = $4 THEN 'joined' ELSE 'invited' END FROM d, unnest($5::uuid[]) AS x(uid)`,
    [id, mode, day, owner, [owner, ...invite]],
  );
  await notifyQuietly(invite, "room_invite", owner, { id, mode, day }); // "Gustavo te desafiou no Emoji #203."
  return id;
}

export type RoomSummary = { id: string; mode: GameMode; day: number; ownerHandle: string | null; status: PlayerStatus; players: number };

/** Salas de hoje em que o usuário está (convites incluídos), da mais nova para a mais velha. */
export async function myRooms(me: string, today: number) {
  return rows<RoomSummary>(
    `SELECT d.id, d.mode, d.day, o.handle AS "ownerHandle", p.status,
       (SELECT count(*)::int FROM duel_players q WHERE q.duel_id = d.id) AS players
     FROM duel_players p JOIN duels d ON d.id = p.duel_id JOIN users o ON o.id = d.owner_id
     WHERE p.user_id = $1 AND d.day = $2 ORDER BY d.created_at DESC LIMIT 20`,
    [me, today],
  );
}

type PlayerRow = { id: string; handle: string | null; name: string | null; image: string | null; status: PlayerStatus; result: Replayed | null };
export type Room = { id: string; mode: GameMode; day: number; ownerId: string; players: PlayerRow[] };

/** A sala, se existir e o usuário estiver nela (para quem está fora, ela "não existe"). */
export async function loadRoom(id: string, me: string): Promise<Room | null> {
  if (!ROOM_ID_RE.test(id)) return null;
  const [d] = await rows<{ id: string; mode: GameMode; day: number; ownerId: string }>(
    `SELECT id, mode, day, owner_id AS "ownerId" FROM duels WHERE id = $1`,
    [id],
  );
  if (!d) return null;
  const players = await rows<PlayerRow>(
    `SELECT u.id, u.handle, u.name, u.image, p.status, p.result FROM duel_players p JOIN users u ON u.id = p.user_id
     WHERE p.duel_id = $1 ORDER BY (p.user_id = $2) DESC, p.finished_at NULLS LAST, u.handle`,
    [id, d.ownerId],
  );
  return players.some((p) => p.id === me) ? { ...d, players } : null;
}

/** O que o usuário pode ver da sala: o placar dos outros só depois que ele mesmo terminou. */
export function roomView(room: Room, me: string) {
  const mine = room.players.find((p) => p.id === me)!;
  const done = mine.status === "finished";
  return {
    id: room.id,
    mode: room.mode,
    day: room.day,
    ownerId: room.ownerId,
    max: ROOM_MAX,
    me: { id: me, status: mine.status },
    players: room.players.map(({ result, ...p }) => ({ ...p, result: p.status === "finished" && (done || p.id === me) ? result : null })),
  };
}

/** Entra ou recusa o convite. "full" se a sala já tem 4 jogando. */
export async function answerInvite(room: Room, me: string, join: boolean): Promise<PlayerStatus | "full"> {
  const mine = room.players.find((p) => p.id === me)!;
  if (mine.status === "joined" || mine.status === "finished") return mine.status;
  if (join && room.players.filter((p) => p.status === "joined" || p.status === "finished").length >= ROOM_MAX) return "full";
  const status = join ? "joined" : "declined";
  await rows("UPDATE duel_players SET status = $3 WHERE duel_id = $1 AND user_id = $2 AND status IN ('invited', 'declined')", [room.id, me, status]);
  return status;
}

/** Grava o placar recalculado (uma vez só por jogador e sala: R13). false se já tinha terminado. */
export async function saveResult(roomId: string, me: string, moves: Move[], result: Replayed): Promise<boolean> {
  const saved = await rows(
    `UPDATE duel_players SET status = 'finished', guesses = $3::jsonb, result = $4::jsonb, finished_at = now()
     WHERE duel_id = $1 AND user_id = $2 AND status <> 'finished' RETURNING user_id`,
    [roomId, me, JSON.stringify(moves), JSON.stringify(result)],
  );
  return saved.length > 0;
}

/**
 * Placar entre jogadores (10-amigos.md, F2): quando `me` termina, compara o placar dele com o de cada um que já
 * terminou a mesma sala (a mesma regra do duelo: rank de challenge.ts) e grava quem venceu. Empate não grava nada.
 * Fica em duel_wins porque a sala some no dia seguinte. Gravar duas vezes não duplica (chave primária).
 * Com `day` (a rota do placar manda), também avisa quem já tinha terminado a sala (11-notificacoes.md).
 */
export async function recordWins(roomId: string, mode: GameMode, me: string, day?: number) {
  const done = await rows<{ id: string; result: Replayed | null }>(
    "SELECT user_id AS id, result FROM duel_players WHERE duel_id = $1 AND status = 'finished'",
    [roomId],
  );
  // quem já tinha terminado fica sabendo que mais um terminou: "Amanda terminou o duelo. Veja o placar."
  if (day) await notifyQuietly(done.filter((p) => p.id !== me).map((p) => p.id), "room_finished", me, { id: roomId, mode, day });
  const score = (r: Replayed) => rank(mode, r.tiles, r.won);
  const mine = done.find((p) => p.id === me)?.result;
  if (!mine) return;
  for (const p of done) {
    if (p.id === me || !p.result) continue;
    const d = score(mine) - score(p.result);
    if (d === 0) continue;
    await rows("INSERT INTO duel_wins (duel_id, winner_id, loser_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [roomId, d > 0 ? me : p.id, d > 0 ? p.id : me]);
  }
}
