"use client";

import { useState } from "react";

// Mesmo cálculo de scripts/copy-emoji.mjs: codepoints em hex, sem o seletor FE0F.
const keyOf = (e: string) =>
  [...e].map((c) => c.codePointAt(0)!.toString(16)).filter((h) => h !== "fe0f").join("-");

/** Emoji no estilo iOS (imagem em /public/emoji). Sem imagem, cai no emoji nativo. */
export function Emoji({ e }: { e: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{e}</>;
  return (
    <img
      src={`/emoji/${keyOf(e)}.png`}
      alt={e}
      draggable={false}
      onError={() => setFailed(true)}
      className="inline-block size-[1em] align-[-0.125em]"
    />
  );
}

const PICTO = /\p{Extended_Pictographic}/u;

/** Texto com os emojis trocados pela versão iOS. */
export function EmojiText({ text }: { text: string }) {
  const graphemes = new Intl.Segmenter("pt-BR", { granularity: "grapheme" }).segment(text);
  return (
    <>
      {[...graphemes].map(({ segment }, i) =>
        PICTO.test(segment) ? <Emoji key={i} e={segment} /> : segment,
      )}
    </>
  );
}
