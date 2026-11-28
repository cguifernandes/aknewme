import { rows } from "./db";
import { cleanEmail, maskEmail } from "./email";

// Contas do login (specs/login-duelo/03-seguranca.md): guarda só id interno, provedor + id do provedor, handle, nome de
// exibição, URL da foto e o e-mail do provedor (com o "verificado"). Sem tokens OAuth. O e-mail fica fora do UserRow:
// ele não sai do servidor, só a versão mascarada (maskedEmail).

export type UserRow = { id: string; handle: string | null; name: string | null; image: string | null; created_at: string };

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Fotos aceitas: só HTTPS dos provedores de login (o resto vira "sem foto"). */
const IMAGE_HOSTS = new Set(["lh3.googleusercontent.com", "cdn.discordapp.com"]);

export function cleanImage(url: unknown): string | null {
  if (typeof url !== "string" || url.length > 300) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && IMAGE_HOSTS.has(u.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}

export const cleanName = (name: unknown) =>
  typeof name === "string" && name.trim() ? name.replace(/\s+/g, " ").trim().slice(0, 64) : null;

/**
 * Entrou pelo provedor: devolve o id interno do usuário ligado a esse login, criando-o na 1ª vez.
 * Nome e foto acompanham o provedor a cada entrada.
 */
export async function upsertAccount(
  provider: string,
  providerAccountId: string,
  profile: { name?: unknown; image?: unknown; email?: unknown; emailVerified?: unknown },
) {
  const name = cleanName(profile.name);
  const image = cleanImage(profile.image);
  const email = cleanEmail(profile.email);
  const verified = email ? profile.emailVerified === true : null;
  const [found] = await rows<{ user_id: string }>(
    "SELECT user_id FROM accounts WHERE provider = $1 AND provider_account_id = $2",
    [provider, providerAccountId],
  );
  if (found) {
    // e-mail atualizado a cada login; se o provedor não mandar, fica o que já estava
    await rows(
      "UPDATE users SET name = $2, image = $3, email = COALESCE($4, email), email_verified = CASE WHEN $4::text IS NULL THEN email_verified ELSE $5 END WHERE id = $1",
      [found.user_id, name, image, email, verified],
    );
    return found.user_id;
  }
  // Usuário e login juntos, num comando só (sem usuário órfão se o segundo passo falhar).
  const [created] = await rows<{ id: string }>(
    `WITH u AS (INSERT INTO users (name, image, email, email_verified) VALUES ($3, $4, $5, $6) RETURNING id)
     INSERT INTO accounts (provider, provider_account_id, user_id) SELECT $1, $2, id FROM u RETURNING user_id AS id`,
    [provider, providerAccountId, name, image, email, verified],
  );
  return created.id;
}

export async function userById(id: string): Promise<UserRow | null> {
  if (!UUID_RE.test(id)) return null;
  const [u] = await rows<UserRow>("SELECT id, handle, name, image, created_at FROM users WHERE id = $1", [id]);
  return u ?? null;
}

/** E-mail da conta mascarado ("g••••@gmail.com"), ou null (conta que ainda não entrou depois da mudança). */
export async function maskedEmail(id: string): Promise<string | null> {
  if (!UUID_RE.test(id)) return null;
  const [u] = await rows<{ email: string | null }>("SELECT email FROM users WHERE id = $1", [id]);
  return maskEmail(u?.email ?? null);
}
