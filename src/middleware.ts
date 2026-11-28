import { NextResponse } from "next/server";
import { ROOMS_ENABLED } from "@/lib/features";

/**
 * Salas desligadas (specs/login-duelo/13-escopo-lancamento.md): /api/duels e tudo abaixo respondem 404 para QUALQUER
 * método, como se as rotas não existissem. Sem isto, um método que a rota não exporta (ex.: POST em /api/duels/[id])
 * dava 405 e mostrava que a rota existe. Religar as salas é só ROOMS_ENABLED = true.
 */
export function middleware() {
  if (!ROOMS_ENABLED) return new NextResponse(null, { status: 404 });
  return NextResponse.next();
}

export const config = { matcher: ["/api/duels", "/api/duels/:path*"] };
