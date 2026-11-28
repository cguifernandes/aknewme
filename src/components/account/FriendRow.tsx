"use client";

import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import { DUEL_TEXT } from "@/lib/duelTexts";
import { ago, monthYear } from "@/lib/relTime";
import { ProfileAvatar, Spinner } from "./ui";

export type FriendItem = {
  id: string;
  handle: string | null;
  name: string | null;
  image: string | null;
  wins: number;
  losses: number;
  roomToday: string | null;
  /** quando a amizade foi aceita */
  since: string;
  /** duelos por link salvos na conta dos dois: o seu placar contra ele e quando foi o último */
  duels: { wins: number; losses: number; ties: number; last: string | null };
};

/** A linha pequena embaixo do nome: "Último duelo há 34 minutos · Amigos desde nov/2026" */
function friendInfo(f: FriendItem) {
  return [
    f.duels.last ? `Último duelo ${ago(f.duels.last)}` : null,
    `Amigos desde ${monthYear(f.since)}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** O placar à direita: "2 x 0" grande e a legenda ("Você lidera", "Você está atrás", "Empate"); sem duelos, só "Sem duelos" */
function Score({ duels: d }: { duels: FriendItem["duels"] }) {
  const played = d.wins + d.losses + d.ties;
  const label = !played
    ? "Sem duelos"
    : d.wins > d.losses
      ? "Você lidera"
      : d.wins < d.losses
        ? "Você está atrás"
        : "Empate";
  return (
    <p className="shrink-0 text-right leading-tight">
      {played > 0 && (
        <span className="block font-display text-lg font-extrabold text-ink tabular-nums">
          <span className="sr-only">Duelos: </span>
          {d.wins} x {d.losses}
        </span>
      )}
      <span className="block text-[11px] font-bold text-grape">{label}</span>
    </p>
  );
}

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
/** Pílula pequena das linhas (Desafiar, Aceitar, Recusar): 36 px no computador, 44 px de toque no celular. */
export const PILL = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 px-4 text-sm font-bold whitespace-nowrap disabled:opacity-60 sm:min-h-9 ${FOCUS}`;
const MENU_ITEM = `flex min-h-10 w-full items-center rounded-xl px-3 text-left text-sm font-bold transition-colors hover:bg-track focus-visible:bg-track ${FOCUS}`;

/**
 * Uma linha da lista de amigos (specs/login-duelo/10-amigos.md e 13-escopo-lancamento.md): avatar, nome e @ em cima,
 * embaixo (pequeno) o placar dos duelos por link com você, o último duelo e desde quando são amigos; à direita "Duelar"
 * (abre a janela de desafio por link, ChallengeDialog) e o "⋯" (bolinha grape) com "Copiar username" e "Remover amigo".
 * Sem placar: ele vinha das salas, que estão desligadas.
 * Remover pede confirmação na própria linha: a foto e o nome ficam; só a parte da direita vira "Remover" e "Cancelar".
 * O fundo do hover respeita os cantos do cartão (primeira e última linha arredondadas).
 */
export default function FriendRow({
  friend,
  onChallenge,
  onRemove,
}: {
  friend: FriendItem;
  onChallenge: () => void;
  /** remove a amizade; a linha mostra o spinner até terminar */
  onRemove: () => Promise<void>;
}) {
  const [menu, setMenu] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const name = friend.name ?? `@${friend.handle}`;

  // o menu fecha com Esc e com clique fora
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    const onDown = (e: PointerEvent) =>
      !wrap.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [menu]);

  async function copyUsername() {
    try {
      await navigator.clipboard.writeText(`@${friend.handle}`);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setMenu(false);
      }, 1200);
    } catch {
      setMenu(false); // sem acesso à área de transferência: o username está escrito na linha
    }
  }

  async function remove() {
    setRemoving(true);
    await onRemove();
    setRemoving(false); // se deu certo a linha já some com a lista nova; se não, volta ao normal
    setConfirming(false);
  }

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 transition-colors first:rounded-t-[1.375rem] last:rounded-b-[1.375rem] hover:bg-track/60">
      <ProfileAvatar
        image={friend.image}
        name={friend.name ?? friend.handle}
        size={44}
        className="text-sm"
      />
      {/* no celular o texto ocupa a linha toda (o nome não corta) e os botões descem, alinhados à direita */}
      <p className="min-w-0 flex-1 max-sm:basis-[calc(100%-3.5rem)]">
        <span className="flex min-w-0 items-baseline gap-x-2 whitespace-nowrap">
          <span className="min-w-0 truncate font-bold text-ink">
            {friend.name ?? `@${friend.handle}`}
          </span>
          {friend.name && (
            <span className="min-w-0 shrink-[2] truncate text-sm font-semibold text-grape">
              @{friend.handle}
            </span>
          )}
        </span>
        <span
          suppressHydrationWarning
          className="mt-0.5 block text-xs text-muted"
        >
          {friendInfo(friend)}
        </span>
      </p>
      {confirming ? (
        // confirmação: a foto e o nome ficam; a parte da direita vira Remover / Cancelar
        <div
          role="group"
          aria-label={`Remover ${name} dos seus amigos?`}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            autoFocus
            onClick={remove}
            disabled={removing}
            aria-busy={removing}
            className={`${PILL} border-danger bg-danger text-white transition-colors not-disabled:hover:border-danger-deep not-disabled:hover:bg-danger-deep`}
          >
            {removing && <Spinner />} Remover
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={removing}
            className={`${PILL} border-track bg-paper text-ink sweep-track`}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <>
          {/* o placar, o Duelar e o "⋯" juntos à direita; no celular descem juntos para a 2ª linha (o nome não corta) */}
          <div className="flex items-center gap-3 max-sm:w-full max-sm:justify-end">
            <Score duels={friend.duels} />
            <button
              type="button"
              onClick={onChallenge}
              className={`${PILL} border-track bg-paper text-ink sweep-lime`}
              aria-label={DUEL_TEXT.dialogTitle(name)}
            >
              {DUEL_TEXT.listButton}
            </button>
            <div ref={wrap} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menu}
                aria-label={`Mais opções para ${name}`}
                onClick={() => setMenu((o) => !o)}
                className={`flex size-11 items-center justify-center rounded-full bg-grape text-white transition-colors hover:bg-grape-deep sm:size-9 ${FOCUS}`}
              >
                <Icon icon={faEllipsis} />
              </button>
              {menu && (
                <div
                  role="menu"
                  className="absolute top-full right-0 z-20 mt-1 w-56 animate-menu-in rounded-2xl border-2 border-mist bg-paper p-1.5 shadow-pop"
                >
                  <button
                    type="button"
                    role="menuitem"
                    autoFocus
                    onClick={copyUsername}
                    className={`${MENU_ITEM} text-ink`}
                  >
                    {copied ? "Copiado!" : "Copiar username"}
                  </button>
                  <span aria-live="polite" className="sr-only">
                    {copied ? `@${friend.handle} copiado` : ""}
                  </span>
                  <div
                    className="-mx-1.5 my-1 border-t-2 border-track"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      setConfirming(true);
                    }}
                    className={`${MENU_ITEM} text-danger`}
                  >
                    Remover amigo
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </li>
  );
}
