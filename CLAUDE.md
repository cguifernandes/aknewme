# aknewme

Jogo diário de adivinhar animes (emoji / opening / pistas). Next.js 15 App Router + Tailwind v4 + TypeScript.

## Regras

- **Máximo 500 linhas por arquivo.** Se um arquivo `.ts`/`.tsx` passar de 500 linhas, extraia partes para componentes/módulos menores em `src/components/` ou `src/lib/` até ficar abaixo do limite.
- Animes, emojis e pistas ficam só em `src/data/animes/` (um arquivo por época, juntados em `index.ts`) — nunca hardcode dados de anime em componentes.
- Comparação de palpites sempre via `isCorrectGuess`/`normalize` de `src/lib/game.ts`.
- Cores apenas pelos tokens do tema em `src/app/globals.css` (grape, lime, lavender, ink...) — sem hex solto em componentes.
