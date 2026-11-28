import { roomsOff } from "@/lib/features";
import { createRoom, MODES, myRooms, ROOM_MAX } from "@/lib/duels";
import { dailyNumber, type GameMode } from "@/lib/game";
import { fail, json, readJson, requireUser, safe } from "@/lib/session";
import { UUID_RE } from "@/lib/users";

// GET /api/duels → { rooms }: as salas de hoje em que você está, convites incluídos (a tela de amigos mostra os convites).
// POST /api/duels { mode, invite: [ids] }: cria a sala do desafio de hoje com 1 a 3 amigos aceitos (4 com o dono).
// Erros: 400 invalid, 403 not_friends (convidou quem não é amigo aceito), 409 no_handle.

export const GET = safe(async (req: Request) => {
  const off = roomsOff(); // salas desligadas (13-escopo-lancamento.md)
  if (off) return off;
  const me = await requireUser(req);
  if (me instanceof Response) return me;
  return json({ rooms: await myRooms(me.id, dailyNumber()) });
});

export const POST = safe(async (req: Request) => {
  const off = roomsOff(); // salas desligadas (13-escopo-lancamento.md)
  if (off) return off;
  const me = await requireUser(req, "duels");
  if (me instanceof Response) return me;
  if (!me.handle) return fail(409, "no_handle");
  const body = await readJson(req);
  const mode = body?.mode as GameMode;
  const invite = Array.isArray(body?.invite) ? [...new Set(body.invite)] : [];
  if (
    !MODES.includes(mode) ||
    !invite.length ||
    invite.length > ROOM_MAX - 1 ||
    !invite.every((id): id is string => typeof id === "string" && UUID_RE.test(id) && id !== me.id)
  )
    return fail(400, "invalid");
  const out = await createRoom(me.id, mode, dailyNumber(), invite);
  if (out === "not_friends") return fail(403, "not_friends");
  return json({ id: out }, 201);
});
