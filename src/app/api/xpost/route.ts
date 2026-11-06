import { createClient } from "redis";
import { X_POST_KEY, X_POST_URL } from "@/lib/site";

// Post do X em destaque (XPostAlert): o escolhido no painel /plays ou, sem nada gravado, o de site.ts.
export async function GET() {
  let url = X_POST_URL;
  try {
    if (process.env.KV_REDIS_URL) {
      const redis = await createClient({ url: process.env.KV_REDIS_URL }).connect();
      url = (await redis.get(X_POST_KEY)) ?? X_POST_URL;
      await redis.quit();
    }
  } catch (e) {
    console.error(e); // Redis fora do ar: segue com o link reserva
  }
  // Cache de 1 min na CDN: toda página pede este link, o Redis não precisa responder a cada visita
  return Response.json({ url }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } });
}
