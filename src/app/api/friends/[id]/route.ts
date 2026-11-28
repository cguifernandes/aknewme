import { acceptFriend, declineFriend, removeFriend } from "@/lib/friends";
import { fail, noContent, readJson, requireUser, safe } from "@/lib/session";
import { UUID_RE } from "@/lib/users";

// PATCH /api/friends/:id { action: "accept" | "decline" }: responde ao pedido que :id mandou (só quem recebeu).
// DELETE /api/friends/:id: remove a amizade ou cancela o pedido, dos dois lados, na hora.

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = safe(async (req: Request, { params }: Ctx) => {
  const me = await requireUser(req, "friends");
  if (me instanceof Response) return me;
  const { id } = await params;
  if (!UUID_RE.test(id)) return fail(404, "not_found");
  const action = (await readJson(req))?.action;
  if (action !== "accept" && action !== "decline") return fail(400, "invalid");
  const ok = action === "accept" ? await acceptFriend(me.id, id) : await declineFriend(me.id, id);
  return ok ? noContent() : fail(404, "not_found");
});

export const DELETE = safe(async (req: Request, { params }: Ctx) => {
  const me = await requireUser(req, "friends");
  if (me instanceof Response) return me;
  const { id } = await params;
  if (!UUID_RE.test(id)) return fail(404, "not_found");
  await removeFriend(me.id, id);
  return noContent();
});
