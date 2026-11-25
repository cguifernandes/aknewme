import { playDay, type GameMode } from "./game";

// Duelo ("te desafio") sem conta: o link leva o dia, o apelido e os quadradinhos de quem desafiou
// (/duel?m=emoji&day=199&vs=Gui&g=🟩🟨🟥⬛🟩&w=1). Quem recebe aceita, joga o mesmo dia (/emoji?day=…&vs=…)
// e, no fim, vê os dois lado a lado.
// Dá para inventar placar editando o link; como não vale nada, tudo bem.
// O link leva também um código (`id`): quem aceitou manda o placar dele para /api/duel quando termina, e a janela de
// fim de jogo de quem desafiou consulta ali a cada 10 segundos (assim o duelo aparece dos dois lados).

/** `id`: código do desafio (o mesmo para todos que receberem o link daquele modo e dia). */
export type Challenge = { day: number; nick: string; tiles: string[]; won: boolean; id?: string };
export type Outcome = "win" | "lose" | "tie";

const NICK_KEY = "aknewme.nick";
const DUELS_KEY = "aknewme.duels";
/** Quando cada duelo acabou (ms) e as jogadas dos dois lados: { "Gui|k3j9…/emoji:199": { t, me, mw, them, tw } } */
const DUEL_INFO_KEY = "aknewme.duelInfo";
type DuelInfo = { t: number; me?: string[]; mw?: boolean; them?: string[]; tw?: boolean };
/** Código de cada desafio mandado, por modo e dia: { "emoji:199": "k3j9…" } */
const SENT_KEY = "aknewme.sent";
/** Código deste navegador como jogador: separa duas pessoas com o mesmo apelido */
const PLAYER_KEY = "aknewme.player";
/** Desafios cujo placar este navegador já mandou (não manda de novo ao reabrir o resultado) */
const ANSWERED_KEY = "aknewme.answered";
const NICK_MAX = 20;
const TILES = new Set(["🟩", "🟨", "🟥", "⬛", "🟪", "⬜"]);
/** O que /api/duel aceita: código de 10 letras/números e os quadradinhos do resultado. */
export const DUEL_ID = /^[a-z0-9]{10}$/;
export const DUEL_TILES = TILES;

export const isHit = (t: string) => t === "🟩" || t === "🟨";
export const cleanNick = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, NICK_MAX);
/** Iniciais do avatar ("Gui" → "GU"). */
export const initials = (nick: string) => nick.replace(/\s+/g, "").slice(0, 2).toUpperCase();

function read<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? "null") as T) ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const loadNick = () => read<string>(NICK_KEY, "");
export const saveNick = (nick: string) => write(NICK_KEY, nick);

/** Desafio que veio no link, se for do dia em jogo nesta página (link de um dia que ainda não chegou não vale). */
export function readChallenge(): Challenge | null {
  if (typeof location === "undefined") return null;
  const q = new URLSearchParams(location.search);
  const nick = cleanNick(q.get("vs") ?? "");
  const tiles = Array.from(q.get("g") ?? "").filter((t) => TILES.has(t)).slice(0, 10);
  const day = Number(q.get("day"));
  if (!nick || !tiles.length || day !== playDay()) return null;
  const id = q.get("id") ?? "";
  return { day, nick, tiles, won: q.get("w") === "1", ...(DUEL_ID.test(id) && { id }) };
}

/** Parâmetros do desafio na URL (o convite /duel, onde o jogo roda depois de aceitar). */
const challengeQuery = (c: Challenge) =>
  new URLSearchParams({ day: String(c.day), vs: c.nick, g: c.tiles.join(""), w: c.won ? "1" : "0", ...(c.id && { id: c.id }) });

/** 10 letras/números ao acaso (código de desafio e de jogador). */
function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
}

/** Código deste navegador como jogador (cria na 1ª vez). */
export function playerId(): string {
  const saved = read<string>(PLAYER_KEY, "");
  if (DUEL_ID.test(saved)) return saved;
  const id = newId();
  write(PLAYER_KEY, id);
  return id;
}

/** Evento da janela disparado quando um desafio acaba de ser mandado: a janela de fim de jogo começa a perguntar. */
export const DUEL_SENT_EVENT = "aknewme:duel-sent";

/** Código do desafio que este navegador mandou naquele modo e dia (cria na 1ª vez; `create: false` só lê). */
export function sentDuelId(mode: GameMode, day: number, create = true): string | null {
  const all = read<Record<string, string>>(SENT_KEY, {});
  const k = `${mode}:${day}`;
  if (all[k] || !create) return all[k] ?? null;
  all[k] = newId();
  // só os últimos 30 desafios: o resto já expirou no servidor
  write(SENT_KEY, Object.fromEntries(Object.entries(all).slice(-30)));
  return all[k];
}

const SEEN_KEY = "aknewme.duelsSeen";
/** Até quando (ms) o jogador já viu a lista do Meus duelos: o que acabou depois disso é "novo". */
export const duelsSeen = () => read<number>(SEEN_KEY, 0);
export const markDuelsSeen = () => write(SEEN_KEY, Date.now());
/** Já mandou algum desafio neste navegador: o selo "Novo" do botão de desafiar some. */
export const hasSentDuel = () => Object.keys(read<Record<string, string>>(SENT_KEY, {})).length > 0;

/** Desafios que este navegador mandou hoje, por modo (os de outros dias já não abrem: o link vale só no dia). */
export function sentToday(today: number): { mode: GameMode; id: string }[] {
  return Object.entries(read<Record<string, string>>(SENT_KEY, {}))
    .filter(([k]) => Number(k.split(":")[1]) === today)
    .map(([k, id]) => ({ mode: k.split(":")[0] as GameMode, id }));
}

/** Quem recebeu o link abriu o convite ("opened") ou começou a jogar ("playing"): avisa quem desafiou. */
export function sendDuelStatus(c: Challenge, status: "opened" | "playing") {
  if (!c.id) return;
  if (Object.values(read<Record<string, string>>(SENT_KEY, {})).includes(c.id)) return; // o próprio link
  if (read<string[]>(ANSWERED_KEY, []).includes(c.id)) return; // já terminou e mandou o placar
  fetch("/api/duel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: c.id, player: playerId(), nick: loadNick() || "Seu amigo", status }),
    keepalive: true,
  }).catch(() => {});
}

/** Quem aceitou terminou: manda o placar para quem desafiou ver (uma vez por desafio neste navegador). */
export function sendDuelAnswer(c: Challenge, mine: { tiles: string[]; won: boolean }) {
  if (!c.id) return;
  // abriu o próprio link: não responde o próprio desafio
  if (Object.values(read<Record<string, string>>(SENT_KEY, {})).includes(c.id)) return;
  const done = read<string[]>(ANSWERED_KEY, []);
  if (done.includes(c.id)) return;
  write(ANSWERED_KEY, [...done, c.id].slice(-50));
  fetch("/api/duel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: c.id, player: playerId(), nick: loadNick() || "Seu amigo", tiles: mine.tiles, won: mine.won }),
    keepalive: true,
  }).catch(() => {}); // sem rede: quem desafiou só não vê este placar
}

/** Link que se manda para o amigo: abre o convite (/duel), que vira o jogo ao aceitar. */
export function challengeLink(mode: GameMode, c: Challenge): string {
  return `${location.origin}/duel?m=${mode}&${challengeQuery(c)}`;
}

/**
 * Nota para comparar dois resultados do mesmo modo (maior = melhor).
 * Emoji: mais rodadas certas; no empate, mais acertos de primeira (verde). Opening e Pistas: acertar com menos
 * tentativas/pistas; na Opening, acerto com resgate (amarelo) perde para o normal na mesma tentativa.
 */
export function rank(mode: GameMode, tiles: string[], won: boolean): number {
  if (mode === "emoji") return tiles.filter(isHit).length * 10 + tiles.filter((t) => t === "🟩").length;
  if (!won) return 0;
  return 100 - tiles.filter((t) => t !== "⬜").length * 2 - (tiles.includes("🟨") ? 1 : 0);
}

export function outcome(mode: GameMode, mine: { tiles: string[]; won: boolean }, theirs: Challenge): Outcome {
  const d = rank(mode, mine.tiles, mine.won) - rank(mode, theirs.tiles, theirs.won);
  return d > 0 ? "win" : d < 0 ? "lose" : "tie";
}

/** Regra do duelo de cada modo, em uma linha. */
export const DUEL_RULE: Record<GameMode, string> = {
  emoji: "Quem acertar mais rodadas vence. Empate? Ganha quem acertou mais de primeira.",
  opening: "Vence quem acertar ouvindo menos segundos da abertura.",
  pistas: "Vence quem acertar com menos pistas.",
};

// Placar geral contra cada adversário, só neste navegador: { "Gui": { "emoji:199": "win" }, "Gui|k3j9…": {…} }
// A chave é o apelido e, quando se sabe, o código do jogador (dois "Gui" diferentes não se misturam).
// O código é sempre o fim da chave (10 letras/números), então um "|" no apelido não atrapalha.
type Duels = Record<string, Record<string, Outcome>>;
const SEP = "|";

/**
 * Guarda o desfecho de um duelo (um por modo e dia contra cada adversário) e devolve o placar geral contra ele.
 * `mine`: o seu resultado. `t`: quando o duelo acabou (a hora do placar no servidor; sem ela, agora). Só vale a
 * primeira hora: regravar não muda.
 */
export function recordDuel(mode: GameMode, c: Challenge & { player?: string }, result: Outcome, mine: { tiles: string[]; won: boolean }, t = Date.now()) {
  const all = read<Duels>(DUELS_KEY, {});
  const who = c.player ? `${c.nick}${SEP}${c.player}` : c.nick;
  const key = `${mode}:${c.day}`;
  all[who] = { ...all[who], [key]: result };
  write(DUELS_KEY, all);
  const info = read<Record<string, DuelInfo>>(DUEL_INFO_KEY, {});
  const k = `${who}/${key}`;
  info[k] = { t: info[k]?.t ?? t, me: mine.tiles, mw: mine.won, them: c.tiles, tw: c.won };
  // os placares dos duelos de até 60 dias (o Meus duelos mostra os de cada rival); os mais velhos saem
  write(DUEL_INFO_KEY, Object.fromEntries(Object.entries(info).filter(([key]) => Number(key.split(":").pop()) > c.day - 60)));
  const list = Object.values(all[who]);
  return { wins: list.filter((o) => o === "win").length, losses: list.filter((o) => o === "lose").length, total: list.length };
}

export type DuelRecord = { nick: string; mode: GameMode; day: number; outcome: Outcome } & DuelInfo;

/** Todos os duelos guardados, com a chave do adversário (`who`), do mais novo para o mais antigo. */
function allDuels(): (DuelRecord & { who: string })[] {
  const info = read<Record<string, DuelInfo>>(DUEL_INFO_KEY, {});
  return Object.entries(read<Duels>(DUELS_KEY, {}))
    .flatMap(([who, list]) =>
      Object.entries(list).map(([key, outcome]) => ({
        who,
        nick: /\|[a-z0-9]{10}$/.test(who) ? who.slice(0, -11) : who,
        mode: key.split(":")[0] as GameMode,
        day: Number(key.split(":")[1]),
        outcome,
        ...(info[`${who}/${key}`] ?? { t: 0 }),
      })),
    )
    .sort((a, b) => b.day - a.day || b.t - a.t);
}

/**
 * Duelos guardados neste navegador nos últimos `days` dias (hoje incluso), do mais novo para o mais antigo.
 * No mesmo dia, o que acabou por último vem antes (duelos de antes da hora guardada ficam no fim do dia).
 */
export function recentDuels(today: number, days = 7): DuelRecord[] {
  return allDuels().filter((d) => d.day > today - days && d.day <= today);
}

/** `key`: o adversário (apelido + código do jogador, quando se sabe). `duels`: do mais novo para o mais antigo. */
export type Rival = { key: string; nick: string; wins: number; losses: number; ties: number; duels: DuelRecord[] };

/** Placar geral contra cada adversário (todos os duelos guardados): quem você mais vence primeiro. */
export function rivals(): Rival[] {
  const by = new Map<string, Rival>();
  for (const d of allDuels()) {
    const r = by.get(d.who) ?? { key: d.who, nick: d.nick, wins: 0, losses: 0, ties: 0, duels: [] };
    if (d.outcome === "win") r.wins++;
    else if (d.outcome === "lose") r.losses++;
    else r.ties++;
    r.duels.push(d);
    by.set(d.who, r);
  }
  return [...by.values()].sort((a, b) => b.wins - b.losses - (a.wins - a.losses) || b.wins + b.losses - (a.wins + a.losses));
}

/** Teste rápido: npx tsx src/lib/challenge.ts (sem navegador, só as contas). */
if (typeof process !== "undefined" && process.argv[1]?.endsWith("challenge.ts")) {
  const ok = (c: boolean, m: string) => {
    if (!c) throw new Error(m);
  };
  const c = (g: string, won = true): Challenge => ({ day: 1, nick: "Gui", tiles: [...g], won });
  ok(rank("emoji", [..."🟩🟨🟥⬛🟩"], true) === 32, "emoji: 3 acertos, 2 de primeira");
  ok(outcome("emoji", c("🟩🟩🟩🟥🟥"), c("🟩🟨🟨🟥🟥")) === "win", "empate em rodadas: ganha quem acertou mais de primeira");
  ok(outcome("emoji", c("🟩🟩🟥🟥🟥"), c("🟨🟨🟨🟥🟥")) === "lose", "mais rodadas ganha de mais verdes");
  ok(outcome("opening", c("🟥🟩⬜⬜⬜⬜"), c("🟥🟥🟩⬜⬜⬜")) === "win", "menos tentativas ganha");
  ok(outcome("opening", c("🟥🟥🟥🟥🟨⬜"), c("🟥🟥🟥🟥🟩⬜")) === "lose", "resgate perde na mesma tentativa");
  ok(outcome("pistas", c("🟪🟥⬜⬜⬜", false), c("🟪🟪🟪🟪🟥", false)) === "tie", "os dois perderam = empate");
  ok(cleanNick("  Gui   Fer ") === "Gui Fer" && initials("Gui Fer") === "GU", "apelido e iniciais");
  console.log("challenge ok");
}
