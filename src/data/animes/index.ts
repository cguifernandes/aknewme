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
//  - Modo Emoji:  `emojis` (4); as dicas saem de `genre`, `year`, `studio` e do título.
//    `emojiClues` (2 pistas em texto) ficam para os posts do bot do X e o catálogo do /plays
//  - Modo Pistas: `year`, `studio`, `genre`, `episodes`, `synopsis`
//  - Modo Opening:`openings` — uma ou mais aberturas; o jogo sorteia qual toca.
//    Cada uma com `audioSrc`: prévia oficial de 30s do Apple Music (rode
//    `npm run openings` para buscar as que faltam) ou um arquivo em /public/audio
//    (ex.: "/audio/one-piece.mp3"). Aberturas sem `audioSrc` não são sorteadas;
//    anime sem nenhuma com áudio fica FORA do Modo Opening (continua nos outros).
//
// O Mais ou Menos usa ainda a nota e o nº de membros do MyAnimeList e a imagem do AniList, que ficam em mal.ts
// (gerado por `npm run mal`; rode de novo ao adicionar um anime).
//
// `aliases`: respostas alternativas aceitas (acentos/caixa são ignorados na comparação).
// ============================================================

import { ANOS_2000 } from "./anos-2000";
import { ANOS_2010 } from "./anos-2010";
import { ANOS_2015 } from "./anos-2015";
import { ANOS_2020 } from "./anos-2020";
import { ANILIST_FAVOURITES } from "./anilist";
import { CLASSICOS } from "./classicos";
import { MAL } from "./mal";

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
  /** Nota e membros no MyAnimeList + imagens: `image` deitada (banner) e `cover` em retrato (vêm de mal.ts). Sem imagem o anime fica fora do Mais ou Menos. */
  mal?: { id: number; score: number; members: number; image?: string; cover?: string };
  /** Favoritos no AniList (vêm de anilist.ts, `npm run anilist`): só a pergunta de favoritos do Mais ou Menos usa. */
  favourites?: number;
};

export const ANIMES: Anime[] = [...CLASSICOS, ...ANOS_2000, ...ANOS_2010, ...ANOS_2015, ...ANOS_2020].map((a) => {
  const m = MAL[a.title];
  const favourites = ANILIST_FAVOURITES[a.title];
  return { ...a, ...(m && { mal: { id: m[0], score: m[1], members: m[2], image: m[3], cover: m[4] } }), ...(favourites && { favourites }) };
});
