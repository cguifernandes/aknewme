"use client";

import { useEffect } from "react";
import { ACCOUNT_EVENT, savedAccount } from "@/lib/account";
import { openProfileEdit } from "./profileEdit";
import { BTN_PRIMARY, Stage, Sub, Title } from "./ui";

/**
 * Tela que precisa de @ (Amigos, criar sala) para quem ainda não escolheu: abre a janela "Meu perfil" já editando
 * (09-menu-perfil.md, terceira rodada; a tela /handle saiu) e segue sozinha quando o @ é salvo (`onReady`).
 */
export default function NeedHandle({ text, onReady }: { text: string; onReady: () => void }) {
  useEffect(() => {
    openProfileEdit();
    const check = () => {
      if (savedAccount()?.handle) onReady();
    };
    window.addEventListener(ACCOUNT_EVENT, check);
    return () => window.removeEventListener(ACCOUNT_EVENT, check);
  }, [onReady]);

  return (
    <Stage>
      <Title>Escolha seu usuário.</Title>
      <Sub>{text}</Sub>
      <button type="button" onClick={openProfileEdit} className={BTN_PRIMARY}>
        Escolher usuário
      </button>
    </Stage>
  );
}
