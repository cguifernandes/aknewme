"use client";

import { useEffect } from "react";
import { trackVisit } from "@/lib/game";

/** Conta a visita do dia (painel /plays: celular × PC). Não desenha nada. */
export default function VisitBeacon() {
  useEffect(trackVisit, []);
  return null;
}
