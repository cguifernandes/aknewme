-- Notificações dentro do site (specs/login-duelo/11-notificacoes.md). Idempotente.
-- Só ids e o tipo: quem recebe (user_id), quem causou (actor_id) e, nas de sala, a sala com o modo e o dia (para a
-- frase "te desafiou no Emoji #203" continuar certa depois que a sala some). Sem texto livre: a frase é montada na tela.
-- Excluir a conta de quem recebe ou de quem causou apaga a linha (cascata). As de mais de 30 dias são apagadas pelo
-- servidor ao criar uma nova.
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('friend_request', 'friend_accepted', 'room_invite', 'room_finished')),
  actor_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  room_id text,
  mode text CHECK (mode IS NULL OR mode IN ('emoji', 'opening', 'pistas')),
  day integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_actor_idx ON notifications (actor_id);
