"use client";

import { useEffect, useId, useRef, useState } from "react";
import AnimeImage from "@/components/AnimeImage";
import { animeByTitle, isCorrectGuess, isKnownAnime, suggestTitles } from "@/lib/game";
import { ANIMES, type Anime } from "@/data/animes";

/** Iniciais no lugar da capa enquanto ela carrega (ou se faltar): "Death Note" → "DN". */
const initials = (t: string) =>
  t
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

type Props = {
  onGuess: (guess: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Botões extras ao lado do campo (ex.: Pular). */
  children?: React.ReactNode;
  /** Palpites já feitos: aparecem apagados na lista, com "já chutou", e não gastam tentativa de novo. */
  guessed?: string[];
};

/**
 * Campo "Seu palpite" com a lista de sugestões. Escolher uma sugestão (clique, toque ou Enter) já chuta;
 * Enter com o nome completo digitado também. Só envia animes do banco: texto incompleto não gasta tentativa.
 */
export default function GuessInput({
  onGuess,
  disabled,
  placeholder = "Nome do anime (PT, EN ou JP)",
  children,
  guessed = [],
}: Props) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [hint, setHint] = useState("");
  const listId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const wasDisabled = useRef(disabled);

  // Travado entre rodadas (Modo Emoji), o campo perde o foco. Ao destravar,
  // devolve o foco para já digitar o próximo palpite — a não ser que o
  // jogador tenha ido para outro lugar da página nesse meio-tempo.
  useEffect(() => {
    const a = document.activeElement;
    if (wasDisabled.current && !disabled && (!a || a === document.body || formRef.current?.contains(a))) {
      inputRef.current?.focus();
    }
    wasDisabled.current = disabled;
  }, [disabled]);

  const suggestions = open ? suggestTitles(value) : [];
  const already = (title: string) => guessed.some((g) => isCorrectGuess(g, animeByTitle(title)!));

  // Lista abriu perto do fim da página (ou com o teclado do celular aberto): rola até ela caber, com folga embaixo.
  const hasList = suggestions.length > 0;
  useEffect(() => {
    if (hasList) spacerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [hasList]);

  /** Chuta: limpa o campo e entrega o palpite ao jogo. */
  function send(g: string) {
    if (disabled) return;
    if (guessed.some((x) => sameAnime(x, g))) {
      setHint("Você já chutou esse anime.");
      inputRef.current?.focus();
      return;
    }
    setValue("");
    setOpen(false);
    setActive(-1);
    setHint("");
    onGuess(g);
  }

  function submit() {
    if (disabled) return;
    if (active >= 0 && suggestions[active]) return send(suggestions[active]); // Enter na sugestão destacada: chuta ela
    const g = value.trim();
    if (!isKnownAnime(g)) {
      setHint(g ? "Escolha um anime da lista de sugestões." : "Digite o nome do anime.");
      setOpen(true);
      inputRef.current?.focus();
      return;
    }
    send(g);
  }

  return (
    <div>
      <form
        ref={formRef}
        className="flex flex-wrap items-stretch gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {/* No celular o campo ocupa a linha toda e os botões extras vão para a de baixo */}
        <div className="relative min-w-52 flex-1 max-sm:basis-full">
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
            enterKeyHint="send"
            className="h-14 w-full rounded-full bg-white px-6 font-medium text-ink ring-1 ring-grape/20 placeholder:text-muted/60 focus:outline-2 focus:outline-offset-2 focus:outline-grape disabled:opacity-60"
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
          {hasList && (
            // pb-8 (sem cor, sem clique): a folga abaixo da lista entra na área rolável da página — a rolagem
            // automática leva até ela e a lista não fica colada na borda de baixo
            <div ref={spacerRef} className="pointer-events-none absolute inset-x-0 top-full z-10 pt-2 pb-8">
              <ul
                id={listId}
                role="listbox"
                // dvh: cabe com o teclado do celular aberto
                className="pointer-events-auto max-h-[min(20rem,50dvh)] overflow-y-auto overscroll-contain rounded-2xl border border-lavender bg-white p-1.5 shadow-pop"
              >
                {suggestions.map((t, i) => (
                  <Suggestion
                    key={t}
                    anime={animeByTitle(t)!}
                    active={i === active}
                    done={already(t)}
                    onPick={() => send(t)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
        {children}
      </form>
      {/* fica sempre no DOM (leitor de tela anuncia quando muda); vazio não ocupa espaço */}
      <p id={hintId} role="status" className="mt-2 text-sm font-semibold text-danger empty:mt-0">
        {hint}
      </p>
    </div>
  );
}

/** Mesmo anime? (palpite já feito × palpite digitado; cada um pode ser título ou apelido) */
function sameAnime(done: string, typed: string): boolean {
  const anime = ANIMES.find((x) => isCorrectGuess(typed, x));
  return !!anime && isCorrectGuess(done, anime);
}

/** Linha da lista de sugestões: capa, título, gênero · estúdio, e ano + episódios (ou "já chutou"). */
function Suggestion({ anime, active, done, onPick }: { anime: Anime; active: boolean; done: boolean; onPick: () => void }) {
  return (
    <li role="option" aria-selected={active} aria-disabled={done}>
      <button
        type="button"
        tabIndex={-1}
        className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left ${done ? "cursor-default opacity-50" : active ? "bg-track" : "hover:bg-track"}`}
        onMouseDown={(e) => {
          e.preventDefault();
          onPick();
        }}
      >
        <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-lavender/50 text-sm font-extrabold text-grape">
          {initials(anime.title)}
          <AnimeImage anime={anime} kind="cover" sizes="48px" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-ink">{anime.title}</span>
          <span className="block truncate text-xs text-muted">
            {anime.genre} · {anime.studio}
          </span>
        </span>
        {done ? (
          <span className="shrink-0 rounded-full bg-blush/40 px-2.5 py-1 text-xs font-bold text-danger">já chutou</span>
        ) : (
          <span className="flex shrink-0 gap-1.5 text-xs font-bold text-grape">
            <span className="rounded-full bg-track px-2.5 py-1">{anime.year}</span>
            <span className="rounded-full bg-track px-2.5 py-1 max-sm:hidden">{anime.episodes} eps</span>
          </span>
        )}
      </button>
    </li>
  );
}
