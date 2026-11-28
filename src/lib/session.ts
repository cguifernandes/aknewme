import { auth } from "@/auth";
import { hasDb } from "./db";
import { limited } from "./ratelimit";
import { userById, type UserRow } from "./users";

// Guarda das rotas com conta: toda rota confere a sessão no servidor e, como a sessão é um JWT, confere também no
// banco que o usuário ainda existe (conta excluída perde o acesso na hora). Nada aqui confia no navegador.

const NO_STORE = { "Cache-Control": "no-store" };
export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: NO_STORE });
export const fail = (status: number, error: string) => json({ error }, status);
export const noContent = () => new Response(null, { status: 204, headers: NO_STORE });

/** Escrita vinda de outro site (CSRF) é recusada: o Origin, quando vem, tem de ser o deste host. */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // sem navegador não há cookie de outro site para abusar
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

/**
 * Usuário da sessão, ou a resposta de erro pronta (503 sem configuração, 403 de outro site, 401 sem sessão,
 * 429 acima do limite). `limit`: grupo de rotas do limite de 20 por minuto.
 */
export async function requireUser(req: Request, limit?: string): Promise<UserRow | Response> {
  if (!process.env.AUTH_SECRET || !hasDb()) return fail(503, "unavailable");
  if (req.method !== "GET" && !sameOrigin(req)) return fail(403, "forbidden");
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return fail(401, "unauthorized");
  if (limit && (await limited(limit, uid, req))) return fail(429, "rate_limited");
  const user = await userById(uid);
  return user ?? fail(401, "unauthorized");
}

const MAX_BODY = 16_384;

/** Corpo JSON (objeto) de até 16 KB; null se faltar, for grande demais ou não for JSON. */
export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  if (!req.headers.get("content-type")?.includes("application/json")) return null;
  const text = await req.text().catch(() => "");
  if (!text || text.length > MAX_BODY) return null;
  try {
    const v: unknown = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Erro inesperado (banco fora do ar...) vira 500 sem detalhe; o log leva só o código do erro, sem dados pessoais. */
export function safe<C>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      console.error("[api]", (e as { code?: string })?.code ?? (e as Error)?.name ?? "error");
      return fail(500, "server_error");
    }
  };
}
