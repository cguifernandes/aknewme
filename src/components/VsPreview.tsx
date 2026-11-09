import { ANIMES } from "@/data/animes";

// Dupla da prévia: vem do banco de animes (se um título sair de lá, cai nos dois primeiros).
const A = ANIMES.find((a) => a.title === "Naruto") ?? ANIMES[0];
const B = ANIMES.find((a) => a.title === "Bleach") ?? ANIMES[1];

const CARD =
  "flex h-22 w-26 flex-col justify-center rounded-2xl px-3 shadow-pop ring-2 ring-white transition duration-500 ease-spring";
const LABEL = "truncate text-[10px] font-bold tracking-wider uppercase";

/**
 * Prévia do Mais ou Menos: uma carta com o número à mostra × uma com "?".
 * Num pai `group`, abre no hover (card da Home); com `float`, fica flutuando (janela de lançamento).
 * Feita para ficar sobre fundo lime (o anel do "VS" é lime).
 */
export default function VsPreview({ float = false }: { float?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      <div
        className={`${CARD} -rotate-6 bg-grape pr-5 group-hover:-translate-x-1.5 group-hover:-rotate-10 group-focus-visible:-translate-x-1.5 group-focus-visible:-rotate-10 ${float ? "animate-float" : ""}`}
      >
        <span className={`${LABEL} text-lavender`}>{A.title}</span>
        <span className="font-display text-3xl leading-none font-extrabold text-lime">{A.episodes}</span>
        <span className="text-[10px] font-bold text-white">episódios</span>
      </div>
      <span className="relative z-10 -mx-3 flex size-11 items-center justify-center rounded-full bg-ink font-display text-sm font-extrabold text-lime ring-4 ring-lime group-hover:animate-beat group-focus-visible:animate-beat">
        VS
      </span>
      <div
        style={float ? { animationDelay: "-1.5s" } : undefined}
        className={`${CARD} rotate-4 bg-white pl-6 group-hover:translate-x-1.5 group-hover:rotate-8 group-focus-visible:translate-x-1.5 group-focus-visible:rotate-8 ${float ? "animate-float" : ""}`}
      >
        <span className={`${LABEL} text-muted`}>{B.title}</span>
        <span className="inline-block font-display text-3xl leading-none font-extrabold text-lavender group-hover:animate-hop group-focus-visible:animate-hop">
          ?
        </span>
        <span className="text-[10px] font-bold text-muted">episódios</span>
      </div>
    </div>
  );
}
