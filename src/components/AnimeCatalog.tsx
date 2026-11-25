"use client";

import { useState } from "react";
import { ANIMES, type Anime } from "@/data/animes";
import { normalize } from "@/lib/game";
import { formatValue } from "@/lib/higherLower";
import AnimeImage from "./AnimeImage";

const LINK = "font-bold text-grape underline underline-offset-4 hover:text-grape-deep";
const DT = "text-xs font-bold tracking-wider text-muted uppercase";

const PAGE = 10; // animes mostrados por vez: a página não monta os 106 (com capa e player) de uma vez

/** Tudo em que a busca procura: título, apelidos, estúdio, gênero e ano. */
const haystack = (a: Anime) => normalize([a.title, ...a.aliases, a.studio, a.genre, a.year].join(" "));

function Details({ a }: { a: Anime }) {
  return (
    <div className="space-y-4 border-t-2 border-track p-3 text-sm">
      <dl className="space-y-3">
        <div>
          <dt className={DT}>Apelidos aceitos</dt>
          <dd>{a.aliases.length ? a.aliases.join(" · ") : "—"}</dd>
        </div>
        <div>
          <dt className={DT}>Modo Emoji</dt>
          <dd className="text-2xl">{a.emojis.join(" ")}</dd>
          {a.emojiClues.map((clue, i) => (
            <dd key={i}>
              <strong>Pista {i + 1}:</strong> {clue}
            </dd>
          ))}
        </div>
        <div>
          <dt className={DT}>Modo Pistas</dt>
          <dd>
            {a.year} · {a.studio} · {a.genre} · {a.episodes} episódios
          </dd>
          <dd className="mt-1 text-muted">{a.synopsis}</dd>
        </div>
        <div>
          <dt className={DT}>Aberturas ({a.openings.length})</dt>
          {a.openings.map((o) => (
            <dd key={o.name + o.artist} className="mt-1.5">
              <strong>{o.name}</strong> · {o.artist}
              {o.appleMusic && (
                <>
                  {" · "}
                  <a href={o.appleMusic} target="_blank" rel="noopener noreferrer" className={LINK}>
                    Apple Music
                  </a>
                </>
              )}
              {o.audioSrc ? (
                // preload="none": a prévia só é baixada se apertar o play
                <audio controls preload="none" src={o.audioSrc} className="mt-1 block h-9 w-full max-w-sm" />
              ) : (
                <span className="ml-2 rounded-full bg-blush px-2 py-0.5 text-xs font-bold">sem áudio</span>
              )}
            </dd>
          ))}
        </div>
        <div>
          <dt className={DT}>MyAnimeList</dt>
          {a.mal ? (
            <dd>
              Nota {formatValue(a.mal.score, "score")} · {a.mal.members.toLocaleString("pt-BR")} membros ·{" "}
              <a href={`https://myanimelist.net/anime/${a.mal.id}`} target="_blank" rel="noopener noreferrer" className={LINK}>
                página (id {a.mal.id})
              </a>
            </dd>
          ) : (
            <dd>sem dados (rode npm run mal)</dd>
          )}
        </div>
      </dl>
      <div>
        <p className={DT}>Imagens (banner e capa)</p>
        <div className="mt-1.5 flex gap-3">
          <div className="relative h-28 flex-1 overflow-hidden rounded-xl bg-track">
            <AnimeImage anime={a} sizes="640px" />
          </div>
          <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-track">
            <AnimeImage anime={a} kind="cover" sizes="128px" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Painel /plays: todos os animes do banco, com tudo o que está salvo de cada um. Busca por título, apelido, estúdio, gênero ou ano. */
export default function AnimeCatalog() {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const q = normalize(query);
  const list = q ? ANIMES.filter((a) => haystack(a).includes(q)) : ANIMES;

  return (
    <section className="mt-4 rounded-3xl bg-white p-5 shadow-pop sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">Animes do banco · {ANIMES.length}</h2>
          <p className="mt-0.5 text-xs text-muted">
            tudo o que está salvo em src/data/animes; clique num anime para abrir · mostrando {Math.min(shown, list.length)} de {list.length}
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          }}
          placeholder="Buscar por título, estúdio, gênero ou ano..."
          aria-label="Buscar anime"
          className="w-full rounded-full border-2 border-lavender bg-white px-5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus-visible:border-grape focus-visible:outline-none sm:w-96"
        />
      </div>

      {/* duas colunas; items-start: abrir um anime não estica o vizinho */}
      <ul className="mt-4 grid items-start gap-x-6 gap-y-1 lg:grid-cols-2">
        {list.slice(0, shown).map((a) => (
          <li key={a.title}>
            <details className="group rounded-2xl open:bg-track/50">
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-2.5 hover:bg-track focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape [&::-webkit-details-marker]:hidden">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-track">
                  <AnimeImage anime={a} kind="cover" sizes="64px" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate leading-tight font-bold">{a.title}</strong>
                  <span className="block truncate text-xs font-semibold text-muted">
                    {a.year} · {a.studio} · {a.genre} · {a.episodes} eps
                  </span>
                </span>
                {a.mal && (
                  <span className="w-28 shrink-0 text-right text-xs font-semibold text-muted tabular-nums max-sm:hidden">
                    <strong className="block text-sm text-ink">{formatValue(a.mal.score, "score")}</strong>
                    {formatValue(a.mal.members, "members")} membros
                  </span>
                )}
              </summary>
              <Details a={a} />
            </details>
          </li>
        ))}
      </ul>
      {shown < list.length && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE)}
          className="mx-auto mt-5 block rounded-full bg-grape px-7 py-3 font-bold text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
        >
          Ver mais {Math.min(PAGE, list.length - shown)}
        </button>
      )}
      {!list.length && <p className="mt-4 text-muted">Nenhum anime com esse termo.</p>}
    </section>
  );
}
