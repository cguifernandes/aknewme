import { roomsOff } from "@/lib/features";
import { answerInvite, loadRoom } from "@/lib/duels";
import { dailyNumber } from "@/lib/game";
import { fail, json, readJson, requireUser, safe } from "@/lib/session";

// POST /api/duels/:id/join { decline?: true }: entra na sala para a qual foi convidado (ou recusa o convite).
// 404 se não foi convidado, 410 expired, 409 full.

type Ctx = { params: Promise<{ id: string }> };

export const POST = safe(async (req: Request, { params }: Ctx) => {
  const off = roomsOff(); // salas desligadas (13-escopo-lancamento.md)
  if (off) return off;
  const me = await requireUser(req, "duels");
  if (me instanceof Response) return me;
  const room = await loadRoom((await params).id, me.id);
  if (!room) return fail(404, "not_found");
  if (room.day !== dailyNumber()) return fail(410, "expired");
  const body = await readJson(req);
  const status = await answerInvite(room, me.id, body?.decline !== true);
  if (status === "full") return fail(409, "full");
  return json({ status });
});
