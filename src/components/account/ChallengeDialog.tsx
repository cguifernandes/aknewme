"use client";

import { useEffect, useRef } from "react";
import { DUEL_TEXT } from "@/lib/duelTexts";
import { closeOnBackdrop } from "@/lib/dialog";
import ChallengeModes from "../ChallengeModes";
import CloseButton from "../CloseButton";

/**
 * "Desafiar" da lista de amigos (specs/login-duelo/13-escopo-lancamento.md): o mesmo desafio por link do fim de jogo,
 * numa janela com os modos do dia (ChallengeModes, o mesmo do "Chamar pro duelo"). No modo já jogado, o desafio vai
 * como notificação para o amigo (15-desafio-por-notificacao.md). Fecha com Esc e clique fora.
 */
export default function ChallengeDialog({ friend, onClose }: { friend: { id: string; name: string }; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => ref.current?.showModal(), []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="challenge-title"
      onClose={(e) => e.target === e.currentTarget && onClose()}
      onClick={closeOnBackdrop}
      className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-3xl bg-white p-6 text-ink shadow-pop-lg backdrop:bg-ink/60 sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="challenge-title" className="font-display text-2xl leading-tight font-extrabold tracking-tight">
          {DUEL_TEXT.dialogTitle(friend.name)}
        </h2>
        <CloseButton onClick={() => ref.current?.close()} />
      </div>
      <p className="mt-1 text-sm text-muted">{DUEL_TEXT.dialogHint(friend.name)}</p>
      <ChallengeModes className="mt-4" friend={friend} />
    </dialog>
  );
}
