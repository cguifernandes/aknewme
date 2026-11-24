import { ANIMES, type Anime } from "@/data/animes";
import { dailyAnimes, pickAnimes, type GameMode } from "@/lib/game";
import { SITE_URL } from "@/lib/site";

export const SLOTS = ["manha", "tarde", "noite"] as const;
export type Slot = (typeof SLOTS)[number];

/** `keep`: trechos que o texto final precisa trazer iguais (emojis do enigma); `answer`: o que ele não pode revelar. */
/** `image`: link da imagem anexada ao post (post com imagem alcança mais gente que só texto). */
export type XPost = { slot: Slot; when: string; kind: string; text: string; answer?: string; keep?: string[]; image?: string };

/** Link da resposta do 3º post: /emoji tem prévia com os emojis de hoje (opengraph-image). */
// `?d=N`: link novo a cada dia, para o X não reaproveitar a prévia guardada de outro desafio (a página ignora o d).
export const replyText = (day: number) =>
  `Joga as 5 rodadas de hoje, a opening e as pistas aqui 👇\n${SITE_URL.replace(/^https?:\/\//, "")}/emoji?d=${day}`;

const song = (a: Anime) => `"${a.openings[0].name}" (${a.openings[0].artist})`;

/** Manhã: adivinhar (resposta no dia seguinte). */
const GUESS: { kind: string; text: (a: Anime) => string }[] = [
  { kind: "Emoji", text: (a) => `🎭 Que anime é esse?\n\n${a.emojis.join("")}\n\nSó vale responder sem pesquisar 👀` },
  {
    kind: "Pistas",
    text: (a) => `🧩 Qual é o anime?\n\n“${a.emojiClues[0]}”\n“${a.emojiClues[1]}”\n\nQuem acertar de primeira é otaku raiz 👇`,
  },
  {
    kind: "Ficha",
    text: (a) => `🔎 Adivinha o anime pela ficha:\n\n📅 ${a.year}\n🎬 ${a.studio}\n🏷️ ${a.genre}\n📺 ${a.episodes} episódios\n\nDuvido acertar 👇`,
  },
  { kind: "Opening", text: (a) => `🎵 ${song(a)}\n\nDe qual anime é essa abertura? Se tocou na sua cabeça, responde 👇` },
];

/** Tarde: opinião, para render discussão (sem resposta certa). */
const DEBATE: { kind: string; text: (a: Anime, b: Anime) => string }[] = [
  { kind: "Versus", text: (a, b) => `⚔️ ${a.title} ou ${b.title}?\n\nSó pode escolher um. Responde com o seu 👇` },
  {
    kind: "Nota",
    text: (a) => `📊 ${a.title} tem nota ${a.mal?.score.toFixed(2).replace(".", ",")} no MyAnimeList.\n\nSuperestimado, justo ou merecia mais? 👇`,
  },
  { kind: "Abertura", text: (a) => `🎤 Abertura de ${a.title}: ${song(a)}\n\nNota de 0 a 10? 👇` },
  {
    kind: "Indicação",
    text: (a) => `🍿 Quem nunca viu anime deveria começar por ${a.title}?\n\nSim ou não? Se não, qual você indicaria? 👇`,
  },
  { kind: "Nostalgia", text: (a) => `📅 ${a.title} estreou em ${a.year}.\n\nVocê viu na época ou chegou atrasado? 👇` },
];

/** Noite: a 1ª rodada do desafio (muda todo dia), com a frase em rodízio. */
const NIGHT = [
  (n: number, e: string) => `🎮 Desafio #${n} do aknewme\n\n${e}\n\nAcertou esse? Ainda tem mais 4 rodadas, a opening e as pistas 👇`,
  (n: number, e: string) => `🎭 Desafio #${n}: que anime é esse?\n\n${e}\n\nResponde aqui e depois testa o resto do desafio 👇`,
  (n: number, e: string) => `${e}\n\nAcertou esse de primeira? O desafio #${n} completo tá na resposta 👇`,
  (n: number, e: string) => `🧠 Pouca gente acerta todas do desafio #${n}.\n\nA primeira é essa: ${e}\n\nBora? 👇`,
];

/** 1º dia dos posts: as filas abaixo começam aqui (mudar isso muda todos os posts já feitos). */
const START = 188;

// Ordem fixa do banco inteiro: cada anime sai uma vez por volta (~106 dias) e, a cada volta, num formato diferente.
// ponytail: anime novo no banco reembaralha a ordem; se isso repetir algo recente, fixar a lista.
const POOL = pickAnimes(20261113, Infinity, ANIMES);
const POS = new Map(POOL.map((a, i) => [a.title, i]));

type Pick = { anime: Anime; lap: number };

const inGameOn = (day: number) =>
  new Set((["emoji", "opening", "pistas"] as GameMode[]).flatMap((m) => dailyAnimes(m, day).map((a) => a.title)));

/**
 * Anime de cada dia em duas filas (manhã e tarde, meia volta de distância): anime que está no desafio do dia
 * (spoiler) fica esperando o próximo dia, então nenhum é pulado nem sai duas vezes na mesma volta.
 * Refaz as filas desde START a cada chamada: são poucos dias, e o resultado não depende de nada gravado.
 */
function picks(day: number): [Pick, Pick] {
  const n = POOL.length;
  const queues = [0, Math.floor(n / 2)].map((offset) => ({ offset, next: 0, waiting: [] as Pick[] }));
  let today: [Pick, Pick] = [{ anime: POOL[0], lap: 0 }, { anime: POOL[1], lap: 0 }];
  for (let d = Math.min(START, day); d <= day; d++) {
    const inGame = inGameOn(d);
    today = queues.map((q) => {
      const w = q.waiting.findIndex((p) => !inGame.has(p.anime.title));
      if (w >= 0) return q.waiting.splice(w, 1)[0];
      for (;;) {
        const p = { anime: POOL[(q.next + q.offset) % n], lap: Math.floor(q.next / n) };
        q.next++;
        if (!inGame.has(p.anime.title)) return p;
        q.waiting.push(p);
      }
    }) as [Pick, Pick];
  }
  return today;
}

/** Formato da vez: anda uma casa a cada volta, e animes vizinhos na fila já começam em formatos diferentes. */
const format = <T,>(list: T[], p: Pick) => list[(p.lap + POS.get(p.anime.title)!) % list.length];

/**
 * Os 3 posts do dia: manhã (adivinhar) e tarde (opinião) sem link; noite com a 1ª rodada do desafio e o link na
 * resposta. Sem repetir post: manhã 4 formatos × 106 animes (424 dias), tarde 5 × 106 (530 dias).
 */
export function dailyPosts(day: number): XPost[] {
  const [a, b] = picks(day);
  const guess = format(GUESS, a);
  const debate = format(DEBATE, b);
  // par do Versus: um quarto de volta adiante na ordem (longe dos dois), fora do desafio de hoje
  const inGame = inGameOn(day);
  const n = POOL.length;
  const from = POS.get(b.anime.title)! + Math.floor(n / 4);
  const rival = POOL.map((_, k) => POOL[(from + k) % n]).find((x) => !inGame.has(x.title) && x !== a.anime && x !== b.anime)!;
  const emojis = dailyAnimes("emoji", day)[0].emojis.join("");
  return [
    {
      slot: "manha",
      when: "Manhã",
      kind: guess.kind,
      text: guess.text(a.anime),
      answer: a.anime.title,
      keep: guess.kind === "Emoji" ? [a.anime.emojis.join("")] : undefined,
    },
    // manhã sem imagem: a do anime entregaria a resposta
    { slot: "tarde", when: "Tarde", kind: debate.kind, text: debate.text(b.anime, rival), image: b.anime.mal?.image },
    {
      slot: "noite",
      when: "Noite",
      kind: "Desafio",
      text: NIGHT[day % NIGHT.length](day, emojis),
      keep: [emojis, `#${day}`],
      image: `${SITE_URL}/emoji/opengraph-image?d=${day}`, // os emojis da 1ª rodada de hoje
    },
  ];
}
