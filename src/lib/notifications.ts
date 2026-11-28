import { rows } from "./db";
import { dailyNumber, type GameMode } from "./game";
import { ROOM_NOTIFICATIONS, ROOMS_ENABLED } from "./features";
import { UUID_RE } from "./users";

// Notificações dentro do site (specs/login-duelo/11-notificacoes.md): pedido de amizade recebido, pedido aceito,
// convite para sala e amigo que terminou a sala. Sem e-mail e sem push. Só ids e o tipo no banco; a frase é montada na
// tela (src/lib/notify.ts). Uma falha aqui nunca derruba a ação que a causou (quem chama usa notifyQuietly).

export type NotificationType = "friend_request" | "friend_accepted" | "room_invite" | "room_finished" | "duel_challenge" | "duel_answered";
/** Desafio por notificação (15-desafio-por-notificacao.md): o duelo e, no "te desafiou", o link para jogar. */
export type DuelRef = { id: string; mode: GameMode; day: number; href: string | null; expiresAt: string | null };
export type Room = { id: string; mode: GameMode; day: number };
/** Uma notificação como a tela recebe: quem causou (campos públicos) e, nas de sala, a sala. */
export type NotificationItem = {
  id: string;
  type: NotificationType;
  actor: { id: string; handle: string | null; name: string | null; image: string | null };
  room: Room | null;
  duel: DuelRef | null;
  createdAt: string;
  read: boolean;
};

export const LIST_MAX = 20;
const KEEP_DAYS = 30;
const DEDUPE_SECONDS = 60;

/**
 * Cria a notificação para `to`. Não cria se já existe uma igual (mesmo tipo, mesma origem e mesma sala) feita há menos
 * de 1 minuto, nem para si mesmo. Aproveita para apagar as de mais de 30 dias de quem recebe.
 */
export async function notify(to: string, type: NotificationType, actor: string, room?: Room) {
  if (to === actor) return;
  if (!ROOMS_ENABLED && ROOM_NOTIFICATIONS.includes(type)) return; // salas desligadas: nada de convite nem de "terminou a sala"
  await rows(`DELETE FROM notifications WHERE user_id = $1 AND created_at < now() - interval '${KEEP_DAYS} days'`, [to]);
  await rows(
    `INSERT INTO notifications (user_id, type, actor_id, room_id, mode, day)
     SELECT $1, $2, $3, $4, $5, $6
     WHERE NOT EXISTS (
       SELECT 1 FROM notifications n
       WHERE n.user_id = $1 AND n.type = $2 AND n.actor_id = $3 AND n.room_id IS NOT DISTINCT FROM $4
         AND n.created_at > now() - interval '${DEDUPE_SECONDS} seconds')`,
    [to, type, actor, room?.id ?? null, room?.mode ?? null, room?.day ?? null],
  );
}

/**
 * Apaga as notificações de `type` que `actor` gerou para `to` (ex.: o pedido de amizade que foi cancelado, recusado ou
 * aceito: sem isso a bolinha de quem recebeu ficava com "1" para sempre). Nunca falha (a ação já foi feita).
 */
export async function dropNotifications(to: string, type: NotificationType, actor: string) {
  await rows("DELETE FROM notifications WHERE user_id = $1 AND type = $2 AND actor_id = $3", [to, type, actor]).catch((e) =>
    console.error("[notify] drop", (e as { code?: string })?.code ?? (e as Error)?.name),
  );
}

/** O mesmo, sem nunca falhar: a ação que causou a notificação (pedido, convite, placar) já foi feita. */
export async function notifyQuietly(to: string | string[], type: NotificationType, actor: string, room?: Room) {
  for (const user of [to].flat()) {
    await notify(user, type, actor, room).catch((e) => console.error("[notify]", (e as { code?: string })?.code ?? (e as Error)?.name));
  }
}

type Row = {
  id: string; type: NotificationType; actor_id: string; handle: string | null; name: string | null; image: string | null; room_id: string | null;
  mode: GameMode | null; day: number | null; duel_id: string | null; expires_at: string | null; created_at: string; read: boolean;
  ch_nick: string | null; ch_result: { won: boolean; tiles: string[] } | null;
};

/**
 * Tipos que aparecem: os de sala só com as salas ligadas. Do convite de duelo, só o de hoje ainda não aceito; o sem
 * prazo (antigo) e o já aceito somem. O que passou do prazo vem também: o navegador esconde (e tira da bolinha) para
 * quem não jogou o modo, e mostra "Ver duelo" para quem já tem o resultado (15-desafio-por-notificacao.md).
 */
const visible = (alias: string) =>
  `(${ROOMS_ENABLED ? "TRUE" : `${alias}.type NOT IN ('room_invite', 'room_finished')`}) AND NOT (${alias}.type = 'duel_challenge' AND (${alias}.day < $2 OR ${alias}.accepted_at IS NOT NULL OR ${alias}.expires_at IS NULL))`;

/** O link do duelo (o mesmo do duelo por link), com a partida de quem desafiou salva na conta */
function duelHref(r: Row): string | null {
  if (!r.duel_id || !r.mode || !r.day || !r.ch_nick || !r.ch_result) return null;
  const q = new URLSearchParams({ m: r.mode, day: String(r.day), vs: r.ch_nick, g: r.ch_result.tiles.join(""), w: r.ch_result.won ? "1" : "0", id: r.duel_id });
  return `/duel?${q}`;
}

/** As últimas 20 de quem está logado (da mais nova para a mais velha) e quantas não foram lidas. */
export async function listNotifications(me: string): Promise<{ unread: number; items: NotificationItem[]; now: string }> {
  const today = dailyNumber();
  const [list, [{ n, now }]] = await Promise.all([
    rows<Row>(
      `SELECT n.id, n.type, n.actor_id, u.handle, u.name, u.image, n.room_id, n.mode, n.day, n.duel_id, n.expires_at, n.created_at,
              n.read_at IS NOT NULL AS read, ld.nick AS ch_nick, ld.result AS ch_result
       FROM notifications n JOIN users u ON u.id = n.actor_id
       LEFT JOIN link_duels ld ON n.type = 'duel_challenge' AND ld.duel_id = n.duel_id AND ld.user_id = n.actor_id AND ld.role = 'challenger'
       WHERE n.user_id = $1 AND ${visible("n")} ORDER BY n.created_at DESC LIMIT ${LIST_MAX}`,
      [me, today],
    ),
    // now: o relógio do banco (o mesmo do expires_at dos convites), para o navegador contar o prazo no mesmo relógio
    rows<{ n: number; now: string }>(`SELECT count(*)::int AS n, now() AS now FROM notifications x WHERE x.user_id = $1 AND x.read_at IS NULL AND ${visible("x")}`, [me, today]),
  ]);
  return {
    now: new Date(now).toISOString(),
    unread: n,
    items: list.map((r) => ({
      id: r.id,
      type: r.type,
      actor: { id: r.actor_id, handle: r.handle, name: r.name, image: r.image },
      room: r.room_id && r.mode && r.day ? { id: r.room_id, mode: r.mode, day: r.day } : null,
      duel: r.duel_id && r.mode && r.day ? { id: r.duel_id, mode: r.mode, day: r.day, href: duelHref(r), expiresAt: r.expires_at } : null,
      createdAt: r.created_at,
      read: r.read,
    })),
  };
}

/** Marca como lida uma (pelo id) ou todas. Só as de quem está logado. */
export async function markRead(me: string, id?: string) {
  if (id !== undefined && !UUID_RE.test(id)) return;
  await rows(`UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL${id ? " AND id = $2" : ""}`, id ? [me, id] : [me]);
}
