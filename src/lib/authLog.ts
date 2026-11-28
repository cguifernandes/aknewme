// Log dos erros do Auth.js sem dados pessoais nem tokens: o tipo do erro e, por baixo dele, o motivo real (a resposta de
// erro do provedor, como "invalid_client (401)", ou a checagem que falhou, como o cookie do PKCE). Só "[auth] Configuration"
// ou "CallbackRouteError" não dizia o que quebrou (09-menu-perfil.md, "Login com Discord no dev").
// No npm run dev, a mesma linha vai também para .next/auth-errors.log (dá para ler sem o terminal do servidor).

type Cause = { err?: unknown; provider?: unknown };

/** Uma linha curta: "CallbackRouteError discord · ResponseBodyError invalid_client (401)". */
export function authErrorLine(e: unknown): string {
  const top = e as { type?: string; name?: string; cause?: Cause };
  const parts = [top?.type ?? top?.name ?? "error"];
  if (typeof top?.cause?.provider === "string") parts[0] += ` ${top.cause.provider}`;
  const err = top?.cause?.err as { name?: string; code?: unknown; error?: unknown; status?: unknown; message?: unknown; type?: string } | undefined;
  if (err) {
    let why = err.type ?? err.name ?? "Error";
    // resposta de erro do provedor (oauth4webapi): o código OAuth e o status HTTP, sem a descrição
    if (typeof err.error === "string") why += ` ${err.error}`;
    if (typeof err.status === "number") why += ` (${err.status})`;
    // checagens do próprio Auth.js (state, PKCE, cookies): a mensagem é dele, sem dado da pessoa
    // e as da oauth4webapi (OperationProcessingError: "unexpected iss", "state missing"...)
    else if (/^(InvalidCheck|OAuthCallbackError|OAuthProfileParseError|MissingSecret|OperationProcessingError)$/.test(err.name ?? "") && typeof err.message === "string")
      why += `: ${err.message.replace(/\.? ?Read more at \S+/, "").slice(0, 160)}`;
    else if (typeof err.code === "string") why += ` ${err.code}`; // erro do banco: só o código
    parts.push(why);
  }
  return parts.join(" · ");
}

/** Escreve no console do servidor e, no npm run dev, em .next/auth-errors.log. */
export function logAuth(level: "error" | "warn", line: string) {
  (level === "error" ? console.error : console.warn)("[auth]", line);
  if (process.env.NODE_ENV !== "development") return;
  void import("node:fs")
    .then((fs) => fs.appendFileSync(".next/auth-errors.log", `${new Date().toISOString()} ${level} ${line}\n`))
    .catch(() => {});
}
