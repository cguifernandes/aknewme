"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import { useAccountEntry } from "./account/AccountButton";
import { useAccount } from "./account/AccountProvider";
import { useNotifications } from "./account/Notifications";
import { leaveAccount } from "./account/leave";
import { trackClick } from "@/lib/follow";
import DuelsDialog from "./DuelsDialog";
import SiteMenu, { DIVIDER, type MenuItem } from "./header/SiteMenu";
import StreakBadge from "./header/StreakBadge";
import HowToPlay, { type DialogHandle } from "./HowToPlay";
import Logo from "./Logo";
import ProfileDialog from "./ProfileDialog";
import StatsDialog from "./StatsDialog";

/**
 * Cabeçalho de todas as telas (specs/cabecalho/01-cabecalho.md): logo | [home: sequência · Duelos] · Menu.
 * O Menu é o único botão de conta: sem conta leva "Entrar" em destaque; com conta, o bloco do topo é o perfil (abre a
 * janela "Meu perfil", onde ficam também as estatísticas), seguido de Amigos (e Salas de hoje, com as salas ligadas), depois Como jogar,
 * Estatísticas (só sem conta), Apoiar
 * o projeto, Seguir no X e, no rodapé, Sair (com conta) | Termos e Privacidade (login-duelo/09-menu-perfil.md). No celular a sequência fica só no círculo e Duelos
 * passa para dentro do Menu. As janelas (Como jogar, Estatísticas, Duelos, Meu perfil) abrem pelo Menu.
 */
export default function SiteHeader() {
  const path = usePathname();
  const home = path === "/";
  const howTo = useRef<DialogHandle>(null);
  const stats = useRef<DialogHandle>(null);
  const duels = useRef<DialogHandle>(null);
  const profile = useRef<DialogHandle>(null);
  const entry = useAccountEntry();
  const me = useAccount();
  const signedIn = !!entry?.signedIn;
  const { unread } = useNotifications();

  // volta à página atual já sem conta, numa navegação só (o Menu mostra o spinner no Sair enquanto isso)
  const leave = () => leaveAccount(path);

  const items: MenuItem[] = [
    // sem conta: "Entrar" é o 1º item do Menu, com destaque
    ...(entry && !entry.signedIn ? [{ label: entry.label, href: entry.href, accent: true }] : []),
    // com conta: o topo é o perfil; depois Amigos (com a bolinha das notificações)
    ...(signedIn && me
      ? [
          {
            label: me.name ?? (me.handle ? `@${me.handle}` : "Você"),
            profile: { image: me.image, name: me.name, handle: me.handle },
            onSelect: () => profile.current?.open(),
          },
          { label: "Amigos", href: "/friends", badge: unread },
          DIVIDER,
        ]
      : []),
    // no celular o botão "Duelos" não cabe no cabeçalho: ele vem para o Menu
    ...(home ? [{ label: "Duelos", onSelect: () => duels.current?.open(), className: "sm:hidden" }] : []),
    { label: "Como jogar", onSelect: () => howTo.current?.open() },
    // com conta, as estatísticas ficam na janela Meu perfil; "Desafios anteriores" saiu do Menu (está no card da home e
    // no fim de jogo): 09-menu-perfil.md, "Estatísticas no perfil e menu mais curto"
    ...(signedIn ? [] : [{ label: "Estatísticas", onSelect: () => stats.current?.open() }]),
    DIVIDER,
    { label: "Apoiar o projeto", href: "/support", onSelect: () => trackClick("support:menu") },
  ];

  return (
    // Linha de altura fixa (40px, a dos botões): a sequência só aparece depois de ler o localStorage e não empurra a página.
    // z-50: o Menu aberto fica acima do conteúdo da página e dos botões fixos (z-40).
    <header className="relative z-50 box-content flex min-h-10 items-center justify-between gap-2 py-[clamp(0.75rem,2.5vh,2rem)] short:py-2">
      <Logo className="shrink-0" />
      <div className="flex items-center gap-1.5 sm:gap-2">
        {home && <StreakBadge />}
        {/* a janela Duelos em todas as páginas ("Ver placar" abre nela sem navegar); o botão só na home */}
        <DuelsDialog ref={duels} className="max-sm:hidden" button={home} />
        <SiteMenu items={items} onSignOut={signedIn ? leave : undefined} unread={signedIn ? unread : 0} />
      </div>
      <HowToPlay ref={howTo} />
      {!signedIn && <StatsDialog ref={stats} />}
      {signedIn && <ProfileDialog ref={profile} />}
    </header>
  );
}
