import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import FriendsPanel from "@/components/account/FriendsPanel";
import SiteHeader from "@/components/SiteHeader";
import Watermark from "@/components/Watermark";
import { hasDb } from "@/lib/db";
import { friendLists } from "@/lib/friends";
import { dailyNumber } from "@/lib/game";
import { userById } from "@/lib/users";

export const metadata: Metadata = { title: "Amigos", robots: { index: false } };
// depende da sessão de quem abre: nunca gerar estática no build
export const dynamic = "force-dynamic";

/**
 * /friends com a primeira carga no servidor (specs/login-duelo/10-amigos.md): confere a sessão (sem conta → /login,
 * sem piscar a tela) e já traz do banco a 1ª página de amigos, os pedidos enviados e o total de pedidos recebidos. O
 * painel do navegador recebe isso pronto (sem "Carregando..." ao abrir) e cuida do resto: aceitar/recusar/remover, o
 * acordeão, a troca de página, desafiar e os avisos. Sem banco ou sem AUTH_SECRET (ambiente sem conta), cai no fluxo
 * antigo, todo no navegador.
 */
export default async function FriendsPage() {
  let initial: React.ComponentProps<typeof FriendsPanel>["initial"];
  if (process.env.AUTH_SECRET && hasDb()) {
    const session = await auth();
    const me = session?.user?.id ? await userById(session.user.id) : null;
    if (!me) redirect("/login?next=/friends");
    initial = { me, lists: me.handle ? await friendLists(me.id, dailyNumber(), 1, 1) : null };
  }
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10">
      {/* kanji decorativo no canto superior direito, como nas outras telas (10-amigos.md): 友達 = amigos */}
      <Watermark text="友達" />
      <SiteHeader />
      <FriendsPanel initial={initial} />
    </div>
  );
}
