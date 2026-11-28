import { signOut } from "@/auth";
import { rows } from "@/lib/db";
import { handleState } from "@/lib/handleChange";
import { fail, json, noContent, requireUser, safe } from "@/lib/session";
import { maskedEmail } from "@/lib/users";

// GET /api/me: a conta da sessão ({ id, handle, name, image, created_at, email mascarado, handleState }); 401 sem sessão.
// handle null = ainda não escolheu.
// DELETE /api/me: exclui a conta (LGPD). Apaga o usuário e, em cascata, os logins, as amizades, as participações em
// salas e as salas que ele criou (specs/login-duelo, R4 e CA6).

export const GET = safe(async (req: Request) => {
  const me = await requireUser(req);
  if (me instanceof Response) return me;
  // e-mail só mascarado (o completo não sai do servidor); null = conta que ainda não entrou depois da mudança
  // handleState: sem @, provisório, escolhido (resta uma troca) ou definitivo (01-requisitos.md, R5b)
  return json({ ...me, email: await maskedEmail(me.id), handleState: (await handleState(me.id)).state });
});

export const DELETE = safe(async (req: Request) => {
  const me = await requireUser(req, "account");
  if (me instanceof Response) return me;
  const gone = await rows("DELETE FROM users WHERE id = $1 RETURNING id", [me.id]);
  if (!gone.length) return fail(404, "not_found");
  try {
    await signOut({ redirect: false }); // apaga o cookie da sessão
  } catch {
    // sem cookie apagado, a sessão já não vale: requireUser não acha o usuário no banco
  }
  return noContent();
});
