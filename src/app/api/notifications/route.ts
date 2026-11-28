import { listNotifications, markRead } from "@/lib/notifications";
import { fail, json, noContent, readJson, requireUser, safe } from "@/lib/session";

// GET /api/notifications → { unread, items }: as últimas 20 notificações de quem está logado e quantas não foram lidas
// (specs/login-duelo/11-notificacoes.md). O site consulta ao abrir e a cada 60 s com a aba visível.
// POST /api/notifications { read: "all" | "<id>" }: marca como lida(s). Só as próprias.

export const GET = safe(async (req: Request) => {
  const me = await requireUser(req, "notifications");
  if (me instanceof Response) return me;
  return json(await listNotifications(me.id)); // inclui now (o relógio do banco, para o prazo dos convites)
});

export const POST = safe(async (req: Request) => {
  const me = await requireUser(req, "notifications");
  if (me instanceof Response) return me;
  const read = (await readJson(req))?.read;
  if (typeof read !== "string" || !read) return fail(400, "invalid");
  await markRead(me.id, read === "all" ? undefined : read);
  return noContent();
});
