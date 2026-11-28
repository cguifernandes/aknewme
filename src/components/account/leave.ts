"use client";

import { signOut } from "next-auth/react";
import { forgetAccountQuietly } from "@/lib/account";

/**
 * Sai da conta sem "pulo" (specs/login-duelo/09-menu-perfil.md, segunda rodada): apaga o cookie da sessão no servidor,
 * limpa o cache sem redesenhar a página e vai direto para `to` já sem conta, numa navegação só. Quem chama mostra o
 * spinner enquanto isso. Sem rede, navega do mesmo jeito: a página nova confere a sessão no servidor.
 */
export async function leaveAccount(to: string) {
  try {
    await signOut({ redirect: false });
  } catch {}
  forgetAccountQuietly();
  window.location.replace(to);
}
