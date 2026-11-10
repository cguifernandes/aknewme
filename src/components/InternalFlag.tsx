"use client";

import { useEffect, useState } from "react";
import { isInternal, setInternal } from "@/lib/metrics";

/**
 * Painel /plays: quem abre o painel é o dono do site, então este navegador passa a ficar fora das métricas
 * (contadores do painel, pixel do Meta e Vercel Analytics). O botão desfaz, para testar a contagem de verdade.
 */
export default function InternalFlag() {
  // null = ainda não leu o localStorage
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    // marca sozinho na 1ª visita; se a pessoa desligou à mão ("0"), respeita
    try {
      if (localStorage.getItem("aknewme.internal") === null) setInternal(true);
    } catch {}
    setOn(isInternal());
  }, []);

  if (on === null) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
      <span className={`size-2.5 rounded-full ${on ? "bg-lime" : "bg-blush"}`} aria-hidden="true" />
      {on
        ? "Este navegador está fora das métricas: suas visitas e jogos não contam no painel, no pixel do Meta nem no Vercel Analytics."
        : "Este navegador está contando nas métricas, como um jogador qualquer."}
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem("aknewme.internal", on ? "0" : "1");
          } catch {}
          setOn(!on);
        }}
        className="rounded font-bold text-grape underline underline-offset-4 hover:text-grape-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
      >
        {on ? "Voltar a contar" : "Parar de contar"}
      </button>
    </p>
  );
}
