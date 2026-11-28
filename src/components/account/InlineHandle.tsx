"use client";

import { useEffect, useRef, useState } from "react";
import { HANDLE_TEXT, type HandleState } from "@/lib/handle";
import HandleDot from "./HandleDot";
import { Spinner } from "./ui";
import { HANDLE_MAX, useHandleCheck } from "./useHandleCheck";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime";
const SAVE = `flex min-h-8 items-center gap-1.5 rounded-full bg-lime px-3 text-xs font-bold text-ink sweep-lime-deep disabled:opacity-60 ${FOCUS}`;

/**
 * Trocar o @ no mesmo lugar do cartão grape da janela Meu perfil (specs/login-duelo/09-menu-perfil.md): o "@nome" vira
 * um campo e o "Editar" vira "Salvar". Sem "Cancelar": Esc (ou fechar a janela) desfaz. A verificação ao vivo é a do
 * passo 2 do login (useHandleCheck), com a bolinha de tamanho fixo dentro do campo (HandleDot); sugestões e erro
 * aparecem numa linha curta embaixo, só quando houver.
 * Regra do @ (01-requisitos.md, R5b e R5c): a regra aparece antes de salvar; quando a conta já escolheu o @
 * (`state` "chosen"), salvar gasta a única troca, então pede confirmação antes de gravar.
 */
export default function InlineHandle({
  handle,
  state,
  onSaved,
  onCancel,
}: {
  handle: string | null;
  /** "none"/"auto": escolha livre; "chosen": a única troca */
  state: HandleState;
  onSaved: (handle: string, state?: HandleState) => void;
  onCancel: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { value, setValue, alts, failure, saving, save, busy, free, dot, dotLabel, note } = useHandleCheck({ handle });
  const [confirming, setConfirming] = useState(false);
  const isChange = state === "chosen";

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);
  // mexeu no campo: a confirmação da troca some
  useEffect(() => setConfirming(false), [value]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!free || saving) return;
    if (value === handle) return onCancel(); // nada mudou
    if (isChange && !confirming) return setConfirming(true);
    const saved = await save();
    if (saved) onSaved(saved.handle, saved.state);
    else setConfirming(false);
  }

  const border = dot === "free" ? "border-lime" : dot === "busy" ? "border-blush" : "border-transparent";

  return (
    <form onSubmit={submit} noValidate className="mt-1">
      <div className="flex flex-wrap items-center gap-2">
        <div className={`flex h-9 max-w-72 min-w-0 flex-1 basis-40 items-center gap-1 rounded-full border-2 bg-paper pr-0.5 pl-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-lime ${border}`}>
          <span className="font-bold text-grape" aria-hidden="true">
            @
          </span>
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // Esc desfaz a edição (sem isso o <dialog> fecharia, o que também desfaria)
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
              }
            }}
            maxLength={HANDLE_MAX}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label="Seu novo usuário"
            aria-invalid={busy}
            aria-describedby="profile-handle-note"
            className="min-w-0 flex-1 bg-transparent font-bold text-ink outline-none"
          />
          <HandleDot state={dot} label={dotLabel} />
        </div>
        {!confirming && (
          <button type="submit" disabled={!free || saving} aria-busy={saving} className={SAVE}>
            {saving && <Spinner />} Salvar
          </button>
        )}
      </div>

      <div id="profile-handle-note" className="text-sm">
        {confirming ? (
          // a única troca: confirma antes de gravar. A caixa tem a mesma largura do campo do @ acima dela (max-w-72)
          <div role="alertdialog" aria-label="Confirmar a troca do usuário" className="mt-2 flex w-full max-w-72 flex-wrap items-center gap-2 rounded-2xl bg-grape-deep p-2.5">
            <p className="w-full font-bold text-white">{HANDLE_TEXT.confirm(value)}</p>
            <button type="submit" autoFocus disabled={saving} aria-busy={saving} className={SAVE}>
              {saving && <Spinner />} Trocar
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={saving} className={`min-h-8 rounded-full border-2 border-white/60 px-3 text-xs font-bold text-white transition-colors hover:bg-white/10 ${FOCUS}`}>
              Voltar
            </button>
          </div>
        ) : (
          <>
            {busy && alts.length > 0 && !failure ? (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-on-grape" aria-live="polite">
                {note}
                {alts.map((a) => (
                  <button key={a} type="button" onClick={() => setValue(a)} className={`rounded font-bold text-white underline underline-offset-4 transition-colors hover:text-lime ${FOCUS}`}>
                    @{a}
                  </button>
                ))}
              </p>
            ) : (
              note && (
                <p role={failure ? "alert" : undefined} aria-live="polite" className="mt-1.5 font-semibold text-on-grape">
                  {note}
                </p>
              )
            )}
            {/* a regra, sempre à vista antes de salvar */}
            {!note && <p className="mt-1.5 text-xs font-semibold text-on-grape">{isChange ? HANDLE_TEXT.once : HANDLE_TEXT.free}</p>}
          </>
        )}
      </div>
    </form>
  );
}
