-- Placar dos duelos entre dois jogadores (specs/login-duelo/10-amigos.md, F2). Idempotente.
-- As salas são apagadas um dia depois do desafio (R14), então o "2 x 0" da tela de amigos não pode ser contado nelas:
-- cada vitória de uma sala vira uma linha aqui, gravada quando o segundo dos dois termina. Empate não gera linha.
-- Só ids. duel_id não é chave estrangeira de propósito: a linha fica depois que a sala some. Excluir a conta de
-- qualquer um dos dois apaga as linhas (cascata).
CREATE TABLE IF NOT EXISTS duel_wins (
  duel_id text NOT NULL,
  winner_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  loser_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (duel_id, winner_id, loser_id),
  CHECK (winner_id <> loser_id)
);
CREATE INDEX IF NOT EXISTS duel_wins_pair_idx ON duel_wins (winner_id, loser_id);
CREATE INDEX IF NOT EXISTS duel_wins_loser_idx ON duel_wins (loser_id);
