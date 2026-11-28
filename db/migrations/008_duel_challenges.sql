-- Desafio a um amigo por notificação (specs/login-duelo/15-desafio-por-notificacao.md). Idempotente.
-- Dois tipos novos: duel_challenge ("Gui te desafiou no Emoji #202.") e duel_answered ("Bia respondeu seu desafio no
-- Emoji."). Só ids: o duelo (duel_id, o mesmo de link_duels), o modo e o dia. A cascata já vem de user_id e actor_id.
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('friend_request', 'friend_accepted', 'room_invite', 'room_finished', 'duel_challenge', 'duel_answered'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS duel_id text CHECK (duel_id IS NULL OR duel_id ~ '^[a-z0-9]{10}$');
-- um desafio por modo, por dia, para cada amigo (o servidor recusa repetido, mesmo com dois cliques ao mesmo tempo)
CREATE UNIQUE INDEX IF NOT EXISTS notifications_duel_challenge_once
  ON notifications (user_id, actor_id, mode, day) WHERE type = 'duel_challenge';
