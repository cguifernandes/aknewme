-- Falhas do QA na spec login-duelo/03-seguranca (28/11). Idempotente.

-- 1. Um duelo tem um desafiante só: antes dava para gravar a partida como "challenger" com o id do duelo de outra
--    pessoa. Apaga os desafiantes repetidos (fica o primeiro a gravar) e cria o índice único parcial.
DELETE FROM link_duels d USING link_duels k
  WHERE d.role = 'challenger' AND k.role = 'challenger' AND d.duel_id = k.duel_id AND d.user_id <> k.user_id
    AND (k.finished_at, k.user_id) < (d.finished_at, d.user_id);
CREATE UNIQUE INDEX IF NOT EXISTS link_duels_one_challenger ON link_duels (duel_id) WHERE role = 'challenger';

-- 2. A troca de @ "uma vez para sempre" caía com chamadas em paralelo (cada uma via 0 trocas). O contador agora fica na
--    própria linha do usuário e é conferido e somado no mesmo UPDATE (a linha fica travada durante a gravação).
ALTER TABLE users ADD COLUMN IF NOT EXISTS handle_changes_used integer NOT NULL DEFAULT 0;
UPDATE users u SET handle_changes_used = c.n
  FROM (SELECT user_id, count(*)::int AS n FROM handle_changes GROUP BY user_id) c
  WHERE c.user_id = u.id AND u.handle_changes_used < c.n;
