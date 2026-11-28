"use client";

// Abrir a janela "Meu perfil" já editando o @ (specs/login-duelo/09-menu-perfil.md, terceira rodada): é o único lugar
// para trocar ou escolher o @ depois do login (a tela /handle saiu). Quem chama: toast do @ automático, /account,
// Amigos, criar sala. O pedido fica guardado até a janela montar (ela só existe com conta, e pode montar depois).

export const PROFILE_EDIT_EVENT = "aknewme:profile-edit";
let pending = false;

export function openProfileEdit() {
  pending = true;
  window.dispatchEvent(new Event(PROFILE_EDIT_EVENT));
}

/** A janela pega o pedido (devolve true uma vez por pedido). */
export function takeProfileEdit(): boolean {
  const was = pending;
  pending = false;
  return was;
}
