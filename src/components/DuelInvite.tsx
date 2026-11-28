"use client";

import ChallengeModes from "./ChallengeModes";

/**
 * "Chamar pro duelo" (lado direito da janela Duelos, o que aparece ao abrir): os modos de hoje, com o MESMO componente
 * da janela de Desafiar da tela de Amigos (ChallengeModes): jogado → "como <nome> ✏️" e o botão que gera e copia o
 * link (sem conta, pede o apelido); não jogado → leva para jogar. Mandar avisa a janela de fim de jogo
 * (DUEL_SENT_EVENT, dentro do ChallengeButton).
 */
export default function DuelInvite() {
  return (
    <div id="duel-invite" className="flex min-h-full flex-col rounded-2xl">
      <h2 id="duels-title" className="pr-10 font-display text-3xl font-extrabold text-ink">
        Chamar pro duelo
      </h2>
      <p className="mt-1 text-sm text-muted">Escolha o modo de hoje, mande o link e o placar aparece aqui quando ele jogar.</p>
      <ChallengeModes className="mt-5" />
    </div>
  );
}
