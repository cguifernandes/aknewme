import { isUniqueViolation, rows } from "./db";
import { handleProblem } from "./handle";

// @ (nome de usuário) automático e sugestões (specs/login-duelo/06-usuario.md). Nada novo é guardado: só o @ final.

/** Converte um nome em @: minúsculas, sem acento, espaço vira _, só a-z 0-9 _, até 20 caracteres. null se não der 3. */
export function toHandle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const h = raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s.-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20)
    .replace(/_+$/, "");
  return h.length >= 3 ? h : null;
}

/** Quais destes @ estão livres para `me`: formato válido, não reservados, não ofensivos, sem dono e sem reserva de outra conta. */
export async function freeHandles(candidates: string[], me: string): Promise<string[]> {
  const valid = [...new Set(candidates)].filter((h) => !handleProblem(h));
  if (!valid.length) return [];
  const busy = await rows<{ handle: string }>(
    `SELECT handle FROM users WHERE handle = ANY($1::text[]) AND id <> $2
     UNION SELECT handle FROM handle_reservations WHERE handle = ANY($1::text[]) AND user_id <> $2 AND reserved_until > now()`,
    [valid, me],
  );
  const taken = new Set(busy.map((b) => b.handle));
  return valid.filter((h) => !taken.has(h));
}

/** Até 3 alternativas livres para um @ que não deu (ex.: @guilherme → @guilherme_, @guilherme200, @guilherme_anime). */
export async function alternatives(base: string, me: string): Promise<string[]> {
  const b = (toHandle(base) ?? "").slice(0, 14).replace(/_+$/, "");
  if (b.length < 3) return [];
  const n = (k: number) => 100 + ((b.length * 37 + k * 131) % 900); // números estáveis para o mesmo nome
  const pool = [`${b}_`, `${b}${n(1)}`, `${b}_anime`, `${b}_br`, `${b}${n(2)}`, `${b}_otaku`, `${b}${n(3)}`, `${b}_${n(4)}`];
  return (await freeHandles(pool, me)).slice(0, 3);
}

/**
 * 1º login: tenta dar ao usuário um @ a partir do nome do provedor (Discord: username; Google: nome da conta).
 * Só se ele ainda não tem @ e o @ gerado é válido, livre, não reservado e não ofensivo (senão cai no passo 2). É
 * provisório (handle_auto): não conta como troca, e a primeira escolha da pessoa depois dele é livre.
 * Devolve o @ salvo, ou null (aí a tela de login mostra o passo 2).
 */
export async function autoHandle(userId: string, raw: unknown): Promise<string | null> {
  const candidate = toHandle(raw);
  if (!candidate) return null;
  const [user] = await rows<{ handle: string | null }>("SELECT handle FROM users WHERE id = $1", [userId]);
  if (!user || user.handle) return null;
  if (!(await freeHandles([candidate], userId)).length) return null;
  try {
    // handle_auto: @ provisório (a primeira escolha da pessoa depois dele é livre: 01-requisitos.md, R5b)
    const saved = await rows("UPDATE users SET handle = $2, handle_auto = true WHERE id = $1 AND handle IS NULL RETURNING id", [userId, candidate]);
    return saved.length ? candidate : null;
  } catch (e) {
    if (isUniqueViolation(e)) return null; // outra conta pegou o mesmo @ no mesmo instante
    throw e;
  }
}
