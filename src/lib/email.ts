// E-mail da conta (specs/login-duelo/09-menu-perfil.md, terceira rodada; 03-seguranca.md, Dados pessoais).
// Vem do provedor no login e fica no banco só para mostrar mascarado no cartão Conta e para achar a conta em suporte ou
// exclusão. Nunca vai para logs nem para outros jogadores; o navegador só recebe a versão mascarada.

/** E-mail do provedor, limpo (minúsculas, sem espaços), ou null se não parece um e-mail. */
export function cleanEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

/** "guilherme@gmail.com" → "g••••@gmail.com": a 1ª letra, 4 pontos (sem entregar o tamanho) e o domínio. */
export function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  return `${email[0]}••••${email.slice(at)}`;
}
