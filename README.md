# aknewme

Jogo diário de adivinhar animes, no espírito do Wordle. Todo dia um anime novo em três modos:

- **Emoji** — 4 emojis que resumem o anime, com pistas liberadas a cada erro.
- **Opening** — 30 segundos da abertura (prévia oficial do Apple Music).
- **Pistas** — ano, estúdio, gênero, episódios e sinopse, revelados aos poucos.
- **Mais ou Menos** — modo infinito: qual anime tem mais episódios ou estreou antes; acertos seguidos rendem medalhas.

Ao vivo em **[aknewme.com](https://www.aknewme.com)**.

## Stack

- [Next.js 15](https://nextjs.org) (App Router, Server Components, Route Handlers, `ImageResponse` para OG dinâmico)
- TypeScript, [Tailwind CSS v4](https://tailwindcss.com) com tokens de tema em `src/app/globals.css`
- Redis (Vercel KV) para o contador de partidas; Vercel Analytics
- Deploy na Vercel

## Rodando

```bash
npm install
npm run dev        # http://localhost:3000
```

Nenhuma variável de ambiente é obrigatória. As opcionais estão em [`.env.example`](.env.example).

## Estrutura

```
src/app/          rotas (jogo, /api/played, /api/xpost, painel /plays)
src/components/   UI
src/lib/          regras do jogo (game.ts), sorteio diário, estatísticas, OG
src/data/animes/  catálogo de animes, um arquivo por época, juntados em index.ts
scripts/          utilitários: buscar prévias de openings, copiar emojis, checar dados
```

Decisões de código: arquivos de até 500 linhas, dados de anime só em `src/data/animes/`, comparação de palpites centralizada em `isCorrectGuess`/`normalize`, cores apenas pelos tokens do tema. Detalhes em [`CLAUDE.md`](CLAUDE.md).

## Adicionando um anime

Edite o arquivo da época em `src/data/animes/` (título, aliases, 4 emojis, 2 pistas, metadados, openings). Depois:

```bash
node scripts/check-data.mjs   # valida o catálogo
npm run openings              # busca prévias das aberturas que faltam
```

## Licença

[MIT](LICENSE). Os dados sobre animes (títulos, sinopses, aberturas) pertencem aos seus respectivos detentores.
