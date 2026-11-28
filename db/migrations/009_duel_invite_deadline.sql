-- Prazo do convite de duelo (specs/login-duelo/15-desafio-por-notificacao.md, "Prazo do convite"). Idempotente.
-- O convite vale 2 minutos: a trava e o prazo ficam no Redis (TTL); no banco, só expires_at na notificação.
-- expires_at no futuro = esperando o amigo; no passado = expirou (some da tela dele e quem enviou pode mandar de novo);
-- (o "aceito" é accepted_at, da 010: expires_at NULL não quer dizer aceito.)
-- Substitui o índice único "um por modo, por dia" da 008.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at timestamptz;
DROP INDEX IF EXISTS notifications_duel_challenge_once;
CREATE INDEX IF NOT EXISTS notifications_duel_challenge_idx
  ON notifications (user_id, actor_id, mode, day) WHERE type = 'duel_challenge';
