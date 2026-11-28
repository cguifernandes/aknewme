"use client";

import { faPlay } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MODE_NAME } from "@/lib/account";
import { clock, DUEL_TEXT } from "@/lib/duelTexts";
import {
  playedHere,
  inviteMsLeft,
  notificationText,
  type NotificationItem,
} from "@/lib/notify";
import { LIME_DARKEN } from "../buttons";
import { Icon } from "../icons";
import { useNotifications } from "./Notifications";
import { ProfileAvatar } from "./ui";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime";
/** Botão escuro dentro das pílulas ("Jogar", "Ver placar"): 44 px de toque no celular */
const DARK_BTN = `inline-flex min-h-11 items-center rounded-full bg-ink px-3.5 text-xs font-bold text-white sweep-grape sm:min-h-8 ${FOCUS}`;

/** Os convites de cada pessoa juntos (uma linha por quem desafiou), na ordem em que chegaram */
function byPerson(invites: NotificationItem[]) {
  const rows = new Map<string, NotificationItem[]>();
  for (const n of invites)
    rows.set(n.actor.id, [...(rows.get(n.actor.id) ?? []), n]);
  return [...rows.values()];
}

/**
 * "Desafios" no topo de /friends (specs/login-duelo/15-desafio-por-notificacao.md): cartão grape com a bolinha lime da
 * quantidade; uma linha por pessoa que desafiou, com os modos juntos ("Ana te desafiou em 2 modos" ou "no Emoji #202"),
 * "o placar aparece depois que você jogar · expira em 1:42" (o convite que vence primeiro) e, à direita, um botão lime
 * inteiro por modo ("Jogar Opening #202", LIME_DARKEN no hover). Convite vencido sai na hora (notify.ts). Só convites recebidos: as respostas aos seus duelos ("Bia respondeu…")
 * ficam na bolinha e no aviso, com "Ver placar". Sem convite, o cartão não aparece.
 */
export default function DuelNotices() {
  const { items } = useNotifications();
  const invites = items.filter(
    (n) => n.type === "duel_challenge" && n.duel?.href,
  );
  // o "expira em" conta a cada segundo enquanto há convite
  const [, tick] = useState(0);
  useEffect(() => {
    if (!invites.length) return;
    const t = setInterval(() => tick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [invites.length]);

  const total = invites.length;
  if (!total) return null;

  return (
    <section
      aria-labelledby="duel-notices-title"
      className="rounded-3xl bg-grape p-4 text-white sm:p-5"
    >
      <h2
        id="duel-notices-title"
        className="flex items-center gap-2.5 font-display text-lg font-extrabold"
      >
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full bg-lime shadow-[0_0_8px_var(--color-lime)]"
        />
        {DUEL_TEXT.noticesTitle}
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-lime px-1.5 text-xs font-extrabold text-ink tabular-nums">
          <span aria-hidden="true">{total}</span>
          <span className="sr-only">: {total}</span>
        </span>
      </h2>
      <ul className="mt-3 grid gap-2">
        {byPerson(invites).map((list) => {
          const who = list[0].actor;
          const name = who.name ?? (who.handle ? `@${who.handle}` : "Alguém");
          const first = list[0].duel!;
          // o prazo conta só nos modos que você ainda não jogou; jogou todos: "Você já jogou: veja o duelo"
          const open = list.filter((n) => !playedHere(n));
          const left = Math.min(
            ...open.map((n) => inviteMsLeft(n) ?? Infinity),
          );
          return (
            <li
              key={who.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-2xl bg-grape-deep p-3"
            >
              <ProfileAvatar
                image={who.image}
                name={name}
                size={40}
                className="text-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {list.length === 1
                    ? DUEL_TEXT.challengedOne(
                        name,
                        MODE_NAME[first.mode],
                        first.day,
                      )
                    : DUEL_TEXT.challengedMany(name, list.length)}
                </p>
                <p className="text-xs text-lavender tabular-nums">
                  {open.length
                    ? DUEL_TEXT.challengedHint(
                        clock(Math.max(0, Math.ceil(left / 1000))),
                      )
                    : DUEL_TEXT.alreadyPlayed}
                </p>
              </div>
              <ul className="flex flex-wrap gap-2 max-sm:w-full">
                {list.map((n) => (
                  <li key={n.id} className="max-sm:flex-1">
                    {/* um botão lime inteiro por modo ("Jogar Opening #202"), com o lime que escurece no hover */}
                    <Link
                      href={n.duel!.href!}
                      aria-label={`${(playedHere(n) ? DUEL_TEXT.seeDuelMode : DUEL_TEXT.playMode)(MODE_NAME[n.duel!.mode], n.duel!.day)}: ${notificationText(n)}`}
                      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-bold whitespace-nowrap sm:min-h-9 ${LIME_DARKEN} ${FOCUS}`}
                    >
                      <Icon icon={faPlay} className="text-xs" />
                      {(playedHere(n)
                        ? DUEL_TEXT.seeDuelMode
                        : DUEL_TEXT.playMode)(
                        MODE_NAME[n.duel!.mode],
                        n.duel!.day,
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
