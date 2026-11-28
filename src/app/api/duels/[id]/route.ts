import { roomsOff } from "@/lib/features";
import { loadRoom, roomView } from "@/lib/duels";
import { dailyNumber } from "@/lib/game";
import { fail, json, requireUser, safe } from "@/lib/session";

// GET /api/duels/:id: a sala (quem entrou, quem terminou), só para quem está nela. Placar dos outros só depois que
// você terminou. 404 para quem não está na sala; 410 expired depois que o desafio do dia passou (R14).

type Ctx = { params: Promise<{ id: string }> };

export const GET = safe(async (req: Request, { params }: Ctx) => {
  const off = roomsOff(); // salas desligadas (13-escopo-lancamento.md)
  if (off) return off;
  const me = await requireUser(req);
  if (me instanceof Response) return me;
  const room = await loadRoom((await params).id, me.id);
  if (!room) return fail(404, "not_found");
  if (room.day !== dailyNumber()) return fail(410, "expired");
  return json(roomView(room, me.id));
});
