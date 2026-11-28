import { useEffect, useState } from "react";
import { dailyNumber } from "./game";
import { sendPlayed } from "./metrics";

const KEY = "aknewme.followed";

/** De onde veio o clique em "Apoiar": fim de jogo, faixa da home ou Menu (specs/visual/02-apoio.md). */
export type SupportFrom = "end" | "home" | "menu";

/** Conta um clique num link do X ou em "Apoiar" (api/played); aparece em /plays e no npm run plays. */
export function trackClick(click: "follow" | `support:${SupportFrom}`) {
  sendPlayed({ click, day: dailyNumber() });
}

/**
 * Clicou em "Seguir no X"? É o que libera os desafios anteriores (/archive).
 * null = ainda lendo o localStorage (evita piscar o estado bloqueado).
 */
// ponytail: vale o clique, não dá para confirmar o follow sem a API paga do X.
export function useFollowed(): [boolean | null, () => void] {
  const [followed, setFollowed] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      setFollowed(localStorage.getItem(KEY) === "1");
    } catch {
      setFollowed(false);
    }
  }, []);
  return [
    followed,
    () => {
      trackClick("follow");
      setFollowed(true);
      try {
        localStorage.setItem(KEY, "1");
      } catch {}
    },
  ];
}
