import { isUniqueViolation, rows } from "./db";
import { HANDLE_HOLD_DAYS, MAX_HANDLE_CHANGES, type HandleState } from "./handle";

// Escolha e troca do @ no servidor (specs/login-duelo/01-requisitos.md, R5, R5a e R5b).
// - O @ criado no login é provisório (users.handle_auto): a primeira escolha da pessoa, saindo dele ou de nenhum @, é
//   livre e não conta.
// - Depois dela, a conta tem UMA troca (MAX_HANDLE_CHANGES), para sempre: cada troca é uma linha em handle_changes, que
//   não é mais apagada. Depois da troca o @ é definitivo (só o suporte muda).
// - Ao sair de um @, ele fica guardado para a mesma conta por HANDLE_HOLD_DAYS dias. Amizades e salas são do user_id.

const HOLD = `${HANDLE_HOLD_DAYS} days`;

/** O handle está guardado para outra conta (trocado há menos de 30 dias)? */
export async function heldByOther(handle: string, me: string): Promise<boolean> {
  const held = await rows(
    "SELECT 1 FROM handle_reservations WHERE handle = $1 AND user_id <> $2 AND reserved_until > now()",
    [handle, me],
  );
  return held.length > 0;
}

/** Em que ponto a conta está: sem @, @ provisório do login, @ escolhido (resta uma troca) ou definitivo. */
export async function handleState(me: string): Promise<{ state: HandleState; changesLeft: number }> {
  const [u] = await rows<{ handle: string | null; auto: boolean; changes: number }>(
    `SELECT handle, handle_auto AS auto, handle_changes_used AS changes FROM users WHERE id = $1`,
    [me],
  );
  if (!u?.handle) return { state: "none", changesLeft: MAX_HANDLE_CHANGES };
  if (u.auto) return { state: "auto", changesLeft: MAX_HANDLE_CHANGES };
  const changesLeft = Math.max(0, MAX_HANDLE_CHANGES - u.changes);
  return { state: changesLeft > 0 ? "chosen" : "final", changesLeft };
}

export type SetOutcome =
  | { ok: true; handle: string; state: HandleState; changesLeft: number }
  | { ok: false; status: 409; error: "taken" | "held" | "handle_final" };

/**
 * Grava o @: a escolha livre (sem @ ou saindo do provisório) ou a única troca. "handle_final" = a conta já usou a troca.
 * Tudo numa consulta só: o UPDATE do usuário confere o estado na própria linha (provisório/sem @, ou trocas usadas <
 * MAX_HANDLE_CHANGES) e soma a troca; o resto (reserva do @ antigo, registro da troca) só acontece se ele gravou. Com
 * chamadas em paralelo, a linha fica travada: a 2ª espera a 1ª e, conferindo de novo a linha já gravada, não passa.
 */
export async function setHandle(me: string, current: string | null, handle: string, retry = true): Promise<SetOutcome> {
  const before = await handleState(me);
  if (handle === current) return { ok: true, handle, ...before };
  if (before.state === "final") return { ok: false, status: 409, error: "handle_final" };
  if (await heldByOther(handle, me)) return { ok: false, status: 409, error: "held" };
  const isChange = before.state === "chosen"; // gasta a troca; "none" e "auto" são a escolha livre
  await rows("DELETE FROM handle_reservations WHERE reserved_until <= now()");
  let done: { n: number }[];
  try {
    done = await rows<{ n: number }>(
      `WITH u AS (
         UPDATE users SET handle = $2, handle_auto = false, handle_changes_used = handle_changes_used + $5::int
         WHERE id = $1 AND (CASE WHEN $5::int = 1 THEN handle IS NOT NULL AND NOT handle_auto AND handle_changes_used < $6::int
                                 ELSE handle IS NULL OR handle_auto END)
         RETURNING id),
       back AS (DELETE FROM handle_reservations WHERE handle = $2 AND user_id = $1 AND EXISTS (SELECT 1 FROM u)),
       hold AS (
         INSERT INTO handle_reservations (handle, user_id, reserved_until)
         SELECT $3, $1, now() + $4::interval WHERE $3::text IS NOT NULL AND EXISTS (SELECT 1 FROM u)
         ON CONFLICT (handle) DO UPDATE SET user_id = EXCLUDED.user_id, reserved_until = EXCLUDED.reserved_until),
       log AS (INSERT INTO handle_changes (user_id) SELECT $1 WHERE $5::int = 1 AND EXISTS (SELECT 1 FROM u))
       SELECT count(*)::int AS n FROM u`,
      [me, handle, current, HOLD, isChange ? 1 : 0, MAX_HANDLE_CHANGES],
    );
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, status: 409, error: "taken" };
    throw e;
  }
  // não gravou: outra chamada mudou o estado no meio (ex.: duas escolhas livres juntas); confere de novo uma vez
  if (!done[0]?.n) return retry ? setHandle(me, current, handle, false) : { ok: false, status: 409, error: "handle_final" };
  const changesLeft = before.changesLeft - (isChange ? 1 : 0);
  return { ok: true, handle, state: changesLeft > 0 ? "chosen" : "final", changesLeft };
}
