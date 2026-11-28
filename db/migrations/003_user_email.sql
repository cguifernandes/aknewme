-- E-mail da conta (specs/login-duelo/09-menu-perfil.md, terceira rodada; decisão do dono, 26/11). Idempotente.
-- Vem do provedor a cada login (Google: email + email_verified; Discord: email + verified). Uso: mostrar mascarado no
-- cartão Conta e achar a conta em pedidos de suporte ou de exclusão. Não aparece para outros jogadores nem vai para logs.
-- Excluir a conta apaga a linha do usuário, e o e-mail vai junto. Contas antigas ficam com NULL até o próximo login.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text CHECK (email IS NULL OR length(email) <= 254);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean;
