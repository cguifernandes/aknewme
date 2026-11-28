import { friendLists, friendsPage, pageNumber, requestFriend, requestsPage } from "@/lib/friends";
import { dailyNumber } from "@/lib/game";
import { handleProblem } from "@/lib/handle";
import { fail, json, readJson, requireUser, safe } from "@/lib/session";

// GET /api/friends[?fp=N&op=N] → { friends, friendsTotal, friendsPage, incomingCount, outgoing, outgoingTotal, outgoingPage }:
//   só uma página (10) dos amigos e dos pedidos enviados, com os totais, e a quantidade de pedidos recebidos.
// GET /api/friends?list=friends|incoming|outgoing&page=N → { items, total, page }: uma página de uma lista (paginação no
//   banco, LIMIT/OFFSET com ordem estável: 14-duelos-na-conta-e-paginacao.md).
// POST /api/friends { handle }: pedido de amizade pelo handle (sem busca por nome: specs/login-duelo, P2).
// Erros: 404 not_found (handle não existe), 400 invalid | self, 409 no_handle | already_friends | they_asked_you |
// too_many_pending. Pedido repetido devolve 200 com o mesmo estado.

export const GET = safe(async (req: Request) => {
  const me = await requireUser(req, "friends");
  if (me instanceof Response) return me;
  const q = new URL(req.url).searchParams;
  const list = q.get("list");
  if (list === "friends") return json(await friendsPage(me.id, dailyNumber(), pageNumber(q.get("page"))));
  if (list === "incoming" || list === "outgoing") return json(await requestsPage(me.id, list, pageNumber(q.get("page"))));
  return json(await friendLists(me.id, dailyNumber(), pageNumber(q.get("fp")), pageNumber(q.get("op"))));
});

const STATUS = { not_found: 404, self: 400, already_friends: 409, they_asked_you: 409, too_many_pending: 409 } as const;

export const POST = safe(async (req: Request) => {
  const me = await requireUser(req, "friends");
  if (me instanceof Response) return me;
  if (!me.handle) return fail(409, "no_handle"); // quem recebe o pedido precisa ver um handle
  const body = await readJson(req);
  const handle = typeof body?.handle === "string" ? body.handle.trim().toLowerCase() : "";
  if (handleProblem(handle) === "invalid") return fail(400, "invalid");
  const out = await requestFriend(me.id, handle);
  if (out === "sent") return json({ status: "pending" }, 201);
  if (out === "already_sent") return json({ status: "pending" });
  return fail(STATUS[out], out);
});
