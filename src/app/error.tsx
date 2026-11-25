"use client";

import Link from "next/link";
import { useEffect } from "react";
import ErrorScreen, { ERROR_BTN } from "@/components/ErrorScreen";

/** Erro inesperado em qualquer página: oferece tentar de novo (reset) ou voltar ao início. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      cards="OPS"
      kana="エラー"
      badge="Algo deu errado"
      title="Deu ruim por aqui."
      text="Foi um erro nosso, não seu. Tente de novo; se continuar, volte ao início e escolha um modo."
    >
      <button type="button" onClick={reset} className={`${ERROR_BTN} bg-lime sweep-white`}>
        Tentar de novo
      </button>
      <Link href="/" className={`${ERROR_BTN} border-2 border-track bg-white sweep-track`}>
        Voltar ao início
      </Link>
    </ErrorScreen>
  );
}
