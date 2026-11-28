import type { Anime } from "@/data/animes";
import { CATALOG_V2_FROM, CATALOGS, type Catalogs } from "@/lib/catalog";
import { dailyAnimes, pickAnimes, type GameMode } from "@/lib/game";
import { SITE_URL } from "@/lib/site";

export const SLOTS = ["manha", "tarde", "noite"] as const;
export type Slot = (typeof SLOTS)[number];

/** `keep`: trechos que o texto final precisa trazer iguais (emojis do enigma); `answer`: o que ele não pode revelar. */
/** `image`: link da imagem anexada ao post (post com imagem alcança mais gente que só texto). */
export type XPost = { slot: Slot; when: string; kind: string; text: string; answer?: string; keep?: string[]; image?: string };

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

/** Noite: a 1ª rodada do desafio (muda todo dia), com a frase em rodízio. Sem link: o post não traz URL (custa mais na API). */
const NIGHT = [
  (n: number, e: string) => `🎮 Desafio #${n} do aknewme\n\n${e}\n\nAcertou esse? Ainda tem mais 4 rodadas, a opening e as pistas no site do aknewme.`,
  (n: number, e: string) => `🎭 Desafio #${n}: que anime é esse?\n\n${e}\n\nResponde aqui e depois testa o resto do desafio no site do aknewme.`,
  (n: number, e: string) => `${e}\n\nAcertou esse de primeira? O desafio #${n} completo tá no site do aknewme.`,
  (n: number, e: string) => `🧠 Pouca gente acerta todas do desafio #${n}.\n\nA primeira é essa: ${e}\n\nBora? Joga o resto no site do aknewme.`,
];

/** 1º dia dos posts: as filas abaixo começam aqui (mudar isso muda todos os posts já feitos). */
const START = 188;
/** Ordem em que os animes novos entram nas filas no dia de corte. */
const V2_SEED = 20261126;

type Queue = { pool: Anime[]; offset: number; next: number; waiting: Anime[] };
/** As duas filas (manhã e tarde) num dia: a ordem em uso, a casa de cada anime no rodízio de formatos e as voltas. */
type State = { pool: Anime[]; base: Map<Anime, number>; queues: Queue[]; laps: Map<Anime, number>[] };
type Pick = { anime: Anime; lap: number };

const inGameOn = (day: number, cats?: Catalogs) =>
  new Set((["emoji", "opening", "pistas"] as GameMode[]).flatMap((m) => dailyAnimes(m, day, cats).map((a) => a.title)));

/** Próximo da fila. Anime que está no desafio do dia (spoiler) espera o próximo dia, então nenhum é pulado. */
function take(q: Queue, inGame: Set<string>): Anime {
  const w = q.waiting.findIndex((a) => !inGame.has(a.title));
  if (w >= 0) return q.waiting.splice(w, 1)[0];
  for (;;) {
    const a = q.pool[(q.next + q.offset) % q.pool.length];
    q.next++;
    if (!inGame.has(a.title)) return a;
    q.waiting.push(a);
  }
}

/**
 * Dia de corte (CATALOG_V2_FROM): os animes novos entram na frente das filas (metade na manhã, metade na tarde) e
 * depois cada fila segue de onde parou. O que já saiu só volta depois de uma volta inteira (a distância só aumenta),
 * e anime novo nunca saiu. Sem anime novo, a ordem continua exatamente a mesma.
 */
function addNew(s: State, fresh: Anime[]): void {
  const [a, b] = s.queues;
  const n = s.pool.length;
  const pa = (a.next + a.offset) % n;
  const gap = ((b.next + b.offset - pa) % n + n) % n;
  const turn = [...s.pool.slice(pa), ...s.pool.slice(0, pa)]; // começa no próximo da manhã
  const order = pickAnimes(V2_SEED, Infinity, fresh);
  const toA = order.filter((_, i) => i % 2 === 0);
  const toB = order.filter((_, i) => i % 2 === 1);
  for (const x of order) s.base.set(x, s.base.size);
  s.pool = [...toA, ...turn.slice(0, gap), ...toB, ...turn.slice(gap)];
  s.queues = [
    { pool: s.pool, offset: 0, next: 0, waiting: a.waiting },
    { pool: s.pool, offset: toA.length + gap, next: 0, waiting: b.waiting },
  ];
}

/**
 * Anime de cada dia em duas filas (manhã e tarde, meia volta de distância): cada anime sai uma vez por volta e, a
 * cada volta, num formato diferente. Refaz as filas desde START a cada chamada: são poucos dias, e o resultado não
 * depende de nada gravado.
 */
function plan(day: number, cats: Catalogs): { picks: Pick[]; state: State } {
  // ordem fixa do catálogo congelado: é a fila de sempre, então nada muda antes do corte
  const pool = pickAnimes(20261113, Infinity, cats.v1.animes);
  const queue = (offset: number): Queue => ({ pool, offset, next: 0, waiting: [] });
  const s: State = { pool, base: new Map(pool.map((a, i) => [a, i])), queues: [queue(0), queue(Math.floor(pool.length / 2))], laps: [new Map(), new Map()] };
  let picks: Pick[] = [];
  for (let d = Math.min(START, day); d <= day; d++) {
    if (d === Math.max(CATALOG_V2_FROM, Math.min(START, day))) {
      const old = new Set(cats.v1.animes);
      addNew(s, cats.v2.animes.filter((a) => !old.has(a)));
    }
    const inGame = inGameOn(d, cats);
    picks = s.queues.map((q, i) => {
      const anime = take(q, inGame);
      const lap = s.laps[i].get(anime) ?? 0; // vezes que já saiu nesta fila
      s.laps[i].set(anime, lap + 1);
      return { anime, lap };
    });
  }
  return { picks, state: s };
}

/** Animes de manhã e de tarde no dia (o teste confere que nada se repete em 30 dias). */
export const dailyPicks = (day: number, cats: Catalogs = CATALOGS): string[] => plan(day, cats).picks.map((p) => p.anime.title);

/** Formato da vez: anda uma casa a cada volta, e animes vizinhos na fila já começam em formatos diferentes. */
const format = <T,>(list: T[], p: Pick, s: State) => list[(p.lap + s.base.get(p.anime)!) % list.length];

/**
 * Os 3 posts do dia, todos sem link: manhã (adivinhar), tarde (opinião) e noite (1ª rodada do desafio, com imagem).
 * Sem repetir post: cada anime passa pelos 4 formatos da manhã e pelos 5 da tarde, um por volta.
 * `cats`: só para o teste (scripts/check-catalog.mjs) trocar o banco.
 */
export function dailyPosts(day: number, cats: Catalogs = CATALOGS): XPost[] {
  const {
    picks: [a, b],
    state,
  } = plan(day, cats);
  const guess = format(GUESS, a, state);
  const debate = format(DEBATE, b, state);
  // par do Versus: um quarto de volta adiante na ordem (longe dos dois), fora do desafio de hoje
  const inGame = inGameOn(day, cats);
  const pool = state.pool;
  const n = pool.length;
  const from = pool.indexOf(b.anime) + Math.floor(n / 4);
  const rival = pool.map((_, k) => pool[(from + k) % n]).find((x) => !inGame.has(x.title) && x !== a.anime && x !== b.anime)!;
  const emojis = dailyAnimes("emoji", day, cats)[0].emojis.join("");
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
