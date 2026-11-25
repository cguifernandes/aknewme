import { ANIMES, type Anime, type Opening } from "@/data/animes";
import { levelOf, poolFor, type Level } from "@/lib/difficulty";
import { sendPlayed } from "@/lib/metrics";
import { track } from "@/lib/pixel";

/** Normaliza para comparação: minúsculas, sem acentos, só letras/números. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isCorrectGuess(guess: string, anime: Anime): boolean {
  const g = normalize(guess);
  if (!g) return false;
  return g === normalize(anime.title) || anime.aliases.some((a) => normalize(a) === g);
}

// Título + apelidos normalizados de cada anime (busca e validação de palpite).
const SEARCH = ANIMES.map((a) => ({ title: a.title, keys: [a.title, ...a.aliases].map(normalize) }));

/** Sugestões pelo título ou apelido ("saint seiya" → Cavaleiros do Zodíaco); quem começa com o texto vem antes. */
export function suggestTitles(query: string, max = 6): string[] {
  const q = normalize(query);
  if (!q) return [];
  return SEARCH.filter((s) => s.keys.some((k) => k.includes(q)))
    .map((s) => ({ title: s.title, starts: s.keys.some((k) => k.startsWith(q)) }))
    .sort((a, b) => Number(b.starts) - Number(a.starts) || a.title.localeCompare(b.title, "pt-BR"))
    .slice(0, max)
    .map((s) => s.title);
}

/** Palpite é o título ou apelido de algum anime do banco? (evita gastar tentativa com texto incompleto) */
export function isKnownAnime(guess: string): boolean {
  const g = normalize(guess);
  return !!g && SEARCH.some((s) => s.keys.includes(g));
}

// --- Desafio diário -------------------------------------------------
// Época escolhida para o desafio de hoje bater com o nº do design (#142).
export const EPOCH_UTC = Date.UTC(2026, 4, 10); // 2026-05-10 = desafio #1

export function dailyNumber(): number {
  // No navegador vale a meia-noite de quem joga. No servidor (Vercel roda em UTC), a de Brasília, para bot, prévia
  // e /api/played baterem com o que o jogador do Brasil vê. ponytail: -3h fixo (Brasil sem horário de verão desde 2019).
  const now = typeof window === "undefined" ? new Date(Date.now() - 3 * 3_600_000) : new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.floor((todayUTC - EPOCH_UTC) / 86_400_000) + 1);
}

/** Data de um desafio no formato "24/11". */
export const dayLabel = (day: number) =>
  new Date(EPOCH_UTC + (day - 1) * 86_400_000).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });

/** Opening: segundos da abertura liberados em cada tentativa. */
export const OPENING_STAGES = [1, 2, 4, 7, 11, 16];

/** Dia em jogo: hoje, ou um desafio anterior aberto pelo arquivo (/emoji?day=N). */
export function playDay(): number {
  const today = dailyNumber();
  if (typeof location === "undefined") return today;
  const n = Number(new URLSearchParams(location.search).get("day"));
  return Number.isInteger(n) && n >= 1 && n < today ? n : today;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Aberturas com áudio de um anime (as que podem ser sorteadas). */
const playable = (a: Anime) => a.openings.filter((o) => o.audioSrc);

/** Animes jogáveis no Modo Opening (com pelo menos uma abertura com áudio). */
export const OPENING_ANIMES = ANIMES.filter((a) => playable(a).length > 0);

/** Sorteia qual abertura do anime toca; mesma seed, mesma abertura (desafio do dia igual para todos). */
export function pickOpening(anime: Anime, seed: number): Opening {
  const list = playable(anime);
  return list[Math.floor(mulberry32(seed)() * list.length)];
}

/** Sorteia `count` animes distintos, determinístico para uma mesma seed. */
export function pickAnimes(seed: number, count: number, from: Anime[] = ANIMES): Anime[] {
  const rng = mulberry32(seed);
  const pool = [...from];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/** Emojis da 1ª rodada do Modo Emoji de hoje (mesmo sorteio do EmojiGame): prévia OG e bot do X. */
export function todayEmojis(): string[] {
  return dailyAnimes("emoji", dailyNumber())[0].emojis;
}

/**
 * 1º desafio sorteado por popularidade (11/11/2026 = #186, o último do sorteio antigo). Os dias anteriores
 * seguem com o banco inteiro, para o arquivo, as estatísticas e o /plays não mudarem de anime.
 */
export const POPULAR_FROM = 187;

/** Nível do dia (fácil / normal / difícil); null nos dias do sorteio antigo. */
export function dayLevel(day: number): Level | null {
  return day < POPULAR_FROM ? null : levelOf(new Date(EPOCH_UTC + (day - 1) * 86_400_000).getUTCDay());
}

// --- Resultado diário por modo: um jogo a cada 24h -------------------
export type GameMode = "emoji" | "opening" | "pistas";
export const MODE_LABEL: Record<GameMode, string> = { emoji: "Emoji", opening: "Opening", pistas: "Pistas" };
export const MODE_PATH: Record<GameMode, string> = { emoji: "/emoji", opening: "/opening", pistas: "/clues" };
/** Animes do desafio de um dia em cada modo (Emoji: 5 rodadas; os outros: 1). Mesmo sorteio para todo mundo. */
export function dailyAnimes(mode: GameMode, day: number): Anime[] {
  const level = dayLevel(day);
  const from = (list: Anime[]) => (level ? poolFor(level, list) : list);
  if (mode === "emoji") return pickAnimes(day, 5, from(ANIMES));
  if (mode === "opening") return pickAnimes(day * 7 + 3, 1, from(OPENING_ANIMES));
  return pickAnimes(day * 13 + 5, 1, from(ANIMES));
}

/** Pistas de um anime, na ordem em que o Modo Pistas abre. */
export function animeClues(a: Anime): { label: string; value: string }[] {
  return [
    { label: "Ano de estreia", value: String(a.year) },
    { label: "Estúdio", value: a.studio },
    { label: "Gênero", value: a.genre },
    { label: "Episódios", value: a.episodes },
    { label: "Sinopse", value: a.synopsis },
  ];
}

const BY_TITLE = new Map(ANIMES.map((a) => [a.title, a]));

/**
 * Animes que ilustram um resultado (imagens: só depois da resposta!): o da resposta salva; sem ela
 * (Emoji ganho, que são 5 rodadas), todos os do dia.
 */
export function resultAnimes(mode: GameMode, day: number, answer?: string): Anime[] {
  const a = answer ? BY_TITLE.get(answer) : undefined;
  return a ? [a] : dailyAnimes(mode, day);
}

const MODE_ICON: Record<GameMode, string> = { emoji: "🎭", opening: "🎵", pistas: "🔎" };

/** Texto de compartilhar (sem spoiler). O link entra na hora de compartilhar, depois do "👉". */
export function shareText(mode: GameMode, won: boolean, line: string, grid: string): string {
  return [
    `${MODE_ICON[mode]} aknewme #${playDay()} · Modo ${MODE_LABEL[mode]}`,
    line,
    "",
    grid,
    "",
    won ? "Consegue fazer melhor?" : "Será que você acerta?",
  ].join("\n");
}

export type DailyResult = {
  day: number;
  won: boolean;
  answer?: string;
  detail?: string;
  /** Texto para compartilhar (sem spoiler), sem o link */
  share?: string;
  /** Só os quadradinhos, para a prévia no fim de jogo */
  grid?: string;
  /** Emoji: pontos · Opening: tentativa do acerto · Pistas: pontos · null = perdeu */
  score?: number | null;
  /** Opening: o palpite de cada tentativa, na ordem ("" = pulou), para o resumo do fim de jogo */
  tries?: string[];
};

/** Resultados dos desafios anteriores jogados pelo arquivo, por dia. */
function loadArchive(mode: GameMode): Record<number, DailyResult> {
  try {
    return JSON.parse(localStorage.getItem(`aknewme.archive.${mode}`) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

/** Dias já jogados no modo (no dia ou pelo arquivo) → acertou? */
export function playedDays(mode: GameMode): Record<number, boolean> {
  const days: Record<number, boolean> = {};
  for (const e of loadHistory(mode)) days[e.day] = e.won;
  for (const r of Object.values(loadArchive(mode))) if (typeof r?.day === "number") days[r.day] = !!r.won;
  return days;
}

/** Resultado do dia em jogo (hoje, ou o dia do arquivo), ou null se o modo ainda não foi jogado. */
export function getDailyResult(mode: GameMode): DailyResult | null {
  const day = playDay();
  try {
    if (day !== dailyNumber()) return loadArchive(mode)[day] ?? null;
    const raw = localStorage.getItem(`aknewme.result.${mode}`);
    if (!raw) return null;
    const r = JSON.parse(raw) as DailyResult;
    return r.day === day ? r : null;
  } catch {
    return null;
  }
}

/** Conta a visita do dia, uma vez por navegador (api/played separa celular × PC pelo User-Agent). */
export function trackVisit() {
  if (location.pathname.startsWith("/plays")) return; // o painel não é visita de jogador
  const day = dailyNumber();
  try {
    if (localStorage.getItem("aknewme.visit") === String(day)) return;
    localStorage.setItem("aknewme.visit", String(day));
  } catch {}
  sendPlayed({ visit: true, day });
}

/** Conta quem começou o desafio de hoje (1ª ação no modo), uma vez por dia por navegador: mostra quem entra e desiste. */
export function trackStart(mode: GameMode) {
  const day = playDay();
  if (day !== dailyNumber()) return; // arquivo não conta
  try {
    const key = `aknewme.start.${mode}`;
    if (localStorage.getItem(key) === String(day)) return;
    localStorage.setItem(key, String(day));
  } catch {}
  sendPlayed({ mode, day, start: true });
  track("JogoIniciado", { modo: mode });
}

// --- Partida em andamento: sair e voltar continua de onde parou (e recarregar não devolve vidas/tentativas) ---
// ponytail: uma chave por modo; começar um dia do arquivo descarta o andamento de hoje (e vice-versa).
const progressKey = (mode: GameMode) => `aknewme.progress.${mode}`;

/** Estado salvo da partida do dia em jogo, ou null (outro dia, nada salvo ou localStorage indisponível). */
export function loadProgress<T>(mode: GameMode): T | null {
  try {
    const p = JSON.parse(localStorage.getItem(progressKey(mode)) ?? "null");
    return p?.day === playDay() ? (p.state as T) : null;
  } catch {
    return null;
  }
}

export function saveProgress(mode: GameMode, state: unknown) {
  try {
    localStorage.setItem(progressKey(mode), JSON.stringify({ day: playDay(), state }));
  } catch {}
}

/** Anime do banco pelo título exato (para restaurar chutes salvos). */
export function animeByTitle(title: string): Anime | undefined {
  return BY_TITLE.get(title);
}

export function saveDailyResult(mode: GameMode, r: Omit<DailyResult, "day">): DailyResult {
  const full = { day: playDay(), ...r };
  try {
    localStorage.removeItem(progressKey(mode)); // terminou: o resultado salvo assume daqui
  } catch {}
  // Arquivo: guarda só o resultado; não entra em estatísticas, sequência nem no contador de jogadores.
  if (full.day !== dailyNumber()) {
    try {
      localStorage.setItem(`aknewme.archive.${mode}`, JSON.stringify({ ...loadArchive(mode), [full.day]: full }));
    } catch {}
    return full;
  }
  // Contador de jogadores (api/played). first = primeiro modo que este navegador termina hoje (conta pessoas).
  const first = !(Object.keys(MODE_LABEL) as GameMode[]).some((m) => getDailyResult(m));
  sendPlayed({ mode, day: full.day, won: r.won, first, score: r.score ?? null });
  track("JogoConcluido", { modo: mode, venceu: r.won, pontos: r.score ?? null });
  try {
    localStorage.setItem(`aknewme.result.${mode}`, JSON.stringify(full));
  } catch {}
  addHistory(mode, { day: full.day, won: full.won, score: full.score ?? null });
  return full;
}

// --- Histórico por modo (base das estatísticas) ----------------------
export type HistoryEntry = { day: number; won: boolean; score: number | null };

const isEntry = (e: unknown): e is HistoryEntry =>
  typeof e === "object" && e !== null &&
  typeof (e as HistoryEntry).day === "number" &&
  typeof (e as HistoryEntry).won === "boolean" &&
  ((e as HistoryEntry).score === null || typeof (e as HistoryEntry).score === "number");

/** Histórico do modo; entradas malformadas (localStorage editado à mão) são descartadas. */
export function loadHistory(mode: GameMode): HistoryEntry[] {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(`aknewme.history.${mode}`) ?? "[]");
    return Array.isArray(list) ? list.filter(isEntry) : [];
  } catch {
    return [];
  }
}

function addHistory(mode: GameMode, entry: HistoryEntry) {
  try {
    const list = loadHistory(mode).filter((e) => e.day !== entry.day);
    localStorage.setItem(`aknewme.history.${mode}`, JSON.stringify([...list, entry]));
  } catch {}
}

// --- Sequência de dias (streak), em localStorage ---------------------
const STREAK_KEY = "aknewme.streak";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getStreak(): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    const { last, count } = JSON.parse(raw) as { last: string; count: number };
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    if (last === todayStr() || last === yesterday) return count;
    return 0;
  } catch {
    return 0;
  }
}

/** Registra que o jogador completou um jogo hoje; devolve a streak atual. */
export function recordPlay(): number {
  if (playDay() !== dailyNumber()) return getStreak(); // desafio do arquivo não conta na sequência
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    let count = 1;
    if (raw) {
      const prev = JSON.parse(raw) as { last: string; count: number };
      if (prev.last === todayStr()) count = prev.count;
      else if (prev.last === yesterday) count = prev.count + 1;
    }
    localStorage.setItem(STREAK_KEY, JSON.stringify({ last: todayStr(), count }));
    return count;
  } catch {
    return 0;
  }
}
