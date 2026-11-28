import type { Metadata } from "next";
import { Suspense } from "react";
import LoginCard from "@/components/account/LoginCard";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

/** Provedores com as variáveis do app OAuth definidas (sem elas, o botão aparece desativado). Só os nomes, nunca os valores. */
function readyProviders() {
  const has = (...names: string[]) => !!process.env.AUTH_SECRET && names.every((n) => !!process.env[n]);
  return { google: has("AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"), discord: has("AUTH_DISCORD_ID", "AUTH_DISCORD_SECRET") };
}

/** Tela de login em tela cheia (protótipo d-login-v2): o painel da marca já traz o logo que volta ao jogo. */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginCard ready={readyProviders()} />
    </Suspense>
  );
}
