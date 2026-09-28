import type { MouseEvent } from "react";

/**
 * onClick de um <dialog> modal: fecha no clique no fundo escuro. O alvo do
 * clique no fundo é o próprio <dialog>, mas o padding e a barra de rolagem da
 * caixa também — por isso confere se o ponto ficou fora da caixa.
 */
export function closeOnBackdrop(e: MouseEvent<HTMLDialogElement>) {
  const d = e.currentTarget;
  if (e.target !== d) return;
  const r = d.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
}
