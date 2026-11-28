# aknewme

Jogo diário de adivinhar animes (emoji / opening / pistas). Next.js 15 App Router + Tailwind v4 + TypeScript.

## Regras

- **Máximo 500 linhas por arquivo.** Se um arquivo `.ts`/`.tsx` passar de 500 linhas, extraia partes para componentes/módulos menores em `src/components/` ou `src/lib/` até ficar abaixo do limite.
- Animes, emojis e pistas ficam só em `src/data/animes/` (um arquivo por época, juntados em `index.ts`) — nunca hardcode dados de anime em componentes.
- Comparação de palpites sempre via `isCorrectGuess`/`normalize` de `src/lib/game.ts`.
- Cores apenas pelos tokens do tema em `src/app/globals.css` (grape, lime, lavender, ink...) — sem hex solto em componentes.
- **Todo o texto do site é em português**: interface, títulos de página, metadados (`lang="pt-BR"`), mensagens de erro e textos de acessibilidade. **Só as rotas** das páginas ficam em inglês (ex.: `/terms`, `/privacy`, `/login`).
- Usar as fontes do layout (`font-display`, `font-sans`, `font-kana`) e os componentes que já existem (ex.: `ChallengeButton`, `CloseButton`, `ui.tsx` da conta). Não criar fonte, cor ou botão novo se já houver um equivalente.

## Padrões visuais

- **Botão lime = `LIME_DARKEN`** (`src/components/buttons.ts`): todo botão ou link com fundo lime usa `bg-lime text-ink sweep-lime-deep` (o lime-deep entra da esquerda para a direita no hover/foco, o texto continua ink). Sem `sweep-white`, `sweep-ink` nem `hover:bg-*` em fundo lime, e sem `transition-colors` no mesmo elemento (ele anula a transição do sweep). O foco visível (`focus-visible:outline-*`) continua em cada botão.

## Desenvolvimento por SDD (Spec-Driven Development)

- Funcionalidade nova (tela, API, integração, mudança de regra) começa em `specs/<funcionalidade>/`, antes do código. Índice e ordem em `specs/README.md`.
- Ordem: requisitos → UX (protótipo) → segurança → tarefas → código → evidências.
- Sem spec aprovada pelo dono, não se escreve código da funcionalidade. Mudou a regra? Atualize a spec primeiro.
- Nada de commit, push ou deploy sem pedido explícito do dono.
- Segredos só em variáveis de ambiente (nomes em `.env.example`). Nunca no repositório.
