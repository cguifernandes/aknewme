"use client";

import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { activeRoom } from "@/lib/account";
import { dailyNumber, type GameMode } from "@/lib/game";
import { Icon } from "../icons";

/**
 * Fim de jogo, aba de desafiar: "Voltar para a sala", só para quem já está numa sala deste modo hoje (veio de uma sala e
 * jogou). O botão "Desafiar amigos" (criar sala) saiu do fim de jogo (login-duelo/12-desafio-com-conta.md); a sala com
 * amigos começa pelo "Desafiar" de /friends ou por /room/new.
 */
export default function BackToRoomLink({ mode, className }: { mode: GameMode; className: string }) {
  const [room, setRoom] = useState<string | null>(null);
  useEffect(() => setRoom(activeRoom(mode, dailyNumber())), [mode]);
  if (!room) return null;
  return (
    <Link href={`/room/${room}`} className={className}>
      <Icon icon={faUserGroup} className="text-[15px]" />
      Voltar para a sala
    </Link>
  );
}
