import { useEffect, useState } from "react";
import { dailyNumber } from "./game";
import { sendPlayed } from "./metrics";

const KEY = "aknewme.followed";

/** Conta um clique num link do X (api/played); aparece em /plays e no npm run plays. */
export function trackClick(click: "follow" | "post") {
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
