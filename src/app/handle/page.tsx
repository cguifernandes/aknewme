import { redirect } from "next/navigation";

// A tela /handle saiu (specs/login-duelo/09-menu-perfil.md, terceira rodada): trocar ou escolher o @ é na janela
// "Meu perfil" (menu) e no passo 2 do login. Links antigos caem na home.
export default function HandlePage() {
  redirect("/");
}
