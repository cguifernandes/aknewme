import { api } from "./account";
import { outcome, playerId, type DuelRecord, type Rival } from "./challenge";
import { getDailyResult, type GameMode } from "./game";
import { loadMoves } from "./moves";

// Duelos por link na conta, do lado do navegador (specs/login-duelo/14-duelos-na-conta-e-paginacao.md). Quem está logado
// manda as jogadas do desafio de hoje (o servidor recalcula o placar) e a janela "Duelos" lê da conta. Sem conta, nada
// daqui roda: o duelo segue só no navegador e no Redis.

/**
 * A sua partida de hoje no formato que o servidor confere (jogadas + o placar que o navegador diz). null sem as jogadas
 * de hoje (partida do arquivo, ou jogada antes de guardar jogadas).
 */
export function myGame(mode: GameMode, day: number) {
  const r = getDailyResult(mode);
  const moves = loadMoves(mode, day);
  if (!r || r.day !== day || !moves) return null;
  return { moves, claimed: { won: r.won, score: r.score ?? null }, player: playerId() };
}

/**
 * Salva na conta a sua partida de um duelo: "challenger" ao mandar o link, "responder" ao terminar o desafio de alguém
 * (`rival` = quem desafiou, como veio no link). Usa as jogadas guardadas de hoje; sem elas (partida do arquivo, ou
 * jogada antes de guardar jogadas), não manda. Nunca atrapalha o desafio: erro de rede ou 409 só não salva.
 */
export async function saveDuelToAccount(
  role: "challenger" | "responder",
  mode: GameMode,
  day: number,
  id: string | null | undefined,
  nick: string,
  rival?: { nick: string; tiles: string[]; won: boolean },
) {
  const game = myGame(mode, day);
  if (!id || !game) return null;
  return api<{ result: { won: boolean; score: number | null; tiles: string[] } }>("/api/link-duels", "POST", {
    id, role, mode, day, ...game, nick, ...(rival && { rival }),
  });
}

type Item = {
  mode: GameMode; day: number; t: number;
  me: { tiles: string[]; won: boolean };
  rival: { nick: string; tiles: string[]; won: boolean; account: string | null; player: string | null };
};

/** Busca adiantada (hover/foco no "Ver placar"): a janela usa a mesma resposta se ela tiver menos de 15 s */
let early: { at: number; data: Promise<Rival[] | null> } | null = null;
export function prefetchRivals() {
  if (!early || Date.now() - early.at > 15_000) early = { at: Date.now(), data: loadRivals() };
}

/** Os duelos da conta, já no formato da janela "Duelos" (placar por rival). null = não deu para carregar. */
export async function accountRivals(): Promise<Rival[] | null> {
  if (early && Date.now() - early.at <= 15_000) {
    const data = early.data;
    early = null;
    return data;
  }
  return loadRivals();
}

async function loadRivals(): Promise<Rival[] | null> {
  const res = await api<{ items: Item[] }>("/api/link-duels");
  if (!res.ok) return null;
  const by = new Map<string, Rival>();
  for (const it of res.data.items) {
    // rival com conta: pela conta (o mesmo em qualquer aparelho); sem conta: apelido + código do navegador dele
    const key = it.rival.account ? `u:${it.rival.account}` : `${it.rival.nick}|${it.rival.player ?? ""}`;
    const theirs = { day: it.day, nick: it.rival.nick, tiles: it.rival.tiles, won: it.rival.won };
    const d: DuelRecord = { nick: it.rival.nick, mode: it.mode, day: it.day, outcome: outcome(it.mode, it.me, theirs), t: it.t, me: it.me.tiles, mw: it.me.won, them: it.rival.tiles, tw: it.rival.won };
    const r = by.get(key) ?? { key, nick: it.rival.nick, wins: 0, losses: 0, ties: 0, duels: [] };
    if (d.outcome === "win") r.wins++;
    else if (d.outcome === "lose") r.losses++;
    else r.ties++;
    // um duelo por modo e dia contra cada rival (o primeiro que chegou)
    if (!r.duels.some((x) => x.mode === d.mode && x.day === d.day)) r.duels.push(d);
    by.set(key, r);
  }
  return [...by.values()].sort((a, b) => b.wins - b.losses - (a.wins - a.losses) || b.wins + b.losses - (a.wins + a.losses));
}
