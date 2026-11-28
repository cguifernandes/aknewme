import { rank } from "./challenge";
import { rows } from "./db";
import type { GameMode } from "./game";
import { ROOMS_ENABLED } from "./features";
import { dropNotifications, notifyQuietly } from "./notifications";

// Amizades (specs/login-duelo, R6 a R8). Pedido = uma linha (quem pediu → quem recebeu, pending).
// Aceito = as duas direções com accepted. Remover apaga as duas direções na hora.

export const MAX_PENDING = 50;

export type Person = { id: string; handle: string | null; name: string | null; image: string | null };
/** `wins` x `losses`: duelos em sala entre vocês dois (duel_wins); `roomToday`: sala de hoje em que os dois estão. */
export type Friend = Person & {
  playedToday: boolean; wins: number; losses: number; roomToday: string | null;
  /** quando a amizade foi aceita (a 2ª linha da amizade nasce no aceite) */
  since: string;
  /** duelos por link salvos na conta dos dois (link_duels): placar seu contra ele e quando foi o último */
  duels: { wins: number; losses: number; ties: number; last: string | null };
};
/** Pedido de amizade com o que ajuda a decidir: quando pediu, amigos em comum e desde quando joga (a conta) */
export type RequestPerson = Person & { askedAt: string };

type Result = { won: boolean; tiles: string[] };
/** Placar dos duelos por link entre você e cada amigo da página (os dois com a partida salva na conta). */
async function duelScores(me: string, ids: string[]) {
  const out = new Map<string, Friend["duels"]>(ids.map((id) => [id, { wins: 0, losses: 0, ties: 0, last: null }]));
  if (!ids.length) return out;
  const list = await rows<{ friend: string; mode: GameMode; mine: Result; theirs: Result; at: string }>(
    `SELECT o.user_id AS friend, m.mode, m.result AS mine, o.result AS theirs, greatest(m.finished_at, o.finished_at) AS at
     FROM link_duels m JOIN link_duels o ON o.duel_id = m.duel_id AND o.user_id <> m.user_id AND o.role <> m.role
     WHERE m.user_id = $1 AND o.user_id = ANY($2::uuid[])`,
    [me, ids],
  );
  for (const d of list) {
    const s = out.get(d.friend)!;
    const diff = rank(d.mode, d.mine.tiles, d.mine.won) - rank(d.mode, d.theirs.tiles, d.theirs.won);
    if (diff > 0) s.wins++;
    else if (diff < 0) s.losses++;
    else s.ties++;
    const at = new Date(d.at).toISOString();
    if (!s.last || at > s.last) s.last = at;
  }
  return out;
}

/** Itens por página (lista de amigos, pedidos recebidos e enviados): 14-duelos-na-conta-e-paginacao.md */
export const PAGE_SIZE = 10;
/** Página pedida (a partir de 1; qualquer coisa estranha vira 1) */
export const pageNumber = (p: unknown) => Math.max(1, Math.min(10_000, Math.floor(Number(p)) || 1));
type Page<T> = { items: T[]; total: number; page: number };

/**
 * Uma página dos amigos (10, por username: ordem estável) e o total. Sem as salas (13-escopo-lancamento.md) cada
 * amigo vem só com a pessoa: sem placar, sem "jogou hoje" e sem sala de hoje.
 */
export async function friendsPage(me: string, today: number, page: number): Promise<Page<Friend>> {
  const off = (page - 1) * PAGE_SIZE;
  const [items, [{ total }]] = await Promise.all([
    ROOMS_ENABLED
      ? rows<Friend>(
          `SELECT u.id, u.handle, u.name, u.image,
             EXISTS (SELECT 1 FROM duel_players p JOIN duels d ON d.id = p.duel_id
                     WHERE p.user_id = u.id AND p.status = 'finished' AND d.day = $2) AS "playedToday",
             (SELECT count(*)::int FROM duel_wins w WHERE w.winner_id = $1 AND w.loser_id = u.id) AS wins,
             (SELECT count(*)::int FROM duel_wins w WHERE w.winner_id = u.id AND w.loser_id = $1) AS losses,
             (SELECT d.id FROM duels d
                JOIN duel_players a ON a.duel_id = d.id AND a.user_id = $1 AND a.status <> 'declined'
                JOIN duel_players b ON b.duel_id = d.id AND b.user_id = u.id AND b.status <> 'declined'
              WHERE d.day = $2 ORDER BY d.created_at DESC LIMIT 1) AS "roomToday"
           FROM friendships f JOIN users u ON u.id = f.friend_id
           WHERE f.user_id = $1 AND f.status = 'accepted'
           ORDER BY u.handle, u.id LIMIT ${PAGE_SIZE} OFFSET $3`,
          [me, today, off],
        )
      : rows<Friend>(
          `SELECT u.id, u.handle, u.name, u.image, false AS "playedToday", 0 AS wins, 0 AS losses, NULL AS "roomToday",
             greatest(f.created_at, coalesce(r.created_at, f.created_at)) AS since
           FROM friendships f JOIN users u ON u.id = f.friend_id
           LEFT JOIN friendships r ON r.user_id = f.friend_id AND r.friend_id = f.user_id
           WHERE f.user_id = $1 AND f.status = 'accepted'
           ORDER BY u.handle, u.id LIMIT ${PAGE_SIZE} OFFSET $2`,
          [me, off],
        ),
    rows<{ total: number }>("SELECT count(*)::int AS total FROM friendships WHERE user_id = $1 AND status = 'accepted'", [me]),
  ]);
  const scores = await duelScores(me, items.map((f) => f.id));
  for (const f of items) {
    f.since = new Date(f.since ?? Date.now()).toISOString();
    f.duels = scores.get(f.id)!;
  }
  return { items, total, page };
}

/** Uma página dos pedidos recebidos (`incoming`, de quem pediu) ou enviados (`outgoing`), do mais novo ao mais velho, e o total. */
export async function requestsPage(me: string, kind: "incoming" | "outgoing", page: number): Promise<Page<RequestPerson>> {
  const [other, mine] = kind === "incoming" ? ["user_id", "friend_id"] : ["friend_id", "user_id"];
  const [items, [{ total }]] = await Promise.all([
    rows<RequestPerson>(
      `SELECT u.id, u.handle, u.name, u.image, f.created_at AS "askedAt"
       FROM friendships f JOIN users u ON u.id = f.${other}
       WHERE f.${mine} = $1 AND f.status = 'pending' ORDER BY f.created_at DESC, u.handle, u.id LIMIT ${PAGE_SIZE} OFFSET $2`,
      [me, (page - 1) * PAGE_SIZE],
    ),
    rows<{ total: number }>(`SELECT count(*)::int AS total FROM friendships WHERE ${mine} = $1 AND status = 'pending'`, [me]),
  ]);
  for (const p of items) p.askedAt = new Date(p.askedAt).toISOString();
  return { items, total, page };
}

/**
 * A carga de /friends (1ª no servidor e cada recarga do painel): só a página pedida dos amigos, dos pedidos recebidos
 * (a seção "Pedidos de amizade" abre já com eles, spec 16) e dos enviados, com os totais. Nunca a lista inteira.
 */
export async function friendLists(me: string, today: number, friendsAt = 1, outgoingAt = 1, incomingAt = 1) {
  const [f, out, inc] = await Promise.all([
    friendsPage(me, today, friendsAt),
    requestsPage(me, "outgoing", outgoingAt),
    requestsPage(me, "incoming", incomingAt),
  ]);
  return {
    friends: f.items, friendsTotal: f.total, friendsPage: f.page,
    incoming: inc.items, incomingCount: inc.total, incomingPage: inc.page,
    outgoing: out.items, outgoingTotal: out.total, outgoingPage: out.page,
  };
}

export type RequestOutcome = "sent" | "already_sent" | "not_found" | "self" | "already_friends" | "they_asked_you" | "too_many_pending";

/** Pedido de amizade pelo handle (o handle já foi validado no formato). */
export async function requestFriend(me: string, handle: string): Promise<RequestOutcome> {
  const [target] = await rows<{ id: string }>("SELECT id FROM users WHERE handle = $1", [handle]);
  if (!target) return "not_found";
  if (target.id === me) return "self";
  const links = await rows<{ user_id: string; status: string }>(
    "SELECT user_id, status FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)",
    [me, target.id],
  );
  if (links.some((l) => l.status === "accepted")) return "already_friends";
  if (links.some((l) => l.user_id === target.id)) return "they_asked_you";
  if (links.length) return "already_sent";
  const [{ n }] = await rows<{ n: number }>("SELECT count(*)::int AS n FROM friendships WHERE user_id = $1 AND status = 'pending'", [me]);
  if (n >= MAX_PENDING) return "too_many_pending";
  await rows("INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING", [me, target.id]);
  await notifyQuietly(target.id, "friend_request", me); // "Bia quer ser sua amiga."
  return "sent";
}

/** Aceita o pedido de `from` (só quem recebeu aceita). false se não havia pedido. */
export async function acceptFriend(me: string, from: string): Promise<boolean> {
  const done = await rows(
    `WITH acc AS (
       UPDATE friendships SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
       RETURNING user_id, friend_id)
     INSERT INTO friendships (user_id, friend_id, status) SELECT friend_id, user_id, 'accepted' FROM acc
     ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted' RETURNING user_id`,
    [from, me],
  );
  if (done.length > 0) {
    await dropNotifications(me, "friend_request", from); // o pedido já foi respondido
    await notifyQuietly(from, "friend_accepted", me); // "Leo aceitou seu pedido de amizade."
  }
  return done.length > 0;
}

/** Recusa o pedido de `from` (só quem recebeu recusa). false se não havia pedido. Recusar não notifica quem pediu. */
export async function declineFriend(me: string, from: string): Promise<boolean> {
  const gone = await rows("DELETE FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = 'pending' RETURNING user_id", [from, me]);
  await dropNotifications(me, "friend_request", from);
  return gone.length > 0;
}

/** Remove a amizade (ou cancela o pedido) dos dois lados, e os avisos de pedido entre os dois (cancelado = some do outro lado). */
export async function removeFriend(me: string, other: string) {
  await rows("DELETE FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)", [me, other]);
  await dropNotifications(other, "friend_request", me);
  await dropNotifications(me, "friend_request", other);
}
