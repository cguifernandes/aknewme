// ============================================================
// BANCO DE ANIMES — edite aqui para adicionar/alterar jogos.
//
// Cada anime alimenta os três modos:
//  - Modo Emoji:  `emojis` (4) + `emojiClues` (2 pistas, liberadas por erro)
//  - Modo Pistas: `year`, `studio`, `genre`, `episodes`, `synopsis`
//  - Modo Opening:`opening` — se `audioSrc` for definido (ex.: "/audio/one-piece.mp3",
//    arquivo colocado em /public/audio), o site toca o áudio real;
//    sem `audioSrc`, uma melodia chiptune (notas MIDI) é sintetizada no navegador.
//
// `aliases`: respostas alternativas aceitas (acentos/caixa são ignorados na comparação).
// ============================================================

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
  opening: {
    name: string;
    audioSrc?: string;
    /** [nota MIDI (0 = pausa), duração em batidas] */
    melody: { bpm: number; notes: [number, number][] };
  };
};

export const ANIMES: Anime[] = [
  {
    title: "One Piece",
    aliases: ["one piece"],
    emojis: ["🏴‍☠️", "👒", "🍖", "🌊"],
    emojiClues: ["O protagonista tem o corpo de borracha.", "Uma tripulação procura o maior tesouro do mundo."],
    year: 1999,
    studio: "Toei Animation",
    genre: "Aventura / Ação",
    episodes: "1100+",
    synopsis: "Um jovem de chapéu de palha reúne uma tripulação de piratas para encontrar o tesouro lendário e se tornar o Rei dos Piratas.",
    opening: {
      name: "We Are!",
      melody: {
        bpm: 152,
        notes: [[64, 1], [67, 1], [69, 1], [71, 2], [69, 1], [67, 1], [64, 2], [62, 1], [64, 1], [67, 2], [64, 1], [62, 1], [60, 3], [0, 1], [64, 1], [67, 1], [72, 2], [71, 1], [69, 1], [67, 2], [69, 4]],
      },
    },
  },
  {
    title: "Naruto",
    aliases: ["naruto", "naruto classico", "naruto shippuden"],
    emojis: ["🦊", "🍥", "🍜", "🥷"],
    emojiClues: ["O protagonista sonha em ser o líder da vila.", "Uma raposa de nove caudas vive selada dentro dele."],
    year: 2002,
    studio: "Studio Pierrot",
    genre: "Ação / Shounen",
    episodes: "220",
    synopsis: "Um ninja hiperativo e rejeitado pela vila treina para se tornar Hokage e ser reconhecido por todos.",
    opening: {
      name: "R★O★C★K★S",
      melody: {
        bpm: 148,
        notes: [[62, 1], [65, 1], [67, 1], [69, 2], [67, 1], [65, 1], [62, 2], [60, 1], [62, 1], [65, 2], [67, 2], [69, 1], [72, 1], [69, 1], [67, 1], [65, 2], [62, 4]],
      },
    },
  },
  {
    title: "Fullmetal Alchemist: Brotherhood",
    aliases: ["fullmetal alchemist", "fullmetal alchemist brotherhood", "fma", "fmab", "hagane no renkinjutsushi"],
    emojis: ["⚗️", "🦾", "🧥", "⚡"],
    emojiClues: ["Dois irmãos pagam caro por quebrar um tabu.", "A lei da troca equivalente rege tudo."],
    year: 2009,
    studio: "Bones",
    genre: "Ação / Fantasia",
    episodes: "64",
    synopsis: "Dois irmãos alquimistas buscam a Pedra Filosofal para recuperar seus corpos após uma transmutação humana proibida.",
    opening: {
      name: "Again (YUI)",
      melody: {
        bpm: 100,
        notes: [[69, 0.5], [71, 0.5], [72, 1], [71, 0.5], [69, 0.5], [67, 1], [69, 1], [64, 2], [0, 0.5], [64, 0.5], [67, 0.5], [69, 0.5], [71, 1], [72, 1], [74, 2], [72, 1], [71, 1], [69, 3]],
      },
    },
  },
  {
    title: "Attack on Titan",
    aliases: ["attack on titan", "shingeki no kyojin", "aot", "snk", "ataque dos titas"],
    emojis: ["🗡️", "🧱", "👹", "🪽"],
    emojiClues: ["A humanidade vive cercada por muralhas.", "Soldados voam com equipamento de manobra tridimensional."],
    year: 2013,
    studio: "Wit Studio / MAPPA",
    genre: "Ação / Drama",
    episodes: "94",
    synopsis: "Após sua cidade ser destruída por gigantes devoradores de humanos, um jovem jura exterminá-los até o último.",
    opening: {
      name: "Guren no Yumiya",
      melody: {
        bpm: 92,
        notes: [[64, 0.5], [64, 0.5], [64, 1], [62, 0.5], [64, 0.5], [67, 2], [64, 0.5], [62, 0.5], [60, 1], [62, 0.5], [64, 0.5], [59, 2], [57, 1], [59, 1], [60, 1], [62, 1], [64, 2], [67, 2]],
      },
    },
  },
  {
    title: "Death Note",
    aliases: ["death note"],
    emojis: ["📓", "🍎", "💀", "✒️"],
    emojiClues: ["Um caderno mata quem tem o nome escrito nele.", "Um detetive excêntrico vive à base de doces."],
    year: 2006,
    studio: "Madhouse",
    genre: "Suspense / Sobrenatural",
    episodes: "37",
    synopsis: "Um estudante genial encontra um caderno sobrenatural e decide criar um novo mundo eliminando criminosos.",
    opening: {
      name: "The WORLD",
      melody: {
        bpm: 138,
        notes: [[57, 1], [60, 1], [64, 1], [63, 1], [64, 1], [60, 1], [57, 2], [55, 1], [57, 1], [60, 2], [63, 1], [64, 1], [66, 2], [64, 1], [63, 1], [60, 1], [57, 3]],
      },
    },
  },
  {
    title: "Demon Slayer",
    aliases: ["demon slayer", "kimetsu no yaiba", "demon slayer kimetsu no yaiba"],
    emojis: ["🗡️", "👺", "🌊", "🌸"],
    emojiClues: ["A irmã do protagonista virou um demônio.", "Respirações são a base das técnicas de espada."],
    year: 2019,
    studio: "ufotable",
    genre: "Ação / Sobrenatural",
    episodes: "55+",
    synopsis: "Após ter a família massacrada, um jovem se junta a um esquadrão de caçadores para curar a irmã transformada em demônio.",
    opening: {
      name: "Gurenge",
      melody: {
        bpm: 135,
        notes: [[65, 0.5], [67, 0.5], [69, 1], [69, 0.5], [67, 0.5], [69, 1], [72, 1.5], [69, 0.5], [67, 1], [65, 1], [62, 2], [65, 0.5], [67, 0.5], [69, 1], [72, 1], [74, 2], [72, 1], [69, 3]],
      },
    },
  },
  {
    title: "My Hero Academia",
    aliases: ["my hero academia", "boku no hero academia", "boku no hero", "bnha", "mha"],
    emojis: ["🦸", "🏫", "💥", "📗"],
    emojiClues: ["Quase todo mundo nasce com um superpoder — menos ele.", "O herói número 1 lhe passa o próprio poder."],
    year: 2016,
    studio: "Bones",
    genre: "Ação / Superpoderes",
    episodes: "159",
    synopsis: "Num mundo onde 80% da população tem poderes, um garoto sem nenhum herda o dom do maior herói e entra para a academia de heróis.",
    opening: {
      name: "The Day",
      melody: {
        bpm: 104,
        notes: [[66, 0.5], [68, 0.5], [69, 1], [68, 0.5], [66, 0.5], [64, 1], [61, 1], [64, 2], [66, 0.5], [68, 0.5], [69, 1], [71, 1], [73, 2], [71, 1], [69, 1], [68, 1], [66, 3]],
      },
    },
  },
  {
    title: "Dragon Ball Z",
    aliases: ["dragon ball z", "dragon ball", "dbz"],
    emojis: ["🐉", "🟠", "👊", "💛"],
    emojiClues: ["Sete esferas realizam qualquer desejo.", "Guerreiros ficam loiros quando se transformam."],
    year: 1989,
    studio: "Toei Animation",
    genre: "Ação / Aventura",
    episodes: "291",
    synopsis: "Um guerreiro de outro planeta defende a Terra de vilões cada vez mais fortes ao lado dos amigos.",
    opening: {
      name: "Cha-La Head-Cha-La",
      melody: {
        bpm: 132,
        notes: [[67, 1], [69, 1], [71, 1.5], [69, 0.5], [67, 1], [64, 1], [67, 2], [64, 1], [62, 1], [64, 1], [67, 1], [71, 2], [72, 1], [71, 1], [69, 1], [67, 1], [69, 4]],
      },
    },
  },
  {
    title: "Jujutsu Kaisen",
    aliases: ["jujutsu kaisen", "jjk"],
    emojis: ["🤞", "👻", "🏫", "🩸"],
    emojiClues: ["O protagonista engole um dedo amaldiçoado.", "Feiticeiros exorcizam maldições nascidas de emoções negativas."],
    year: 2020,
    studio: "MAPPA",
    genre: "Ação / Sobrenatural",
    episodes: "47",
    synopsis: "Um estudante vira hospedeiro de uma maldição lendária e entra para uma escola de feiticeiros que combatem espíritos.",
    opening: {
      name: "Kaikai Kitan",
      melody: {
        bpm: 128,
        notes: [[63, 0.5], [65, 0.5], [66, 1], [65, 0.5], [63, 0.5], [61, 1], [63, 1.5], [58, 0.5], [61, 1], [63, 1], [66, 1], [68, 2], [66, 1], [65, 1], [63, 1], [61, 3]],
      },
    },
  },
  {
    title: "Cowboy Bebop",
    aliases: ["cowboy bebop"],
    emojis: ["🤠", "🚀", "🎷", "🐶"],
    emojiClues: ["Caçadores de recompensa vagam pelo espaço.", "A trilha sonora é puro jazz."],
    year: 1998,
    studio: "Sunrise",
    genre: "Ficção científica / Neo-noir",
    episodes: "26",
    synopsis: "A bordo da nave Bebop, uma trupe de caçadores de recompensas quebrados persegue criminosos pelo sistema solar.",
    opening: {
      name: "Tank!",
      melody: {
        bpm: 160,
        notes: [[57, 0.5], [57, 0.5], [57, 0.5], [55, 0.5], [57, 1], [60, 0.5], [57, 0.5], [0, 0.5], [57, 0.5], [60, 0.5], [62, 0.5], [63, 1], [62, 0.5], [60, 0.5], [57, 1], [55, 1], [57, 2]],
      },
    },
  },
  {
    title: "Hunter x Hunter",
    aliases: ["hunter x hunter", "hxh", "hunter hunter"],
    emojis: ["🎣", "🃏", "🐜", "💚"],
    emojiClues: ["Um garoto presta um exame mortal para achar o pai.", "Nen é a energia que alimenta as habilidades."],
    year: 2011,
    studio: "Madhouse",
    genre: "Aventura / Ação",
    episodes: "148",
    synopsis: "Gon deixa sua ilha para virar Hunter e encontrar o pai, fazendo amigos e inimigos letais pelo caminho.",
    opening: {
      name: "Departure!",
      melody: {
        bpm: 140,
        notes: [[62, 1], [64, 1], [66, 1.5], [64, 0.5], [62, 1], [59, 1], [62, 2], [64, 1], [66, 1], [69, 1.5], [66, 0.5], [64, 1], [62, 1], [64, 2], [59, 1], [62, 3]],
      },
    },
  },
  {
    title: "Sailor Moon",
    aliases: ["sailor moon", "bishoujo senshi sailor moon"],
    emojis: ["🌙", "👧", "🐱", "💫"],
    emojiClues: ["Uma gata falante entrega o item de transformação.", "Ela luta pelo amor e pela justiça em nome da Lua."],
    year: 1992,
    studio: "Toei Animation",
    genre: "Mahou Shoujo",
    episodes: "200",
    synopsis: "Uma estudante desastrada descobre ser a guerreira da Lua e reúne outras guardiãs para proteger a Terra.",
    opening: {
      name: "Moonlight Densetsu",
      melody: {
        bpm: 120,
        notes: [[62, 1], [67, 1], [70, 1], [74, 1.5], [72, 0.5], [70, 1], [67, 1], [70, 2], [69, 1], [67, 1], [65, 1], [67, 2], [62, 1], [65, 1], [67, 1], [70, 3]],
      },
    },
  },
];
