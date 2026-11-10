// Métricas próprias (contadores de api/played, vistos no painel /plays) e o "navegador interno":
// o do dono do site, que não deve contar em nada — nem aqui, nem no pixel do Meta, nem no Vercel Analytics.
//
// É por navegador, não por IP: IP de casa e de celular muda, e o pixel roda no navegador (não dá para
// filtrar por IP ali). Quem abre o painel /plays é marcado sozinho (InternalFlag); cada aparelho precisa abrir uma vez.
const KEY = "aknewme.internal";

/** Este navegador está marcado como interno (fora das métricas)? */
export function isInternal(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setInternal(on: boolean) {
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {}
}

/** Manda um evento para api/played (visita, jogo começado/terminado, clique, opinião). Navegador interno não manda nada. */
export function sendPlayed(body: Record<string, unknown>) {
  if (isInternal()) return;
  navigator.sendBeacon?.("/api/played", JSON.stringify(body));
}
