import { createHmac, randomBytes } from "node:crypto";

// Posta no X (Twitter) pela API v2 com OAuth 1.0a (user context): as 4 chaves do app em
// developer.x.com. Assinatura feita à mão (~30 linhas), não vale uma dependência.
const enc = (s: string) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

function authHeader(method: string, url: string): string {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
    throw new Error("chaves do X ausentes (X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET)");
  }
  const p: Record<string, string> = {
    oauth_consumer_key: X_API_KEY,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: X_ACCESS_TOKEN,
    oauth_version: "1.0",
  };
  // Corpo JSON não entra na assinatura; só os parâmetros oauth_*, em ordem alfabética.
  const params = Object.keys(p).sort().map((k) => `${enc(k)}=${enc(p[k])}`).join("&");
  const base = [method, enc(url), enc(params)].join("&");
  p.oauth_signature = createHmac("sha1", `${enc(X_API_SECRET)}&${enc(X_ACCESS_SECRET)}`).update(base).digest("base64");
  return "OAuth " + Object.keys(p).sort().map((k) => `${enc(k)}="${enc(p[k])}"`).join(", ");
}

/** Publica um post (ou resposta a `replyTo`); devolve o id do post. */
export async function postToX(text: string, replyTo?: string): Promise<string> {
  const url = "https://api.x.com/2/tweets";
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: authHeader("POST", url), "Content-Type": "application/json" },
    body: JSON.stringify(replyTo ? { text, reply: { in_reply_to_tweet_id: replyTo } } : { text }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`X ${res.status}: ${JSON.stringify(body)}`);
  return body.data.id as string;
}
