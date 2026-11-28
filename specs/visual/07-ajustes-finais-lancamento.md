# Ajustes finais do 1º lançamento

Estado: **pedido do dono, aprovado (28/11)**. Pedido pequeno: direto ao Dev, depois QA.

## 1. Tira vazia na direita (faixa da barra de rolagem)

- Hoje `html { scrollbar-gutter: stable }` (`src/app/globals.css`) reserva a faixa da barra mesmo quando a página não rola. Nessas páginas (ex.: `/friends` com poucos amigos) aparece uma tira branca vazia na direita, e o kanji de fundo (`Watermark`, `fixed inset-0`) é cortado nela: parece um "quadrado vazio".
- Tirar a reserva (`scrollbar-gutter: stable`). Manter a cor da barra (`scrollbar-color`) e o visual do Safari.
- Página que não rola: o fundo e o kanji vão até a borda direita, sem tira. Página que rola: a barra aparece como hoje.

## 2. "username" → "usuário" em todo texto que a pessoa vê

- Trocar "username"/"Username" por "usuário"/"Usuário" em todo texto visível e de acessibilidade: mensagens de erro, botões, rótulos, `aria-label`, títulos, textos vazios, `/privacy` e `/terms`. Manter o gênero e a concordância (o usuário, seu usuário, esse usuário).
- Exemplos: "Nenhum jogador tem esse usuário.", "O usuário tem de 3 a 20 caracteres: letras minúsculas, números ou _.", "Esse é o seu próprio usuário.", "Copiar usuário", "Escolher usuário", "Salvar usuário", "sem usuário ainda".
- Arquivos já achados: `AddFriendCard.tsx`, `EmptyFriends.tsx`, `FriendRow.tsx`, `FriendsPanel.tsx`, `HandleStep.tsx`, `InlineHandle.tsx`, `LoginCard.tsx`, `NeedHandle.tsx`, `NewRoom.tsx`, `useHandleCheck.ts`, `lib/handle.ts`, `ProfileDialog.tsx`, `AccountPage.tsx`, `header/SiteMenu.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`. Procurar também nas rotas de API e em qualquer outro texto visível.
- Não mudar nomes no código (variáveis, campos, rotas), nem comentários. Ajustar os testes que conferem esses textos.

## 3. Modo Pistas: cartão "Anime do dia" no roxo primary

- Em `CluesGame.tsx`, o cartão "Anime do dia" (o "? ? ?", "Vale agora", a barra de pontos) usa fundo `bg-ink`. Trocar para `bg-grape` (o roxo base dos botões, ver `visual/01`).
- Conferir contraste AA de tudo que fica em cima (lime, lavender, branco, barras `bg-white/15`). O degradê sobre a imagem quando o jogo termina continua como está, salvo se perder a leitura.

## Critérios de aceite

- F1. Página que não rola (ex.: `/friends` com 0 a 2 amigos), em 1280 e 375: sem tira vazia na direita; o kanji de fundo vai até a borda. Página que rola: barra lavanda como antes.
- F2. Nenhum "username" em texto visível ou de acessibilidade do site (busca em `src` só acha código/comentários); todas as mensagens de erro do adicionar amigo e do trocar usuário com "usuário".
- F3. Cartão "Anime do dia" do Modo Pistas com fundo `grape` rgb(75, 43, 214), textos com contraste ≥ 4,5:1 (texto grande ≥ 3:1).
- F4. `tsc` e `npm test` passam (Dev). QA: computador e celular, todos os critérios.

## Evidências (28/11)

- **1. Tira vazia:** saiu `scrollbar-gutter: stable` do `html` (`src/app/globals.css`); ficaram `scrollbar-color` (polegar lavanda, trilho transparente) e o visual do Safari (`::-webkit-scrollbar`). Mais nada no site usava a reserva.
- **2. "usuário":** 45 trocas de "username"/"Username" por "usuário"/"Usuário" em texto visível e de acessibilidade, em 16 arquivos: `AccountPage`, `AddFriendCard` (as 3 mensagens de erro e o `aria-label`), `EmptyFriends`, `FriendRow` ("Copiar usuário"), `FriendsPanel`, `HandleStep` ("Escolha/Trocar seu usuário", "Salvar usuário"), `InlineHandle`, `LoginCard`, `NeedHandle`, `NewRoom`, `useHandleCheck`, `header/SiteMenu`, `ProfileDialog`, `lib/handle.ts`, `/privacy` e `/terms` (nos termos, "remover um nome de usuário ofensivo", para não parecer remover a pessoa). Os testes de `scripts/check-handle.mjs` acompanham. Na busca em `src`, sobra só código e comentário: o campo `username` do perfil do Discord (`auth.ts`) e nomes como `copyUsername`. Fora do site, a mensagem do script de dev `seed-friends.mjs` (`--for <username>`) ficou.
- **3. "Anime do dia" (Pistas):** fundo `bg-ink` → `bg-grape` (rgb(75, 43, 214)) em `CluesGame.tsx`. Contraste no grape: lime 6,39:1 ("Anime do dia", o número), lavanda 5,46:1 ("Vale agora", "Cada pista que você abre tira 1 ponto."), branco 8,03:1 (título, "pts"). Na barra de pontos, o lime contra o segmento vazio (`bg-white/15`) fica em 4,64:1; ela é decorativa (`aria-hidden`), e o número está no texto. O degradê sobre a imagem no fim do jogo continua `from-ink`.
- **4. Checagens:** `npx tsc --noEmit` sem erros; `npm test` passa (check-replay 35, check-streak, check-catalog 5, check-hl 7, check-handle 6, check-pagination, check-live 2, check-races 3). Sem build, sem navegador e sem prints: F1 e F3 na tela ficam para o QA.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), branch `teste-login`, Redis local do QA e contas `qa_*` apagadas no fim (0 restantes). Sem prints. Medido em 1280×800 e 375×667. Os pedidos de /friends ficaram de fora daqui: são da spec 16.

- **F1:**
  - Em 1280, `/friends` com 0, 1 e 2 amigos não rola: `clientWidth` = largura da janela (1280), `scrollbar-gutter: auto` e o kanji de fundo vai até a borda (o fundo termina em 1280 px). Não sobra tira na direita.
  - Página que rola (home e `/terms`): a barra aparece (1265 px de conteúdo) com `scrollbar-color` lavanda rgb(217, 207, 252) e trilho transparente.
  - Em 375 a barra é sobreposta (celular), sem reserva, e não há rolagem lateral.
- **F2:**
  - Não aparece "username" em nenhum texto visível, `aria-label`, `title`, `alt`, `placeholder` ou `sr-only` destas telas: `/`, `/login`, passo 2, `/account`, `/friends` (vazia, com amigos e com erros), Menu, Meu perfil (editando), `/terms`, `/privacy`, `/support` e os jogos, com e sem conta. Na busca em `src`, sobram só código e comentários.
  - Adicionar amigo: "Usuário do amigo" (`aria-label`), "Nenhum jogador tem esse usuário.", "Esse é o seu próprio usuário.", "O usuário tem de 3 a 20 caracteres: letras minúsculas, números ou _.", "Vocês já são amigos.".
  - Troca: "Editar seu usuário", "Você só pode trocar seu usuário uma vez.", "Esse usuário não é permitido. Escolha outro." e "Você já usou sua troca de usuário. Agora só o suporte pode mudar.".
  - Passo 2: "Escolha seu usuário" e "Salvar usuário". Sem @: "sem usuário ainda" no Menu e em `/account`. No menu "⋯": "Copiar usuário". Em `/terms`: "nome de usuário ofensivo".
- **F3:**
  - O cartão "Anime do dia" do Pistas é `grape` rgb(75, 43, 214) em 1280 e 375.
  - Contrastes medidos: "Anime do dia" e "5pts" em lime 6,39:1; "? ? ?" e "pts" em branco 8,03:1; "Vale agora" e "Cada pista que você abre tira 1 ponto." em lavanda 5,46:1. Todos acima de 4,5:1.
  - No fim do jogo, a resposta continua em branco sobre o degradê.
- **F4:**
  - `tsc`, `npm test`, `check:data` e o build passam.
  - A bateria de segurança da API rodou de novo sem regressão. Os 2 ✗ conhecidos são do próprio teste: o contador por IP do limite de uso é dividido entre as contas do teste, e o convite vencido aparece no servidor de propósito, como diz a 15.

Aprovada pelo QA em 28/11/2026.
