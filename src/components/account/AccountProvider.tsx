"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { ACCOUNT_EVENT, loadMe, savedAccount, type CachedAccount } from "@/lib/account";
import { notificationAction, notificationText, startNotifications, stopNotifications } from "@/lib/notify";
import { showToast } from "./SignInToast";

// Conta no cliente (specs/login-duelo/08-conta.md): lê o cache do navegador (só campos públicos) antes da 1ª pintura,
// para o cabeçalho mostrar o avatar na hora, e confere /api/me uma vez por carregamento (loadMe). Sair, excluir e 401
// apagam o cache (rememberAccount(null)); trocar o @ atualiza na hora. undefined = ainda não leu o navegador.

const Ctx = createContext<CachedAccount | null | undefined>(undefined);

// useLayoutEffect no navegador (antes de pintar); no servidor não roda nada
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<CachedAccount | null | undefined>(undefined);

  useBeforePaint(() => {
    const read = () => setAccount(savedAccount());
    read();
    window.addEventListener(ACCOUNT_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(ACCOUNT_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  // com cache, confere o servidor uma vez (sem cache não há conta: nenhuma chamada)
  useEffect(() => {
    if (savedAccount()) void loadMe();
  }, []);

  // notificações (11-notificacoes.md): com conta, consulta ao abrir e a cada 60 s com a aba visível; a que chega com o
  // site aberto vira um aviso com o link da ação. Sem conta (ou ao sair), para.
  const signedIn = !!account;
  useEffect(() => {
    if (!signedIn) return;
    startNotifications((n) => showToast(notificationText(n), notificationAction(n)));
    return stopNotifications;
  }, [signedIn]);

  return <Ctx.Provider value={account}>{children}</Ctx.Provider>;
}

/** A conta em cache: objeto (com conta), null (sem conta) ou undefined (ainda lendo o navegador). */
export const useAccount = () => useContext(Ctx);
