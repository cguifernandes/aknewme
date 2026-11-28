import { dailyNumber, playDay, type GameMode } from "./game";
import type { Move } from "./replay";

// Jogadas da partida de hoje, guardadas neste navegador, para a sala de duelo com amigos mandar ao servidor, que
// recalcula o placar (src/lib/replay.ts). Só o desafio de hoje (o arquivo não entra em sala). Não muda nada no jogo.

const key = (mode: GameMode) => `aknewme.moves.${mode}`;

export function recordMove(mode: GameMode, move: Move) {
  const day = playDay();
  if (day !== dailyNumber()) return;
  try {
    const saved = JSON.parse(localStorage.getItem(key(mode)) ?? "null");
    const moves: Move[] = saved?.day === day && Array.isArray(saved.moves) ? saved.moves : [];
    localStorage.setItem(key(mode), JSON.stringify({ day, moves: [...moves, move].slice(0, 60) }));
  } catch {}
}

/** Jogadas guardadas daquele dia, ou null (outro dia, nada guardado ou localStorage indisponível). */
export function loadMoves(mode: GameMode, day: number): Move[] | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key(mode)) ?? "null");
    return saved?.day === day && Array.isArray(saved.moves) && saved.moves.length ? saved.moves : null;
  } catch {
    return null;
  }
}
