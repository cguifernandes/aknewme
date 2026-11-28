import { neon } from "@neondatabase/serverless";

// Banco do login e do duelo com amigos (Neon, Postgres). Só no servidor: a string de conexão vem do DATABASE_URL
// e nunca vai para o navegador nem para os logs. Consultas sempre com parâmetros ($1, $2...), nunca texto montado.

let client: ReturnType<typeof neon> | null = null;

export const hasDb = () => !!process.env.DATABASE_URL;

/** Cliente do Neon (HTTP, sem conexão aberta entre requisições). Sem DATABASE_URL, lança erro. */
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ausente");
  return (client ??= neon(url));
}

/** Linhas de uma consulta com parâmetros. */
export async function rows<T>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await db().query(text, params)) as T[];
}

/** Erro de chave única do Postgres (ex.: handle já em uso). */
export const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === "23505";
