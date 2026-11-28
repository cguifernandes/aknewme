"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "./AccountProvider";

/**
 * Entrada do login opcional (specs/login-duelo, fluxo "entrar"). Sem conta: "Entrar" (vai para /login e volta para a
 * página). Com conta: "Amigos". Não chama o servidor: lê só a marca de "entrou" do navegador.
 * null enquanto não leu o navegador, e na tela de login.
 * Desde specs/cabecalho/02-sequencia.md (seção 5) ela é o primeiro item do Menu do cabeçalho.
 */
export function useAccountEntry(): { label: string; href: string; signedIn: boolean; handle: string | null } | null {
  const path = usePathname();
  const account = useAccount(); // cache da conta (AccountProvider, 08-conta.md)
  const signedIn = account === undefined ? null : !!account;

  if (signedIn === null || path === "/login") return null;
  const handle = account?.handle ?? null;
  return signedIn
    ? { label: "Amigos", href: "/friends", signedIn, handle }
    : { label: "Entrar", href: `/login?next=${encodeURIComponent(path)}`, signedIn, handle };
}

/** A mesma entrada como link solto (para telas que precisem dela fora do Menu). */
export default function AccountButton({ className }: { className: string }) {
  const entry = useAccountEntry();
  if (!entry) return null;
  return (
    <Link href={entry.href} className={className}>
      {entry.label}
    </Link>
  );
}
