-- Login opcional e duelo com amigos (specs/login-duelo). Idempotente: roda do zero e de novo sem erro.
-- Dados pessoais: só os campos de specs/login-duelo/03-seguranca.md (sem e-mail, sem tokens OAuth).

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle text UNIQUE CHECK (handle ~ '^[a-z0-9_]{3,20}$'),
  name text CHECK (char_length(name) <= 64),
  image text CHECK (char_length(image) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Uma linha por login de provedor (Google, Discord) ligado a um usuário.
CREATE TABLE IF NOT EXISTS accounts (
  provider text NOT NULL CHECK (provider IN ('google', 'discord')),
  provider_account_id text NOT NULL CHECK (char_length(provider_account_id) <= 64),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  PRIMARY KEY (provider, provider_account_id)
);
CREATE INDEX IF NOT EXISTS accounts_user_idx ON accounts (user_id);

-- Pedido: (quem pediu, quem recebeu, pending). Aceito: as duas direções com accepted.
CREATE TABLE IF NOT EXISTS friendships (
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id <> friend_id)
);
CREATE INDEX IF NOT EXISTS friendships_friend_idx ON friendships (friend_id);

-- Sala de um desafio do dia. origin aceita 'discord' no futuro (fora do escopo agora).
CREATE TABLE IF NOT EXISTS duels (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9]{10}$'),
  mode text NOT NULL CHECK (mode IN ('emoji', 'opening', 'pistas')),
  day integer NOT NULL CHECK (day > 0),
  owner_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  origin text NOT NULL DEFAULT 'web' CHECK (origin IN ('web', 'discord')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS duels_day_idx ON duels (day);

CREATE TABLE IF NOT EXISTS duel_players (
  duel_id text NOT NULL REFERENCES duels (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('invited', 'joined', 'declined', 'finished')),
  guesses jsonb,
  result jsonb,
  finished_at timestamptz,
  PRIMARY KEY (duel_id, user_id)
);
CREATE INDEX IF NOT EXISTS duel_players_user_idx ON duel_players (user_id);
