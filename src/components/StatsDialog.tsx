"use client";

import { useImperativeHandle, useRef, useState } from "react";
import { closeOnBackdrop } from "@/lib/dialog";
import CloseButton from "./CloseButton";
import type { DialogHandle } from "./HowToPlay";
import StatsTabs from "./StatsTabs";

/**
 * Janela de estatísticas com uma aba por modo (<dialog> nativo: foco preso, Esc fecha). Abre pelo item "Estatísticas"
 * do Menu do cabeçalho (`ref.open()`), que só existe para quem está sem conta: com conta, o mesmo conteúdo (StatsTabs)
 * fica na janela Meu perfil (specs/login-duelo/09-menu-perfil.md).
 */
export default function StatsDialog({ ref: handle }: { ref?: React.Ref<DialogHandle> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false); // o conteúdo só monta aberto (lê o localStorage)

  useImperativeHandle(handle, () => ({
    open: () => {
      setOpen(true);
      ref.current?.showModal();
    },
  }));

  return (
    <dialog
      ref={ref}
      aria-labelledby="stats-title"
      onClose={() => setOpen(false)}
      onClick={closeOnBackdrop}
      className="m-auto max-h-[90dvh] w-[min(46rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-white p-6 text-ink shadow-pop-lg backdrop:bg-ink/60 sm:p-7"
    >
      {open && (
        <StatsTabs
          id="stats"
          title={
            <h2 id="stats-title" className="font-display text-3xl font-extrabold">
              Estatísticas
            </h2>
          }
          trailing={<CloseButton onClick={() => ref.current?.close()} />}
        />
      )}
    </dialog>
  );
}
