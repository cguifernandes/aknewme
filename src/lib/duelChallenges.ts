import { createClient } from "redis";
import { rows } from "./db";
import type { GameMode } from "./game";

// Duelo com um amigo por notificação (specs/login-duelo/15-desafio-por-notificacao.md, migrações 008 e 009). Quem
// envia já tem a partida salva na conta como "challenger" (link_duels): a notificação leva só o id do duelo, o modo, o
// dia e o prazo (expires_at). Só entre amigos aceitos.
//
// Prazo do convite: vale INVITE_SECONDS (2 min). A trava fica no Redis (chave por quem envia + amigo + modo + dia, com
// TTL): dentro do prazo não dá para mandar de novo. Se o amigo não abrir pelo "Jogar" no prazo, o convite expira sozinho
// (some da tela dele) e dá para mandar de novo. Se abrir no prazo (aceitar), accepted_at é preenchido (migração 010) e
// aquele modo fica fechado para ele no dia. Só accepted_at diz "aceito": convite sem ele e sem prazo no futuro (inclusive
// os antigos, de antes do prazo) está expirado. Sem Redis (ou fora do ar), o banco faz a mesma conta pelo expires_at.

/** Quanto tempo o convite vale (constante única). DUEL_INVITE_SECONDS só para os testes encurtarem o prazo. */
export const INVITE_SECONDS =
  Number(process.env.DUEL_INVITE_SECONDS) > 0
    ? Number(process.env.DUEL_INVITE_SECONDS)
    : 120;

export type ChallengeOutcome =
  | { out: "sent"; expiresIn: number }
  | { out: "pending"; retryIn: number }
  | { out: "accepted" | "not_friend" | "no_duel" };

const REDIS_URL = process.env.KV_REDIS_URL;
const newClient = () =>
  createClient({
    url: REDIS_URL,
    socket: { connectTimeout: 1500, reconnectStrategy: false },
  }).on("error", () => {});
let redis: ReturnType<typeof newClient> | null = null;
/** O Redis, se houver e responder; null = segue só com o banco */
async function kv() {
  if (!REDIS_URL) return null;
  try {
    const r = (redis ??= newClient());
    if (!r.isOpen) await r.connect();
    return r;
  } catch {
    redis = null;
    return null;
  }
}
const lockKey = (me: string, friend: string, mode: GameMode, day: number) =>
  `duelinv:${me}:${friend}:${mode}:${day}`;

/** Segundos que faltam do convite esperando de `me` para `friend` (pelo banco); null se não há. */
async function pendingFor(
  me: string,
  friend: string,
  mode: GameMode,
  day: number,
): Promise<number | null> {
  const [p] = await rows<{ s: number }>(
    `SELECT ceil(extract(epoch FROM expires_at - now()))::int AS s FROM notifications
     WHERE user_id = $1 AND actor_id = $2 AND type = 'duel_challenge' AND mode = $3 AND day = $4
       AND accepted_at IS NULL AND expires_at > now()`,
    [friend, me, mode, day],
  );
  return p ? Math.max(1, p.s) : null;
}

/** Manda o duelo `duelId` (de `mode`, `day`) de `me` para `friend` como notificação, com o prazo do convite. */
export async function sendDuelChallenge(
  me: string,
  friend: string,
  mode: GameMode,
  day: number,
  duelId: string,
): Promise<ChallengeOutcome> {
  const r = await kv();
  const key = lockKey(me, friend, mode, day);
  // a trava: um convite esperando por vez (SET NX com o prazo); dentro do prazo, diz quanto falta
  if (r) {
    const got = await r
      .set(key, duelId, { NX: true, EX: INVITE_SECONDS })
      .catch(() => "skip");
    if (got === null) {
      const ttl = await r.ttl(key).catch(() => -1);
      return {
        out: "pending",
        retryIn:
          ttl > 0 ? ttl : ((await pendingFor(me, friend, mode, day)) ?? 1),
      };
    }
  }
  // caminho rápido, numa consulta: apaga o convite expirado (se houver) e cria o novo se são amigos, a partida está
  // salva e não há outro esperando nem um já aceito no dia
  const [made] = await Promise.all([
    rows(
      `WITH old AS (
         DELETE FROM notifications WHERE user_id = $1 AND actor_id = $2 AND type = 'duel_challenge' AND mode = $3 AND day = $4
           AND accepted_at IS NULL AND (expires_at IS NULL OR expires_at <= now()))
       INSERT INTO notifications (user_id, type, actor_id, mode, day, duel_id, expires_at)
       SELECT $1, 'duel_challenge', $2, $3, $4, $5, now() + $6::int * interval '1 second'
       WHERE EXISTS (SELECT 1 FROM friendships WHERE user_id = $2 AND friend_id = $1 AND status = 'accepted')
         AND EXISTS (SELECT 1 FROM link_duels WHERE duel_id = $5 AND user_id = $2 AND role = 'challenger' AND mode = $3 AND day = $4)
         AND NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = $1 AND actor_id = $2 AND type = 'duel_challenge'
           AND mode = $3 AND day = $4 AND (accepted_at IS NOT NULL OR expires_at > now()))
       RETURNING 1`,
      [friend, me, mode, day, duelId, INVITE_SECONDS],
    ),
    rows(
      "DELETE FROM notifications WHERE user_id = $1 AND created_at < now() - interval '30 days'",
      [friend],
    ),
  ]);
  if (made.length) return { out: "sent", expiresIn: INVITE_SECONDS };
  // não criou: o motivo
  const [ok] = await rows<{
    friend: boolean;
    duel: boolean;
    accepted: boolean;
  }>(
    `SELECT EXISTS (SELECT 1 FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = 'accepted') AS friend,
            EXISTS (SELECT 1 FROM link_duels WHERE duel_id = $3 AND user_id = $1 AND role = 'challenger' AND mode = $4 AND day = $5) AS duel,
            EXISTS (SELECT 1 FROM notifications WHERE user_id = $2 AND actor_id = $1 AND type = 'duel_challenge' AND mode = $4
              AND day = $5 AND accepted_at IS NOT NULL) AS accepted`,
    [me, friend, duelId, mode, day],
  );
  const pending =
    ok.friend && ok.duel && !ok.accepted
      ? await pendingFor(me, friend, mode, day)
      : null;
  if (pending) return { out: "pending", retryIn: pending }; // (sem Redis, a trava é esta)
  await r?.del(key).catch(() => {}); // não mandou: solta a trava
  return { out: !ok.friend ? "not_friend" : !ok.duel ? "no_duel" : "accepted" };
}

/** Os convites de `me` para `friend` no dia: esperando (com os segundos que faltam) ou aceitos. Expirados não contam. */
export async function sentChallengeModes(
  me: string,
  friend: string,
  day: number,
) {
  return rows<{
    mode: GameMode;
    status: "pending" | "accepted" | "answered";
    remaining: number | null;
  }>(
    // answered = o amigo já terminou aquele modo (a resposta dele está em link_duels): a janela mostra "Ver placar"
    `SELECT mode, CASE WHEN EXISTS (SELECT 1 FROM link_duels r WHERE r.duel_id = notifications.duel_id AND r.user_id = $1 AND r.role = 'responder')
                     THEN 'answered' WHEN accepted_at IS NOT NULL THEN 'accepted' ELSE 'pending' END AS status,
            CASE WHEN accepted_at IS NOT NULL THEN NULL ELSE greatest(1, ceil(extract(epoch FROM expires_at - now())))::int END AS remaining
     FROM notifications WHERE user_id = $1 AND actor_id = $2 AND type = 'duel_challenge' AND day = $3
       AND (accepted_at IS NOT NULL OR expires_at > now())`,
    [friend, me, day],
  );
}

/**
 * O amigo abriu o duelo pelo "Jogar" (aceitou): no prazo, o convite vira aceito (accepted_at, lido) e a trava sai do
 * Redis (aquele modo fica fechado no dia pelo banco). "expired" = abriu depois do prazo; "none" = não há convite (duelo
 * por link comum); "ok" também para quem já tinha aceitado.
 */
export async function acceptDuelChallenge(
  me: string,
  duelId: string,
): Promise<"ok" | "expired" | "none"> {
  const done = await rows<{ actor_id: string; mode: GameMode; day: number }>(
    `UPDATE notifications SET accepted_at = now(), read_at = coalesce(read_at, now())
     WHERE user_id = $1 AND type = 'duel_challenge' AND duel_id = $2 AND accepted_at IS NULL AND expires_at > now()
     RETURNING actor_id, mode, day`,
    [me, duelId],
  );
  if (done.length) {
    const r = await kv();
    for (const d of done)
      await r?.del(lockKey(d.actor_id, me, d.mode, d.day)).catch(() => {});
    return "ok";
  }
  const [n] = await rows<{ accepted: boolean }>(
    "SELECT bool_or(accepted_at IS NOT NULL) AS accepted FROM notifications WHERE user_id = $1 AND type = 'duel_challenge' AND duel_id = $2 HAVING count(*) > 0",
    [me, duelId],
  );
  return !n ? "none" : n.accepted ? "ok" : "expired";
}

/**
 * Aceite depois do prazo (15, "Amigo que já jogou o modo"): vale se quem recebeu já jogou aquele modo e dia e mandou
 * as jogadas, que `valid(mode, day)` recalcula. Sem isso, o convite vencido continua vencido (410).
 */
export async function acceptLateWithGame(
  me: string,
  duelId: string,
  valid: (mode: GameMode, day: number) => boolean,
): Promise<boolean> {
  const [n] = await rows<{ mode: GameMode; day: number }>(
    "SELECT mode, day FROM notifications WHERE user_id = $1 AND type = 'duel_challenge' AND duel_id = $2 AND accepted_at IS NULL LIMIT 1",
    [me, duelId],
  );
  if (!n || !valid(n.mode, n.day)) return false;
  const done = await rows<{ actor_id: string }>(
    `UPDATE notifications SET accepted_at = now(), read_at = coalesce(read_at, now())
     WHERE user_id = $1 AND type = 'duel_challenge' AND duel_id = $2 AND accepted_at IS NULL RETURNING actor_id`,
    [me, duelId],
  );
  const r = await kv();
  for (const d of done)
    await r?.del(lockKey(d.actor_id, me, n.mode, n.day)).catch(() => {});
  return done.length > 0;
}

/**
 * `me` terminou o duelo `duelId`: se ele chegou por um convite por notificação, avisa quem enviou
 * ("Bia respondeu seu duelo no Emoji"). Uma vez só por duelo. Nunca falha (o placar já foi salvo).
 */
export async function notifyAnswered(me: string, duelId: string) {
  await rows(
    `INSERT INTO notifications (user_id, type, actor_id, mode, day, duel_id)
     SELECT n.actor_id, 'duel_answered', n.user_id, n.mode, n.day, n.duel_id FROM notifications n
     WHERE n.user_id = $1 AND n.type = 'duel_challenge' AND n.duel_id = $2
       AND NOT EXISTS (SELECT 1 FROM notifications a WHERE a.user_id = n.actor_id AND a.actor_id = $1 AND a.type = 'duel_answered' AND a.duel_id = $2)
     LIMIT 1`,
    [me, duelId],
  ).catch((e) =>
    console.error(
      "[notify] answered",
      (e as { code?: string })?.code ?? (e as Error)?.name,
    ),
  );
}
