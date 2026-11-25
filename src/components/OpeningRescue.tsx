"use client";

import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import AnimeImage from "@/components/AnimeImage";
import { Icon } from "@/components/icons";
import type { Anime } from "@/data/animes";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";

/** Convite para o modo resgate (Modo Opening, a partir da 5ª tentativa). */
export function RescueOffer({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group mt-4 flex w-full animate-pop items-center gap-4 rounded-2xl border-2 border-dashed border-grape/40 bg-track/60 px-5 py-4 text-left transition-colors hover:border-grape hover:bg-track ${FOCUS}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-ink">Modo resgate</span>
        <span className="block text-sm text-muted">Troque o palpite por 4 alternativas · vale como acerto com resgate</span>
      </span>
      <Icon icon={faArrowRight} className="text-grape transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </button>
  );
}

/**
 * As 4 alternativas do resgate, com a imagem de cada anime. Exceção combinada à regra de "imagem só depois da
 * resposta" (AnimeImage): aqui a imagem é a própria ajuda do resgate.
 */
export default function RescuePanel({
  choices,
  onChoose,
  onBack,
}: {
  choices: Anime[];
  onChoose: (title: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="animate-enter">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] font-semibold text-ink">Modo resgate · qual destes?</p>
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-grape hover:bg-track ${FOCUS}`}
        >
          <Icon icon={faArrowLeft} />
          Voltar ao palpite
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {choices.map((c, i) => (
          <li key={c.title} className="animate-pop" style={{ animationDelay: `${i * 60}ms` }}>
            <button
              type="button"
              onClick={() => onChoose(c.title)}
              className={`group relative flex h-32 w-full items-end overflow-hidden rounded-2xl bg-grape-ink text-left transition active:translate-y-0.5 sm:h-36 ${FOCUS}`}
            >
              {/* o banner cobre a caixa pela altura: ~4,75 × 144px ≈ 690px de largura */}
              <AnimeImage anime={c} sizes="700px" />
              <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink via-ink/50 to-transparent" />
              <span className="absolute inset-0 rounded-2xl ring-0 ring-lime transition-shadow ring-inset group-hover:ring-4" aria-hidden="true" />
              <span className="relative p-3 font-display text-lg leading-tight font-extrabold text-balance text-white">{c.title}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-muted">
        Uma chance só: escolher o anime errado encerra o jogo. Abrir o resgate já marca o acerto como “com resgate”,
        mesmo voltando ao palpite.
      </p>
    </div>
  );
}
