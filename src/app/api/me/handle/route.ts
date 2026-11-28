import { rows } from "@/lib/db";
import { HANDLE_HOLD_DAYS, handleProblem, MAX_HANDLE_CHANGES } from "@/lib/handle";
import { handleState, heldByOther, setHandle } from "@/lib/handleChange";
import { alternatives, toHandle } from "@/lib/handleSuggest";
import { fail, json, readJson, requireUser, safe } from "@/lib/session";

// GET /api/me/handle?h=: verificação ao vivo → { status: available | taken | held | invalid | reserved | offensive,
//   alternatives? } (com taken/held/reserved vêm até 3 @ livres parecidos: 06-usuario.md).
// GET /api/me/handle?suggest=1: sugestão para o passo 2 a partir do nome da conta → { candidate, status, alternatives }.
// GET /api/me/handle (sem h): regra de troca → { handle, state, changesLeft, maxChanges, holdDays }.
// POST /api/me/handle { handle }: escolhe ou troca o @ (formato, reservados, ofensivos, unicidade e a regra de UMA
//   troca conferidos aqui) → { handle, state, changesLeft }.
// Erros: 400 invalid | reserved | offensive; 409 taken (em uso) | held (guardado para outra conta, trocado há menos de
// 30 dias) | handle_final (a conta já usou a única troca: 01-requisitos.md, R5b).

type Status = "available" | "taken" | "held" | "invalid" | "reserved" | "offensive";

async function statusOf(h: string, me: string): Promise<Status> {
  const problem = handleProblem(h);
  if (problem) return problem;
  const [owner] = await rows<{ id: string }>("SELECT id FROM users WHERE handle = $1", [h]);
  if (owner && owner.id !== me) return "taken";
  return (await heldByOther(h, me)) ? "held" : "available";
}

export const GET = safe(async (req: Request) => {
  const me = await requireUser(req, "handle-check");
  if (me instanceof Response) return me;
  const params = new URL(req.url).searchParams;
  if (params.get("suggest") === "1") {
    const candidate = me.handle ?? toHandle(me.name);
    if (!candidate) return json({ candidate: null, status: null, alternatives: [] });
    const status = await statusOf(candidate, me.id);
    // nome que vira um @ ofensivo: não sugere nada parecido (o campo começa vazio)
    if (status === "offensive") return json({ candidate: null, status: null, alternatives: [] });
    return json({ candidate, status, alternatives: status === "available" ? [] : await alternatives(candidate, me.id) });
  }
  const h = params.get("h");
  if (h === null) return json({ handle: me.handle, ...(await handleState(me.id)), maxChanges: MAX_HANDLE_CHANGES, holdDays: HANDLE_HOLD_DAYS });
  const status = await statusOf(h, me.id);
  if (status === "taken" || status === "held" || status === "reserved") return json({ status, alternatives: await alternatives(h, me.id) });
  return json({ status });
});

export const POST = safe(async (req: Request) => {
  const me = await requireUser(req, "handle");
  if (me instanceof Response) return me;
  const body = await readJson(req);
  const handle = typeof body?.handle === "string" ? body.handle : "";
  const problem = handleProblem(handle);
  if (problem) return fail(400, problem);
  const out = await setHandle(me.id, me.handle, handle);
  if (out.ok) return json({ handle: out.handle, state: out.state, changesLeft: out.changesLeft });
  return fail(out.status, out.error);
});
