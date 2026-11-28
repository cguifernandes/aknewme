-- Duelos por link salvos na conta de quem está logado (specs/login-duelo/14-duelos-na-conta-e-paginacao.md).
-- Uma linha por jogador logado em cada duelo: quem desafiou (challenger) e cada um que respondeu (responder).
-- Só ids, modo, dia, as jogadas e o placar recalculado no servidor (src/lib/replay.ts). Quem joga sem conta continua
-- só no navegador e no Redis (como antes). Idempotente.

CREATE TABLE IF NOT EXISTS link_duels (
  duel_id text NOT NULL CHECK (duel_id ~ '^[a-z0-9]{10}$'),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('challenger', 'responder')),
  mode text NOT NULL CHECK (mode IN ('emoji', 'opening', 'pistas')),
  day integer NOT NULL CHECK (day > 0),
  -- código do jogador neste navegador (o mesmo das respostas no Redis), para não contar a mesma resposta duas vezes
  player text CHECK (player ~ '^[a-z0-9]{10}$'),
  nick text NOT NULL CHECK (char_length(nick) BETWEEN 1 AND 20),
  moves jsonb NOT NULL,
  -- placar recalculado pelo servidor: { won, score, tiles }
  result jsonb NOT NULL,
  -- quem respondeu: quem desafiou, como veio no link (quando o desafiante não tem conta) ...
  rival_nick text CHECK (rival_nick IS NULL OR char_length(rival_nick) BETWEEN 1 AND 20),
  rival_result jsonb,
  -- ... e a conta do desafiante, quando ele tem: excluir essa conta apaga também este duelo
  rival_id uuid REFERENCES users (id) ON DELETE CASCADE,
  finished_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (duel_id, user_id)
);
CREATE INDEX IF NOT EXISTS link_duels_user_idx ON link_duels (user_id, day);
CREATE INDEX IF NOT EXISTS link_duels_rival_idx ON link_duels (rival_id);
