// Textos do duelo entre amigos, num lugar só (specs/login-duelo/15-desafio-por-notificacao.md). O Produto ainda pode
// trocar as palavras: mude aqui. O fim de jogo e o "Chamar pro duelo" (duelo por link) continuam com "Desafiar".

/** Verbo dos botões do duelo por link ("Desafiar no Emoji", fim de jogo): ficam como estavam */
export const CHALLENGE_VERB = "Desafiar";

export const DUEL_TEXT = {
  /** botão na linha do amigo (/friends) */
  listButton: "Duelar",
  dialogTitle: (name: string) => `Duelar com ${name}`,
  dialogHint: (name: string) => `Escolha o modo de hoje. ${name} recebe o duelo com o seu resultado e joga o mesmo.`,
  /** botão do modo jogado na janela: manda a notificação */
  send: "Enviar duelo",
  /** depois de enviar, com o tempo que falta para o convite expirar ("Duelo enviado · 1:59") */
  sent: "Duelo enviado",
  /** o amigo abriu pelo "Jogar" no prazo: não dá para mandar de novo naquele modo no dia */
  accepted: "Duelo aceito",
  /** o mesmo, com o nome, quando o aceite chega com a janela aberta (e ao reabrir) */
  acceptedBy: (name: string) => `${name} aceitou`,
  /** no botão: curto, cabe numa linha */
  acceptedShort: "Aceitou",
  /** o amigo já terminou aquele modo: abre a janela Duelos no rival */
  seeScoreMode: "Ver placar",
  /** cartão no topo de /friends com os convites (uma linha por pessoa) e as respostas */
  noticesTitle: "Desafios",
  /** linha de quem desafiou: um modo ("no Emoji #202") ou vários ("em 2 modos") */
  challengedOne: (who: string, mode: string, day: number) => `${who} te desafiou no ${mode} #${day}`,
  challengedMany: (who: string, n: number) => `${who} te desafiou em ${n} modos`,
  /** embaixo do nome, com o prazo do convite que vence primeiro */
  challengedHint: (left: string) => `o placar aparece depois que você jogar · expira em ${left}`,
  /** botão lime de cada modo no cartão ("Jogar Opening #202") */
  playMode: (mode: string, day: number) => `Jogar ${mode} #${day}`,
  invited: (who: string, mode: string, day: number) => `${who} quer duelar com você no ${mode} #${day}.`,
  answered: (who: string, mode: string) => `${who} respondeu seu duelo no ${mode}. Veja o placar.`,
  play: "Jogar",
  /** quem recebe já tem o resultado daquele modo no aparelho: vai direto à comparação */
  alreadyPlayed: "Você já jogou: veja o duelo",
  seeDuel: "Ver duelo",
  seeDuelMode: (mode: string, day: number) => `Ver duelo ${mode} #${day}`,
  /** partida antiga, sem as jogadas guardadas: o duelo não vai para a conta */
  unverified: "Este resultado não pôde ser conferido e fica só neste aparelho.",
  seeScore: "Ver placar",
  /** na tela do duelo, aberta depois do prazo */
  expired: (who: string) => `Esse convite de duelo expirou. Peça para ${who} mandar de novo.`,
} as const;

/** "1:59" a partir dos segundos que faltam */
export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
