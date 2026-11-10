// Painel /plays: leitura dos contadores que api/played grava no Redis (um hash "played:<dia>" por dia).
import { EPOCH_UTC, MODE_LABEL, type GameMode } from "./game";

export const MODES = Object.keys(MODE_LABEL) as GameMode[];
/** Contadores de um dia (ou a soma de vários), como vêm do Redis: tudo texto. */
export type Counts = Record<string, string>;
/** Um dia do painel; as listas vêm sempre do dia mais recente para o mais antigo. */
export type DayRow = { day: number; c: Counts };

export const num = (c: Counts, k: string) => Number(c[k] ?? 0);
/** Soma um contador dos três modos: sum(c) = jogos terminados; ":start" = começados; ":won" = acertos. */
export const sum = (c: Counts, suffix = "") => MODES.reduce((t, m) => t + num(c, m + suffix), 0);
/** Soma os contadores de vários dias num só (filtro de período). */
export const total = (list: Counts[]) => {
  const t: Counts = {};
  for (const c of list) for (const k in c) t[k] = String(num(t, k) + num(c, k));
  return t;
};
export const visits = (c: Counts) => num(c, "visit:mobile") + num(c, "visit:desktop");
/** a de b em %; "—" sem base (ex.: dias antes do contador de "começaram"). */
export const pct = (a: number, b: number) => (b > 0 ? `${Math.min(100, Math.round((100 * a) / b))}%` : "—");
export const date = (day: number) =>
  new Date(EPOCH_UTC + (day - 1) * 86_400_000).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });

/** Cartão branco das seções do painel. */
export const PANEL = "rounded-3xl bg-white p-5 shadow-pop sm:p-6";
