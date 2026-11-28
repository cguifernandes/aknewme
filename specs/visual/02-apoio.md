# Mais visibilidade para "Apoiar o projeto"

Estado: **pedido do dono, aprovado (27/11)**, com base na análise do Produto. Textos em português.

## O que já existe

- Item "Apoiar o projeto" no menu.
- Card "Apoie o aknewme" na **3ª aba** do fim de jogo (`EndCard.tsx`), ao lado de "Segue no X". Quase ninguém chega a essa aba.

## Mudanças

1. **Medição primeiro:** contar cliques em "Apoiar" (fim de jogo, faixa da home e menu) no `/api/played`, como já é feito com "seguir" e "post", e mostrar no `/plays`. Sem isso não dá para saber se a mudança funcionou.
2. **Fim de jogo, aba do resultado, só depois de vitória:** uma **linha discreta**, não outro card grande, para não repetir o card da 3ª aba nem disputar com o resultado. Ex.: fundo `track`, ícone de coração, "Curtiu? O aknewme é feito por uma pessoa só." e o link "Apoiar" (estilo de link do projeto). Uma linha no computador; no celular pode quebrar em duas, sem empurrar os botões principais para fora da tela.
   - O card da 3ª aba continua (serve para quem não acertou).
3. **Faixa discreta no fim da home**, abaixo de "Mais jogos": uma linha centrada, sem card colorido, com o texto "O aknewme é gratuito e feito por uma pessoa só." e o link "Apoiar o projeto" → `/support`. Não pode aparecer acima dos jogos nem competir com eles.
4. **Duelos continua no cabeçalho** (é a entrada do recurso no computador).

## Critérios de aceite

- A1. Cliques em "Apoiar" contados por origem e visíveis no `/plays`.
- A2. Linha de apoio só na aba do resultado depois de vitória; não aparece em derrota; não duplica o card da 3ª aba na mesma tela.
- A3. Faixa da home abaixo de "Mais jogos", discreta, sem rolagem lateral em 375 px.
- A4. `tsc`, `npm test`, `npm run check:data`, `npm run build` passam.

## Feito (27/11)

- **Contagem:** `api/played` aceita `click: "support:end" | "support:home" | "support:menu"` (contadores `click:support:*` do dia). `trackClick` (`lib/follow.ts`) é chamado na linha do fim de jogo e no card da 3ª aba (os dois contam como "fim de jogo"), na faixa da home e no item do menu. O `/plays` ganhou a coluna "Apoiar" na tabela "Dia a dia" (total e "fim · home · menu"); `npm run plays` também mostra.
- **Fim de jogo e home:** `SupportLine.tsx` (`from="end"`: linha com fundo track e coração, só com `won`; `from="home"`: faixa centrada, último item da home).
- **Conferido no navegador** (build de produção, Redis de teste, sem prints) em 1280x800, 375x812 e 375x667: vitória mostra a linha (32 px de altura no computador, 48 px em duas linhas no celular), derrota não; o card "Apoie o aknewme" segue só na 3ª aba; a janela, a rolagem e as bolinhas do carrossel ficam no mesmo lugar com e sem a linha (a altura é a da aba mais alta); faixa da home abaixo de "Mais jogos", sem fundo, sem rolagem lateral; os três cliques mandam a origem certa e levam a `/support`; Duelos segue no cabeçalho no computador.
- `tsc`, `npm test`, `check:data` e build passam.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), Redis local só do QA. Sem prints. Medido em 1280 e 375.

- **A1:**
  - Os cliques mandam a origem certa: `support:home` (faixa da home), `support:end` (linha do fim de jogo) e `support:menu` (Menu). Os três levam a `/support`.
  - O Redis guarda `click:support:*` por dia.
  - O `/plays` (com a chave local do QA) mostra a coluna "Apoiar" com "4 fim 2 · home 1 · menu 1". Com chave errada, dá 404.
- **A2:**
  - Depois de vitória, a aba do resultado tem a linha "Curtiu? O aknewme é feito por uma pessoa só." com "Apoiar": fundo `track`, coração, 32 px no computador e 48 px no celular (2 linhas).
  - Depois de derrota, a linha não aparece.
  - O card "Apoie o aknewme" continua só na 3ª aba.
- **A3:** a faixa "O aknewme é gratuito e feito por uma pessoa só." com "Apoiar o projeto" fica abaixo de "Mais jogos", como último item, sem fundo e sem rolagem lateral.
- **A4:** `tsc`, `npm test`, `check:data` e o build passam.

Aprovada pelo QA em 28/11/2026.
