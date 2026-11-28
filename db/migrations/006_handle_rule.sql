-- Regra nova do @ (specs/login-duelo/01-requisitos.md, R5b): uma troca por conta, para sempre. Idempotente.
-- handle_auto = o @ atual foi criado sozinho no login (provisório): a primeira escolha da pessoa é livre e não conta.
-- Contas que já tinham @ antes desta migração ficam com false (tratadas como "@ escolhido": resta uma troca, ou
-- nenhuma se já havia troca registrada em handle_changes, que agora não é mais apagada).
ALTER TABLE users ADD COLUMN IF NOT EXISTS handle_auto boolean NOT NULL DEFAULT false;
