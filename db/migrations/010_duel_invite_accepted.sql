-- Convite de duelo aceito de verdade (specs/login-duelo/15-desafio-por-notificacao.md). Idempotente.
-- Antes, expires_at NULL queria dizer "aceito"; mas os convites feitos antes da 009 (ou por código antigo) também ficaram
-- com expires_at NULL e apareciam como aceitos, travando o modo no dia. Agora "aceito" é só accepted_at preenchido
-- (o amigo abriu pelo "Jogar" no prazo). Sem accepted_at: esperando se expires_at está no futuro; senão, expirado.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
-- os antigos sem prazo e sem aceite viram expirados (prazo = quando foram criados)
UPDATE notifications SET expires_at = created_at WHERE type = 'duel_challenge' AND expires_at IS NULL AND accepted_at IS NULL;
