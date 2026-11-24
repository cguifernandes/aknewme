import { createHmac, randomBytes } from "node:crypto";

// Publicar no X pela API (paga por post: ~US$ 0,015 sem link, US$ 0,20 com link).
// Chaves da própria conta @aknewmee, geradas no portal de desenvolvedor do X (app com permissão "Read and write"):
// X_API_KEY, X_API_SECRET (do app) e X_ACCESS_TOKEN, X_ACCESS_SECRET (do usuário).

const TWEETS = "https://api.x.com/2/tweets";
const MEDIA = "https://api.x.com/2/media/upload";

/** Codificação do OAuth 1.0a (RFC 3986): encodeURIComponent deixa passar !'()*. */
const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** Assinatura HMAC-SHA1 do OAuth 1.0a. Corpo JSON não entra na assinatura, só os parâmetros oauth_* e da URL. */
export function oauthSignature(method: string, url: string, params: Record<string, string>, consumerSecret: string, tokenSecret: string) {
  const query = Object.entries(params)
    .map(([k, v]) => [enc(k), enc(v)])
    .sort(([a, x], [b, y]) => (a === b ? (x < y ? -1 : 1) : a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const base = `${method}&${enc(url)}&${enc(query)}`;
  return createHmac("sha1", `${enc(consumerSecret)}&${enc(tokenSecret)}`).update(base).digest("base64");
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`falta a variável ${name}`);
  return v;
}

/** Cabeçalho Authorization do OAuth 1.0a (corpo JSON/multipart não entra na assinatura). */
function authHeader(method: string, url: string): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: env("X_API_KEY"),
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: env("X_ACCESS_TOKEN"),
    oauth_version: "1.0",
  };
  oauth.oauth_signature = oauthSignature(method, url, oauth, env("X_API_SECRET"), env("X_ACCESS_SECRET"));
  return `OAuth ${Object.entries(oauth).map(([k, v]) => `${enc(k)}="${enc(v)}"`).join(", ")}`;
}

/** Baixa a imagem do link e sobe no X; devolve o id da mídia para anexar no post. */
export async function uploadImage(imageUrl: string): Promise<string> {
  const img = await fetch(imageUrl);
  if (!img.ok) throw new Error(`imagem ${imageUrl} respondeu ${img.status}`);
  const form = new FormData();
  form.append("media", await img.blob());
  form.append("media_category", "tweet_image");
  const res = await fetch(MEDIA, { method: "POST", headers: { Authorization: authHeader("POST", MEDIA) }, body: form });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.data?.id) throw new Error(`upload no X respondeu ${res.status}: ${JSON.stringify(json)}`);
  return json.data.id;
}

/** Publica um post (ou uma resposta, com `replyTo`; com imagem, `mediaId` de uploadImage) e devolve o id dele. */
export async function postTweet(text: string, replyTo?: string, mediaId?: string): Promise<string> {
  const res = await fetch(TWEETS, {
    method: "POST",
    headers: { Authorization: authHeader("POST", TWEETS), "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      ...(replyTo && { reply: { in_reply_to_tweet_id: replyTo } }),
      ...(mediaId && { media: { media_ids: [mediaId] } }),
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.data?.id) throw new Error(`X respondeu ${res.status}: ${JSON.stringify(json)}`);
  return json.data.id;
}
