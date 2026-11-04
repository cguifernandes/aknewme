// ============================================================
// BANCO DE ANIMES — para adicionar/alterar jogos, edite os arquivos
// desta pasta, divididos pela década de estreia:
//   classicos.ts  → até 1999
//   anos-2000.ts  → 2000 a 2009
//   anos-2010.ts  → 2010 a 2014
//   anos-2015.ts  → 2015 a 2019
//   anos-2020.ts  → 2020 em diante
// Cole o anime novo no arquivo da década certa; a lista ANIMES abaixo
// junta todos. Se um arquivo passar de 500 linhas, divida-o.
//
// Cada anime alimenta os três modos:
//  - Modo Emoji:  `emojis` (4) + `emojiClues` (2 pistas, liberadas por erro)
//  - Modo Pistas: `year`, `studio`, `genre`, `episodes`, `synopsis`
//  - Modo Opening:`openings` — uma ou mais aberturas; o jogo sorteia qual toca.
//    Cada uma com `audioSrc`: prévia oficial de 30s do Apple Music (rode
//    `npm run openings` para buscar as que faltam) ou um arquivo em /public/audio
//    (ex.: "/audio/one-piece.mp3"). Aberturas sem `audioSrc` não são sorteadas;
//    anime sem nenhuma com áudio fica FORA do Modo Opening (continua nos outros).
//
// `aliases`: respostas alternativas aceitas (acentos/caixa são ignorados na comparação).
// ============================================================

import { ANOS_2000 } from "./anos-2000";
import { ANOS_2010 } from "./anos-2010";
import { ANOS_2015 } from "./anos-2015";
import { ANOS_2020 } from "./anos-2020";
import { CLASSICOS } from "./classicos";

export type Opening = {
  name: string;
  artist: string;
  /** Trecho de áudio (a partir do 0s): URL da prévia do Apple Music ou /audio/arquivo.mp3 */
  audioSrc?: string;
  /** Página da música no Apple Music */
  appleMusic?: string;
};

export type Anime = {
  title: string;
  aliases: string[];
  emojis: [string, string, string, string];
  emojiClues: [string, string];
  year: number;
  studio: string;
  genre: string;
  episodes: string;
  synopsis: string;
  /** Pelo menos uma; a primeira é a mais conhecida */
  openings: [Opening, ...Opening[]];
};

export const ANIMES: Anime[] = [...CLASSICOS, ...ANOS_2000, ...ANOS_2010, ...ANOS_2015, ...ANOS_2020];
