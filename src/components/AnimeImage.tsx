"use client";

import { useState } from "react";
import type { Anime } from "@/data/animes";

/** Larguras em que cada tipo existe em public/animes/ — as mesmas de scripts/fetch-images.mjs (WIDTHS). */
const WIDTHS = { wide: [384, 828, 1200], cover: [128, 256] };

/**
 * Imagem de um anime, preenchendo o pai — que precisa ser `relative`.
 *
 * Os arquivos ficam em public/animes/ (WebP, alguns tamanhos por imagem), baixados e convertidos no build por
 * scripts/fetch-images.mjs a partir dos links de src/data/animes/mal.ts. O navegador escolhe o tamanho pelo
 * `sizes`. Se o arquivo local faltar (download que falhou no build), cai no link original; se nem ele
 * carregar, a imagem some — o pai deve ter uma cor de fundo que funcione sem ela.
 *
 * REGRA: fora do Mais ou Menos, só depois da resposta — antes disso a imagem é spoiler.
 *
 * `wide` = banner deitado; `cover` = capa em retrato (miniaturas quadradas e redondas).
 * Enquanto carrega, um esqueleto pulsando ocupa o lugar; pronta, a imagem surge esmaecendo.
 *
 * ATENÇÃO ao `sizes`: a imagem é recortada (object-cover), então o que manda é o lado que ela precisa
 * cobrir. Um banner (proporção ~4,75:1) numa caixa de 400×200 precisa de ~950px de largura, não 400 —
 * pedir menos estica a imagem e ela fica borrada.
 */
export default function AnimeImage({
  anime,
  kind = "wide",
  sizes,
  className = "",
}: {
  anime: Anime;
  kind?: "wide" | "cover";
  /** Largura de que a imagem precisa (ver ATENÇÃO acima), no formato do atributo `sizes` (ex.: "64px", "828px"). */
  sizes: string;
  className?: string;
}) {
  /** local = arquivo do build; remote = link original (reserva); none = nenhum carregou. */
  const [source, setSource] = useState<"local" | "remote" | "none">("local");
  const [loaded, setLoaded] = useState(false);
  const mal = anime.mal;
  // sem capa própria, a miniatura usa a imagem deitada (e os arquivos dela)
  const file = kind === "cover" && mal?.cover ? "cover" : "wide";
  const remote = file === "cover" ? mal?.cover : mal?.image;
  if (!mal || !remote || source === "none") return null;
  const local = (w: number) => `/animes/${mal.id}-${file}-${w}.webp`;
  return (
    <>
      {!loaded && <span aria-hidden="true" className="absolute inset-0 animate-pulse bg-lavender/40" />}
      {/* eslint-disable-next-line @next/next/no-img-element -- já vem no tamanho e formato certos do build */}
      <img
        key={source}
        src={source === "local" ? local(WIDTHS[file].at(-1)!) : remote}
        srcSet={source === "local" ? WIDTHS[file].map((w) => `${local(w)} ${w}w`).join(", ") : undefined}
        sizes={source === "local" ? sizes : undefined}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        // imagem que já estava pronta antes de o React assumir a página não dispara onLoad
        ref={(el) => {
          if (el?.complete && el.naturalWidth > 0) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setSource(source === "local" ? "remote" : "none")}
        // capa (retrato) recortada: fica a parte de cima, onde costumam estar os rostos
        className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${loaded ? "" : "opacity-0"} ${remote.includes("/banner/") ? "" : "object-[50%_22%]"} ${className}`}
      />
    </>
  );
}

/**
 * Arte de um resultado, cobrindo o pai: um anime = o banner; vários (os 5 do Modo Emoji) = as capas lado a lado.
 */
export function AnimeArt({ animes, sizes }: { animes: Anime[]; sizes: string }) {
  const many = animes.length > 1;
  return (
    <div aria-hidden="true" className="absolute inset-0 flex">
      {animes.map((a) => (
        <div key={a.title} className="relative min-w-0 flex-1">
          <AnimeImage anime={a} kind={many ? "cover" : "wide"} sizes={many ? "256px" : sizes} />
        </div>
      ))}
    </div>
  );
}
