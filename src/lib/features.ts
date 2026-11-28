// Chaves de recursos (specs/login-duelo/13-escopo-lancamento.md).

/**
 * Salas de duelo (/room/*, /api/duels/*, "Salas de hoje", "Voltar para a sala", convites e "terminou a sala").
 * Desligadas no lançamento: o código e as tabelas ficam, e voltar é trocar para true.
 */
export const ROOMS_ENABLED = false;

/** Nas rotas da API das salas: com elas desligadas, responde 404 (como se a rota não existisse). */
export function roomsOff(): Response | null {
  return ROOMS_ENABLED ? null : new Response(null, { status: 404 });
}

/**
 * Temas do Mais ou Menos ("Todos os animes", "Anos 2010", "Ação"): o seletor sai da tela (specs/mais-ou-menos/01). Com a
 * chave desligada o jogo usa sempre "Todos os animes" e o recorde dele; o código dos temas e os recordes por tema ficam.
 */
export const THEMES_ENABLED = false;

/** Tipos de notificação que só existem com as salas */
export const ROOM_NOTIFICATIONS = ["room_invite", "room_finished"];
