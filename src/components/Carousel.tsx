"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Uma tela do carrossel. `content` pode ser uma função: recebe `go(i)`, que pula para a tela i, e se a tela está à mostra. */
export type Slide = { label: string; content: ReactNode | ((go: (i: number) => void, active: boolean) => ReactNode) };

/**
 * Carrossel de telas no mesmo espaço: troca sozinho a cada `interval`, em volta infinita, e as bolinhas embaixo
 * trocam na hora. Todas as telas ficam empilhadas na mesma célula, então a altura é a da maior e nada pula.
 * Não troca com o mouse em cima nem com alguém digitando; depois de um toque ou clique, espera o dobro.
 * Quem pede movimento reduzido troca só pelas bolinhas.
 */
export default function Carousel({
  slides,
  interval = 5000,
  onChange,
  hold,
}: {
  slides: Slide[];
  interval?: number;
  /** Trava nesta tela: vai para ela e para de trocar sozinho (as bolinhas continuam funcionando) */
  hold?: number;
  /** Chamada com o número da tela à mostra, sempre que ela muda */
  onChange?: (index: number) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [hover, setHover] = useState(false);
  const [typing, setTyping] = useState(false);
  /** Cada toque/clique dentro recomeça a espera (e a dobra): ninguém perde a tela no meio de uma ação */
  const [touched, setTouched] = useState(0);
  const index = current % slides.length; // a lista pode encolher (ex.: tela que só existe no desafio do dia)
  useEffect(() => onChange?.(index), [index, onChange]);

  useEffect(() => {
    if (hold !== undefined || hover || typing || slides.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setCurrent((n) => (n + 1) % slides.length), touched ? interval * 2 : interval);
    return () => clearTimeout(id);
  }, [index, hover, typing, touched, slides.length, interval, hold]);

  useEffect(() => {
    if (hold !== undefined) setCurrent(hold);
  }, [hold]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onPointerDown={() => setTouched((n) => n + 1)}
      onFocus={(e) => setTyping(e.target instanceof HTMLInputElement)}
      onBlur={() => setTyping(false)}
    >
      <div className="grid flex-1">
        {slides.map((s, i) => (
          <section
            key={s.label}
            aria-label={s.label}
            inert={i !== index}
            className={`col-start-1 row-start-1 flex min-w-0 flex-col transition-opacity duration-300 ${i === index ? "" : "pointer-events-none opacity-0"}`}
          >
            {typeof s.content === "function" ? s.content(setCurrent, i === index) : s.content}
          </section>
        ))}
      </div>
      {slides.length > 1 && (
        // o botão é a área de toque (32px de altura, encostada na vizinha, sem sobrepor); a bolinha é só o desenho dentro.
        // Área maior por pseudo-elemento se sobrepunha à da bolinha ao lado e o clique caía na errada.
        <div className="mt-1 -mb-3 flex justify-center">
          {slides.map((s, i) => (
            <button
              key={s.label}
              type="button"
              aria-label={s.label}
              aria-current={i === index}
              onClick={() => setCurrent(i)}
              className="group flex h-8 items-center rounded-full px-1 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-grape"
            >
              <span
                className={`h-2 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-grape" : "w-2 bg-lavender group-hover:bg-grape/50"}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
