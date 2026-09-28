"use client";

import { useId, useRef, useState } from "react";
import { suggestTitles } from "@/lib/game";

type Props = {
  onGuess: (guess: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Botões renderizados na mesma linha, dentro do form (submit = Chutar). */
  children?: React.ReactNode;
  /** Layout: linha única (emoji/opening) ou coluna (pistas). */
  stacked?: boolean;
};

/** Campo "Seu palpite" com autocomplete dos títulos do banco. */
export default function GuessInput({ onGuess, disabled, placeholder = "Digite o nome do anime...", children, stacked }: Props) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = open ? suggestTitles(value) : [];

  function submit(text: string) {
    const g = text.trim();
    if (!g || disabled) return;
    setValue("");
    setOpen(false);
    setActive(-1);
    onGuess(g);
  }

  return (
    <form
      className={stacked ? "flex flex-col gap-3" : "flex flex-wrap items-stretch gap-3"}
      onSubmit={(e) => {
        e.preventDefault();
        submit(active >= 0 && suggestions[active] ? suggestions[active] : value);
      }}
    >
      <div ref={wrapRef} className={`relative ${stacked ? "" : "min-w-52 flex-1"}`}>
        <input
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="Seu palpite"
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          aria-controls={listId}
          autoComplete="off"
          spellCheck={false}
          maxLength={80}
          className="w-full rounded-full bg-white px-6 py-4 font-medium text-ink placeholder:text-[#a99cd8] focus:outline-2 focus:outline-offset-2 focus:outline-lime disabled:opacity-60"
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
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
                    submit(t);
                  }}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {children}
    </form>
  );
}
