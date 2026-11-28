"use client";

import { faBars, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useState } from "react";
import { X_HANDLE, X_URL } from "@/lib/site";
import { UnreadDot } from "../account/Notifications";
import { ProfileAvatar, Spinner } from "../account/ui";
import { HEADER_ICON_BTN } from "./buttons";
import { ITEM, ITEM_BASE, PANEL, useMenu } from "./useMenu";
import { Icon } from "../icons";

/** Um item do Menu: abre uma janela do site (`onSelect`) ou vai para um endereço (`href`; com `onSelect` junto, ele roda no clique, ex.: contar o clique). */
export type MenuItem = {
  label: string;
  onSelect?: () => void;
  href?: string;
  external?: boolean;
  hint?: string;
  /** Notificações não lidas: bolinha lime com o número, à direita do item (11-notificacoes.md). */
  badge?: number;
  className?: string;
  accent?: boolean;
  /** Linha divisória entre grupos (o `label` não é mostrado). */
  divider?: boolean;
  /** Bloco do topo com a foto, o nome e o @ de quem está logado (abre a janela do perfil pelo `onSelect`). */
  profile?: { image: string | null; name: string | null; handle: string | null };
};

export const DIVIDER: MenuItem = { label: "", divider: true };

/** Item de destaque (Entrar): grape com texto branco (8,0:1); no hover/foco, o sweep-lime do projeto com texto ink. */
const ITEM_ACCENT = `${ITEM_BASE} mb-1 bg-grape text-white sweep-lime hover:text-ink focus-visible:text-ink`;
/** Bloco do perfil: já tem o fundo track, então o hover é um tom acima (mist), com a mesma transição. */
const ITEM_PROFILE = `${ITEM_BASE} justify-start gap-3 bg-track py-1.5 text-ink transition-colors duration-200 hover:bg-mist focus-visible:bg-mist`;
/**
 * Rodapé (Sair | Termos Privacidade): link-botão do projeto, sem fundo nem caixa em nenhum estado (09-menu-perfil.md,
 * terceira rodada). Hover: só o texto escurece (danger → danger-deep; grape → grape-deep). Foco por teclado: o mesmo
 * texto mais escuro e um sublinhado mais grosso, sem contorno em volta. Toque no celular: sem o realce cinza/azul que
 * o navegador pinta por cima do link (-webkit-tap-highlight-color).
 */
const FOOT = "inline-flex min-h-11 items-center gap-2 rounded-none bg-transparent px-1 text-sm font-bold transition-colors outline-none [-webkit-tap-highlight-color:transparent] disabled:opacity-80 sm:min-h-9";
const FOOT_LINK = `${FOOT} text-grape underline underline-offset-4 hover:text-grape-deep focus-visible:text-grape-deep focus-visible:decoration-2`;
const FOOT_DANGER = `${FOOT} text-danger underline-offset-4 hover:text-danger-deep focus-visible:text-danger-deep focus-visible:underline focus-visible:decoration-2`;
const itemClass = (item: MenuItem) => `${item.accent ? ITEM_ACCENT : ITEM} ${item.className ?? ""}`;

/**
 * Botão "Menu" do cabeçalho e o painel que ele abre (specs/cabecalho e login-duelo/09-menu-perfil.md). Os itens chegam
 * prontos do cabeçalho (eles mudam por página); "Seguir no X" e o rodapé (Sair com conta, Termos, Privacidade) são fixos.
 * Teclado: setas ↑/↓, Home e End andam pelos itens; Esc fecha e devolve o foco ao botão; Tab sai e fecha.
 * Fecha também com clique fora e ao escolher um item.
 */
export default function SiteMenu({ items, onSignOut, unread = 0 }: { items: MenuItem[]; onSignOut?: () => void; unread?: number }) {
  const { open, close, buttonProps, panelProps } = useMenu();
  const [leaving, setLeaving] = useState(false);

  /** Escolheu um item: fecha e devolve o foco ao botão (as janelas abertas daqui devolvem o foco a ele ao fechar). */
  function choose(item: MenuItem) {
    close(true);
    item.onSelect?.();
  }

  const all: MenuItem[] = [...items, { label: "Seguir no X", href: X_URL, external: true, hint: `@${X_HANDLE}` }];

  return (
    <div className="relative">
      <button {...buttonProps} aria-label={unread > 0 ? `Menu, ${unread} ${unread === 1 ? "notificação não lida" : "notificações não lidas"}` : "Menu"} className={`${HEADER_ICON_BTN} relative`}>
        <Icon icon={faBars} className="text-base" />
        {/* notificações não lidas: bolinha lime com o número, no canto do botão */}
        {unread > 0 && (
          <span aria-hidden="true" className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-paper bg-lime px-1 text-[11px] leading-none font-extrabold text-ink tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        {/* só o ícone (specs/cabecalho/02-sequencia.md, seção 4); o nome fica no aria-label */}
      </button>

      {open && (
        <div {...panelProps} aria-label="Menu" className={PANEL}>
          {all.map((item, i) =>
            item.divider ? (
              // divisórias de ponta a ponta do painel (sem o recuo lateral)
              <div key={`divider-${i}`} className="-mx-2 my-1 border-t-2 border-track" aria-hidden="true" />
            ) : item.profile ? (
              <button
                key={`profile-${i}`}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => choose(item)}
                className={`${ITEM_PROFILE} mb-1`}
              >
                <ProfileAvatar image={item.profile.image} name={item.profile.name} size={44} className="text-base" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg leading-tight font-extrabold">{item.profile.name ?? "Você"}</span>
                  {item.profile.handle ? (
                    <span className="block truncate text-sm font-bold text-grape">@{item.profile.handle}</span>
                  ) : (
                    <span className="block text-sm font-semibold text-muted">sem username ainda</span>
                  )}
                </span>
                <Icon icon={faChevronRight} className="text-sm text-grape" />
              </button>
            ) : item.href ? (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  close(false);
                  item.onSelect?.();
                }}
                {...(item.external && { target: "_blank", rel: "noopener noreferrer", "aria-label": `${item.label} ${item.hint ?? ""} (abre em nova aba)` })}
                className={itemClass(item)}
              >
                {item.label}
                {item.hint && <span className="text-sm font-semibold text-muted">{item.hint}</span>}
                <UnreadDot count={item.badge ?? 0} />
              </Link>
            ) : (
              <button key={item.label} type="button" role="menuitem" tabIndex={-1} onClick={() => choose(item)} className={itemClass(item)}>
                {item.label}
              </button>
            ),
          )}
          {/* rodapé numa linha: Sair (danger) à esquerda; Termos e Privacidade à direita */}
          <div className="-mx-2 mt-1 flex items-center gap-3 border-t-2 border-track px-3 pt-1">
            {onSignOut && (
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                // spinner na hora; o Menu fica aberto até a página sem conta entrar (sem o "pulo")
                disabled={leaving}
                aria-busy={leaving}
                onClick={() => {
                  setLeaving(true);
                  onSignOut();
                }}
                className={FOOT_DANGER}
              >
                {leaving && <Spinner />}
                Sair
              </button>
            )}
            <div role="group" aria-label="Termos e privacidade" className="ml-auto flex gap-3">
              <Link href="/terms" role="menuitem" tabIndex={-1} onClick={() => close(false)} className={FOOT_LINK}>
                Termos
              </Link>
              <Link href="/privacy" role="menuitem" tabIndex={-1} onClick={() => close(false)} className={FOOT_LINK}>
                Privacidade
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
