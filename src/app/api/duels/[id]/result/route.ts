import { roomsOff } from "@/lib/features";
import { answerInvite, loadRoom, recordWins, saveResult } from "@/lib/duels";
import { dailyNumber } from "@/lib/game";
import { parseMoves, replay, sameResult } from "@/lib/replay";
import { fail, json, readJson, requireUser, safe } from "@/lib/session";

// POST /api/duels/:id/result { moves, claimed: { won, score } }: placar de quem está na sala (R12, CA5).
// O servidor refaz a partida com as jogadas e o desafio do dia da sala (src/lib/replay.ts). O resultado do
// navegador (claimed) não é gravado: se não bater com o recálculo, 409 mismatch e nada é gravado.
// Erros: 400 invalid_moves, 404, 410 expired, 409 already_played (R13) | mismatch | full.

type Ctx = { params: Promise<{ id: string }> };

export const POST = safe(async (req: Request, { params }: Ctx) => {
  const off = roomsOff(); // salas desligadas (13-escopo-lancamento.md)
  if (off) return off;
  const me = await requireUser(req, "result");
  if (me instanceof Response) return me;
  const room = await loadRoom((await params).id, me.id);
  if (!room) return fail(404, "not_found");
  if (room.day !== dailyNumber()) return fail(410, "expired");
  if (room.players.find((p) => p.id === me.id)!.status === "finished") return fail(409, "already_played");
  const body = await readJson(req);
  const moves = parseMoves(room.mode, body?.moves);
  const result = moves && replay(room.mode, room.day, moves);
  if (!moves || !result) return fail(400, "invalid_moves");
  const claimed = body?.claimed as { won?: unknown; score?: unknown } | undefined;
  if (!claimed || typeof claimed !== "object" || !sameResult(result, { won: claimed.won, score: claimed.score })) return fail(409, "mismatch");
  // Convidado que jogou direto, sem tocar em "entrar": entra agora (se ainda houver lugar)
  if ((await answerInvite(room, me.id, true)) === "full") return fail(409, "full");
  if (!(await saveResult(room.id, me.id, moves, result))) return fail(409, "already_played");
  // placar entre amigos (tela /friends) e aviso para quem já terminou: se falhar, o resultado da sala já está salvo
  await recordWins(room.id, room.mode, me.id, room.day).catch((e) => console.error("[duel_wins]", (e as { code?: string })?.code ?? (e as Error)?.name));
  return json({ result });
});
