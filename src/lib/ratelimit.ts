import { createHash } from "node:crypto";
import { createClient } from "redis";

// Limite de uso das rotas com conta (specs/login-duelo/03-seguranca.md): 20 chamadas por minuto, por usuário e por
// IP, em cada grupo de rotas. Contador no Redis que já existe (KV_REDIS_URL). Sem Redis (ou fora do ar), a rota segue
// liberada: falha aberta, decisão do dono. O IP vai como hash curto (o Redis não guarda o IP em si).

export const LIMIT = 20;
const WINDOW_S = 60;
const REDIS_URL = process.env.KV_REDIS_URL;

const newClient = () =>
  createClient({ url: REDIS_URL, socket: { connectTimeout: 1500, reconnectStrategy: false } }).on("error", () => {});
let redis: ReturnType<typeof newClient> | null = null;

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

const short = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);

/** Passa de 20 chamadas no minuto (por usuário ou por IP) neste grupo de rotas? */
export async function limited(group: string, uid: string, req: Request): Promise<boolean> {
  if (!REDIS_URL) return false;
  try {
    const r = (redis ??= newClient());
    if (!r.isOpen) await r.connect();
    const keys = [`rl:${group}:u:${uid}`, `rl:${group}:ip:${short(clientIp(req))}`];
    const m = r.multi();
    for (const k of keys) m.incr(k).expire(k, WINDOW_S, "NX");
    const out = await m.exec();
    return [out[0], out[2]].some((n) => Number(n) > LIMIT);
  } catch {
    redis = null; // tenta de novo na próxima chamada
    return false;
  }
}
