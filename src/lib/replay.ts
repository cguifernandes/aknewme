import { dailyAnimes, isCorrectGuess, isKnownAnime, OPENING_STAGES, rescueChoices, type GameMode } from "./game";
import { RESCUE_SCORE } from "./stats";

// Recálculo do placar no servidor (specs/login-duelo, R12 e CA5). O navegador manda as jogadas, na ordem; o servidor
// refaz a partida com as mesmas regras dos jogos (src/components/games) e o desafio daquele dia. O resultado pronto do
// navegador só serve para conferir: se não bater, a rota responde 409 e nada é gravado.
// Mudou uma regra em EmojiGame, OpeningGame ou CluesGame? Mude aqui também e rode `npm test`.

/**
 * Uma jogada. guess: palpite (todos os modos). skip: pular a rodada (Emoji) ou a tentativa (Opening).
 * letter: abrir a primeira letra (Emoji, dica 3). reveal: abrir a próxima pista (Pistas).
 * rescue: abrir o modo resgate (Opening). choose: escolher uma das 4 alternativas do resgate (Opening).
 */
export type Move = { t: "guess"; g: string } | { t: "choose"; g: string } | { t: "skip" } | { t: "letter" } | { t: "reveal" } | { t: "rescue" };
export type Replayed = { won: boolean; score: number | null; tiles: string[] };

export const MAX_GUESS_LEN = 80;
export const MAX_MOVES = 60;
const ALLOWED: Record<GameMode, Move["t"][]> = {
  emoji: ["guess", "skip", "letter"],
  opening: ["guess", "skip", "rescue", "choose"],
  pistas: ["guess", "reveal"],
};

/** Jogadas válidas para o modo, ou null. Palpite: até 80 caracteres e título/apelido do catálogo. */
export function parseMoves(mode: GameMode, raw: unknown): Move[] | null {
  if (!Array.isArray(raw) || !raw.length || raw.length > MAX_MOVES) return null;
  const out: Move[] = [];
  for (const m of raw) {
    const t = (m as { t?: unknown })?.t as Move["t"];
    if (!ALLOWED[mode].includes(t)) return null;
    if (t === "guess" || t === "choose") {
      const g = (m as { g?: unknown }).g;
      if (typeof g !== "string" || g.length > MAX_GUESS_LEN || !isKnownAnime(g)) return null;
      out.push({ t, g });
    } else out.push({ t } as Move);
  }
  return out;
}

const EMOJI_ROUNDS = 5;
const EMOJI_LIVES = 3;
const RESCUE_AT = 4; // erros/pulos até liberar o resgate (OpeningGame)
const CLUES = 5;

/** Emoji: 5 rodadas, 3 vidas por rodada. 🟩 de primeira, 🟨 com erro, 🟥 sem vidas, ⬛ pulou. */
function replayEmoji(day: number, moves: Move[]): Replayed | null {
  const rounds = dailyAnimes("emoji", day);
  const tiles: string[] = [];
  let points = 0;
  let lives = EMOJI_LIVES;
  let wrong = 0;
  const close = (tile: string) => {
    tiles.push(tile);
    lives = EMOJI_LIVES;
    wrong = 0;
  };
  for (const m of moves) {
    if (tiles.length >= EMOJI_ROUNDS) return null; // jogada depois do fim
    if (m.t === "letter") continue; // a dica 3 não muda o placar
    if (m.t === "skip") close("⬛");
    else if (m.t === "guess") {
      if (isCorrectGuess(m.g, rounds[tiles.length])) {
        points++;
        close(wrong === 0 ? "🟩" : "🟨");
      } else {
        lives--;
        wrong++;
        if (lives <= 0) close("🟥");
      }
    } else return null;
  }
  if (tiles.length < EMOJI_ROUNDS) return null; // partida não terminou
  return { won: points > 0, score: points, tiles };
}

/** Opening: 6 tentativas; o resgate abre depois de 4 erros/pulos e vale RESCUE_SCORE. */
function replayOpening(day: number, moves: Move[]): Replayed | null {
  const anime = dailyAnimes("opening", day)[0];
  const tiles: string[] = [];
  let rescue = false;
  let end: Replayed | null = null;
  const finish = (won: boolean) => {
    const score = won ? (rescue ? RESCUE_SCORE : tiles.length) : null;
    end = { won, score, tiles: [...tiles, ...Array(Math.max(0, OPENING_STAGES.length - tiles.length)).fill("⬜")] };
  };
  for (const m of moves) {
    if (end) return null;
    if (m.t === "rescue") {
      if (tiles.length < RESCUE_AT) return null;
      rescue = true; // abrir de novo depois de voltar ao palpite não muda nada
    } else if (m.t === "choose") {
      if (!rescue || !rescueChoices(anime, day).some((a) => isCorrectGuess(m.g, a))) return null;
      const hit = isCorrectGuess(m.g, anime);
      tiles.push(hit ? "🟨" : "🟥");
      finish(hit);
    } else if (m.t === "guess" && isCorrectGuess(m.g, anime)) {
      tiles.push(rescue ? "🟨" : "🟩");
      finish(true);
    } else if (m.t === "guess" || m.t === "skip") {
      tiles.push(m.t === "skip" ? "⬛" : "🟥");
      if (tiles.length >= OPENING_STAGES.length) finish(false);
    } else return null;
  }
  return end;
}

/** Pistas: começa com 1 pista; erro ou "revelar" abre a próxima; vale 6 − pistas abertas. */
function replayClues(day: number, moves: Move[]): Replayed | null {
  const anime = dailyAnimes("pistas", day)[0];
  let revealed = 1;
  let end: Replayed | null = null;
  const finish = (won: boolean) => {
    const tiles = [...Array(revealed - 1).fill("🟪"), won ? "🟩" : "🟥", ...Array(CLUES - revealed).fill("⬜")];
    end = { won, score: won ? CLUES + 1 - revealed : null, tiles };
  };
  for (const m of moves) {
    if (end) return null;
    if (m.t === "reveal") {
      if (revealed >= CLUES) return null;
      revealed++;
    } else if (m.t === "guess") {
      if (isCorrectGuess(m.g, anime)) finish(true);
      else if (revealed >= CLUES) finish(false);
      else revealed++;
    } else return null;
  }
  return end;
}

/** Refaz a partida do dia `day`; null se as jogadas não formam uma partida completa e possível. */
export function replay(mode: GameMode, day: number, moves: Move[]): Replayed | null {
  if (!Number.isInteger(day) || day < 1) return null;
  if (mode === "emoji") return replayEmoji(day, moves);
  if (mode === "opening") return replayOpening(day, moves);
  return replayClues(day, moves);
}

/** O resultado que o navegador diz ter tido bate com o recálculo? */
export const sameResult = (r: Replayed, claimed: { won: unknown; score: unknown }) =>
  claimed.won === r.won && (claimed.score ?? null) === r.score;
