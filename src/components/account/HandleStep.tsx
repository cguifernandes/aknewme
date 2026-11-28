"use client";

import type { Me } from "@/lib/account";
import { HANDLE_TEXT } from "@/lib/handle";
import HandleDot from "./HandleDot";
import { Alert, FOCUS, LINK, ProfileAvatar, Spinner } from "./ui";
import { HANDLE_FAILURE, HANDLE_MAX, useHandleCheck, type Suggestion } from "./useHandleCheck";

// Passo "Escolha seu @" (specs/login-duelo/06-usuario.md): o passo 2 de 2 do login. A troca depois do login é na janela
// Meu perfil (09-menu-perfil.md, terceira rodada; a tela /handle saiu).
// Campo com @ fixo, a bolinha de disponibilidade de tamanho fixo (HandleDot), contador, sugestões livres, prévia
// "Assim te veem nos duelos", botão lime "Salvar username" e a regra da troca (R5c). A verificação ao vivo e a gravação
// ficam em useHandleCheck.

export type { Suggestion };
const MAX = HANDLE_MAX;

export default function HandleStep({
  me,
  step = false,
  initial,
  onSaved,
  onLater,
}: {
  me: Me;
  /** passo 2 do login: mostra "Passo 2 de 2 · último" e o título "Escolha seu @" */
  step?: boolean;
  /** sugestão do servidor (nome da conta convertido + alternativas livres) */
  initial?: Suggestion | null;
  onSaved: (handle: string) => void;
  /** "Fazer depois" (só no login) */
  onLater?: () => void;
}) {
  const { value, setValue, alts, failure, saving, save: saveHandle, busy, free, dot, dotLabel, note } = useHandleCheck(me, initial);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const saved = await saveHandle();
    if (saved) onSaved(saved.handle);
  }

  const border = free ? "border-grape" : busy ? "border-blush" : "border-lavender";
  // a explicação do X (já foi, reservado, não permitido) ou a regra de formato
  const hint = (!failure && note) || "Letras minúsculas, números e _";
  const later = onLater && (
    <button type="button" onClick={onLater} className={`${LINK} inline-flex min-h-11 items-center text-sm`}>
      Fazer depois
    </button>
  );

  return (
    <form onSubmit={save} noValidate className="w-full">
      {step && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-grape">
            <span className="h-1.5 w-7 rounded-full bg-grape" aria-hidden="true" />
            <span className="h-1.5 w-7 rounded-full bg-grape" aria-hidden="true" />
            Passo 2 de 2 · último
          </p>
          <span className="max-sm:hidden">{later}</span>
        </div>
      )}
      <h2 className="font-display text-4xl leading-tight font-extrabold tracking-tight text-ink">
        {step || !me.handle ? "Escolha seu username" : "Trocar seu username"}
      </h2>
      <p className="mt-2 text-base text-muted">É por ele que seus amigos te acham e te desafiam.</p>

      <label htmlFor="handle" className="sr-only">
        Seu username
      </label>
      <div className={`mt-6 flex min-h-[60px] items-center gap-2 rounded-2xl border-2 bg-paper px-4 focus-within:outline-3 focus-within:outline-offset-3 focus-within:outline-grape ${border}`}>
        <span className="font-display text-xl font-extrabold text-grape" aria-hidden="true">
          @
        </span>
        <input
          id="handle"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="seu_nome"
          maxLength={MAX}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={busy}
          aria-describedby="handle-hint handle-count"
          className="min-w-0 flex-1 bg-transparent text-lg font-bold text-ink outline-none placeholder:text-lavender"
        />
        <HandleDot state={dot} label={dotLabel} />
      </div>
      <div className="mt-2 flex justify-between gap-3 text-sm text-muted">
        <span id="handle-hint" aria-live="polite">
          {hint}
        </span>
        <span id="handle-count" className="tabular-nums">
          {value.length}/{MAX}
        </span>
      </div>

      {busy && alts.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-grape">Livres:</span>
          {alts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setValue(a)}
              className={`min-h-11 rounded-full border-2 border-lavender px-4 text-base font-bold text-ink hover:bg-track ${FOCUS}`}
            >
              @{a}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-track p-4">
        <ProfileAvatar image={me.image} name={me.name} size={48} />
        <div className="min-w-0">
          <p className="text-xs font-bold text-muted">Assim te veem nos duelos</p>
          <p className="truncate text-base font-bold text-ink">
            {me.name ?? "Você"} <span className="text-grape">@{value || "seu_nome"}</span>
          </p>
        </div>
      </div>

      {failure && <Alert>{HANDLE_FAILURE[failure]}</Alert>}
      <button
        type="submit"
        disabled={!free || saving}
        aria-busy={saving}
        className={`mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-lime px-4 text-base font-bold text-ink shadow-pop sweep-lime-deep active:translate-y-0.5 disabled:bg-track disabled:text-muted disabled:shadow-none ${FOCUS}`}
      >
        {saving && <Spinner />} Salvar username
      </button>
      <p className="mt-3 text-center text-sm text-muted">
        {/* aqui é sempre a escolha livre (quem chega ao passo 2 não tem @, ou tem o provisório do login) */}
        {HANDLE_TEXT.free}
      </p>
      {step && later && <p className="mt-4 text-center sm:hidden">{later}</p>}
    </form>
  );
}
