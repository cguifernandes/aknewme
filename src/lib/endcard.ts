import type { Anime } from "@/data/animes";
import { isHit } from "./challenge";
import type { GameMode } from "./game";

// Textos do fim de jogo (janela de resultado e duelo), a partir dos quadradinhos do resultado. Só contas e frases.

/** Como foi: top = gabaritou ou quase / de primeira · mid = acertou · low = não foi dessa vez. */
export type Tier = "top" | "mid" | "low";
export type Summary = { tier: Tier; lead: string; big: string; unit: string };

/** Placar grande do resultado e como ele foi. */
export function summarize(mode: GameMode, tiles: string[], won: boolean): Summary {
  const tried = tiles.filter((t) => t !== "⬜").length;
  if (mode === "emoji") {
    const hits = tiles.filter(isHit).length;
    const tier = hits >= tiles.length - 1 ? "top" : hits >= 2 ? "mid" : "low";
    return { tier, lead: "Você acertou", big: `${hits}/${tiles.length}`, unit: "rodadas" };
  }
  if (!won) return { tier: "low", lead: "Você acertou", big: "0", unit: `de ${tiles.length}` };
  const tier = tried === 1 ? "top" : "mid";
  return mode === "opening"
    ? { tier, lead: "Você acertou em", big: `${tried}`, unit: tried === 1 ? "tentativa" : "tentativas" }
    : { tier, lead: "Você acertou com", big: `${tried}`, unit: tried === 1 ? "pista" : "pistas" };
}

/** Textos das duas primeiras telas do fim de jogo, no tom do resultado: o título do resultado (aba 1) e o convite do duelo (aba 2). */
export const PITCH: Record<Tier, { title: string; duel: string }> = {
  top: {
    title: "Mandou bem hoje!",
    duel: "Será que alguém bate o seu placar?",
  },
  mid: {
    title: "Nada mal, foi um bom dia.",
    duel: "Acha que alguém da turma faz melhor?",
  },
  low: {
    title: "Hoje foi difícil.",
    duel: "Será que alguém faz pior?",
  },
};

/** Resultado que ninguém supera (tudo de primeira): no duelo, o máximo que o amigo consegue é empatar. */
export const unbeatable = (mode: GameMode, tiles: string[]) => (mode === "emoji" ? tiles.every((t) => t === "🟩") : tiles[0] === "🟩");

/** O que quem desafiou fez, para o convite ("Fez 4/5 no desafio #198."). As jogadas não aparecem, só o placar. */
export function challengeLine(mode: GameMode, tiles: string[], won: boolean, day: number): string {
  const s = summarize(mode, tiles, won);
  if (mode === "emoji") return `Fez ${s.big} no desafio #${day}.`;
  if (!won) return `Não acertou o desafio #${day}.`;
  return mode === "opening" ? `Acertou a opening do #${day} na ${s.big}ª tentativa.` : `Acertou o #${day} com ${s.big} ${s.unit}.`;
}

type Played = { tiles: string[]; won: boolean };

/** Frase embaixo do título do duelo: o que decidiu. `animes`: os do dia (Emoji cita a rodada que fez a diferença). */
export function duelLine(
  mode: GameMode,
  mine: Played,
  theirs: Played,
  result: "win" | "lose" | "tie",
  animes: Anime[] = [],
): string {
  // sem o nome de quem desafiou: ele já está no título logo acima
  if (result === "tie") return "Mesmo placar. O desempate fica para o próximo desafio.";
  const [winner, loser] = result === "win" ? [mine, theirs] : [theirs, mine];
  if (mode === "emoji") {
    // rodada que o vencedor acertou e o outro não
    const i = winner.tiles.findIndex((t, k) => isHit(t) && !isHit(loser.tiles[k] ?? ""));
    if (i < 0) return result === "win" ? "Mesmas rodadas, mas você acertou mais de primeira." : "Mesmas rodadas, mas com mais acertos de primeira. Revanche?";
    const title = animes[i]?.title ?? "uma rodada";
    return result === "win" ? `Você acertou ${title}, a rodada que decidiu.` : `${title} te escapou e decidiu o duelo. Revanche?`;
  }
  const less = mode === "opening" ? "menos tentativas" : "menos pistas";
  if (!loser.won) return result === "win" ? "Você acertou, e do outro lado não deu." : "Dessa vez você não acertou. Revanche?";
  return result === "win" ? `Você precisou de ${less}.` : `Precisou de ${less} que você. Revanche?`;
}
