-- Troca de handle (specs/login-duelo, R5a e R5b). Idempotente: roda do zero e de novo sem erro.
-- Amizades, salas e placares são ligados ao user_id, então a troca não mexe em nada disso.

-- Handle antigo guardado para a mesma conta por um tempo (30 dias): ninguém mais consegue pegá-lo nesse período.
-- Um handle só pode estar reservado por uma conta de cada vez (PK). Conta excluída = reservas apagadas junto.
CREATE TABLE IF NOT EXISTS handle_reservations (
  handle text PRIMARY KEY CHECK (handle ~ '^[a-z0-9_]{3,20}$'),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  reserved_until timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS handle_reservations_user_idx ON handle_reservations (user_id);

-- Uma linha por troca (a primeira escolha não conta), para limitar as trocas por período.
CREATE TABLE IF NOT EXISTS handle_changes (
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS handle_changes_user_idx ON handle_changes (user_id, changed_at);
