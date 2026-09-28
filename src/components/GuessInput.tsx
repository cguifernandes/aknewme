"use client";

import { useId, useRef, useState } from "react";
import { isKnownAnime, suggestTitles } from "@/lib/game";

type Props = {
  onGuess: (guess: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Botões extras ao lado do "Chutar" (ex.: Pular). */
  children?: React.ReactNode;
  /** Layout: linha única (emoji/opening) ou coluna (pistas). */
  stacked?: boolean;
};

/**
 * Campo "Seu palpite" + botão "Chutar".
 * Escolher uma sugestão preenche o campo; "Chutar" (ou Enter) envia.
 * Só envia nomes de animes do banco: texto incompleto não gasta tentativa.
 */
export default function GuessInput({ onGuess, disabled, placeholder = "Digite o nome do anime...", children, stacked }: Props) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [hint, setHint] = useState("");
  const listId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = open ? suggestTitles(value) : [];

  function choose(title: string) {
    setValue(title);
    setOpen(false);
    setActive(-1);
    setHint("");
    inputRef.current?.focus();
  }

  function submit() {
    if (disabled) return;
    if (active >= 0 && suggestions[active]) return choose(suggestions[active]); // Enter na sugestão destacada: preenche
    const g = value.trim();
    if (!isKnownAnime(g)) {
      setHint(g ? "Escolha um anime da lista de sugestões." : "Digite o nome do anime.");
      setOpen(true);
      inputRef.current?.focus();
      return;
    }
    setValue("");
    setOpen(false);
    setActive(-1);
    setHint("");
    onGuess(g);
  }

  return (
    <div>
      <form
        className={stacked ? "flex flex-col gap-3" : "flex flex-wrap items-stretch gap-3"}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {/* No celular o campo ocupa a linha toda e os botões vão para a de baixo */}
        <div className={`relative ${stacked ? "" : "min-w-52 flex-1 max-sm:basis-full"}`}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            aria-label="Seu palpite"
            aria-autocomplete="list"
            aria-expanded={suggestions.length > 0}
            aria-controls={listId}
            aria-describedby={hint ? hintId : undefined}
            autoComplete="off"
            spellCheck={false}
            maxLength={80}
            className="w-full rounded-full bg-white px-6 py-4 font-medium text-ink ring-1 ring-grape/20 placeholder:text-muted/60 focus:outline-2 focus:outline-offset-2 focus:outline-grape disabled:opacity-60"
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
              setActive(-1);
              setHint("");
            }}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (!suggestions.length) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => (a + 1) % suggestions.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          {suggestions.length > 0 && (
            <ul
              id={listId}
              role="listbox"
              className="absolute inset-x-2 top-full z-10 mt-2 overflow-hidden rounded-2xl bg-white py-2 shadow-pop"
            >
              {suggestions.map((t, i) => (
                <li key={t} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    className={`w-full px-5 py-2.5 text-left font-medium text-ink ${i === active ? "bg-track" : "hover:bg-track"}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(t);
                    }}
                  >
                    {t}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled}
          className={`rounded-full bg-lime py-4 font-bold text-ink shadow-pop transition hover:brightness-105 active:translate-y-0.5 active:shadow-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape ${
            stacked ? "w-full" : "px-8 max-sm:flex-1"
          }`}
        >
          Chutar
        </button>
        {children}
      </form>
      {/* fica sempre no DOM (leitor de tela anuncia quando muda); vazio não ocupa espaço */}
      <p id={hintId} role="status" className="mt-2 text-sm font-semibold text-danger empty:mt-0">
        {hint}
      </p>
    </div>
  );
}
