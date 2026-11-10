import { createClient } from "redis";
import { X_POST_KEY, X_POST_TEXT_KEY, X_POST_URL } from "@/lib/site";

// Post do X em destaque (XPostAlert): o escolhido no painel /plays ou, sem nada gravado, o de site.ts.
export async function GET() {
  let url = X_POST_URL;
  let text = "";
  try {
    if (process.env.KV_REDIS_URL) {
      const redis = await createClient({ url: process.env.KV_REDIS_URL }).connect();
      const [u, t] = await redis.mGet([X_POST_KEY, X_POST_TEXT_KEY]);
      await redis.quit();
      // o texto gravado é do post gravado: com o link reserva, o aviso usa a frase padrão
      if (u) [url, text] = [u, t ?? ""];
    }
  } catch (e) {
    console.error(e); // Redis fora do ar: segue com o link reserva
  }
  // Cache de 1 min na CDN: toda página pede este link, o Redis não precisa responder a cada visita.
  // Sem stale-while-revalidate: a troca feita no /plays vale em no máximo 1 min.
  return Response.json({ url, text }, { headers: { "Cache-Control": "public, s-maxage=60" } });
}
