# /friends: "Pedidos de amizade" sempre aberto

Estado: **pedido do dono, aprovado (28/11)**. Substitui o acordeão "Pedidos · N" (10-amigos.md e 14). Direto ao Dev, depois QA.

Referências do dono:
- Visual com pedidos: `C:\Users\cguifernandes\OpenBot\Shared\Transfers\d830724f-c285-4f84-a097-2a28570c3cfa\image-2.png`
- Sem pedidos: `...\d830724f-c285-4f84-a097-2a28570c3cfa\image-3.png` (sem o botão "Copiar meu link")
- Como está hoje: `...\d830724f-c285-4f84-a097-2a28570c3cfa\image.png`

## 1. Com pedidos

- Sem acordeão: a seção fica sempre aberta, sem a seta e sem o botão de abrir/fechar.
- Cartão da seção com **fundo branco** (`bg-paper`), na mesma borda de hoje (`border-2 border-track`, `rounded-3xl`).
- Título "Pedidos de amizade" (`font-display`, extrabold, `text-ink`) e, ao lado, a quantidade numa bolinha `bg-grape` com o número branco (como no print). Leitor de tela: "Pedidos de amizade, N".
- Lista em grade: 2 colunas no computador, 1 no celular. Cada pedido é um cartão branco com borda `track`, em uma linha: avatar, nome e @ (em `grape`), uma linha pequena embaixo e os botões à direita.
- Linha pequena: só "pediu há X". Sai "N amigos em comum" e "jogando desde": nada de dizer de quem a pessoa é amiga.
- Botões:
  - **Aceitar**: igual ao "Duelar" da lista de amigos (o `PILL` do `FriendRow`: `border-track bg-paper text-ink sweep-lime`). `aria-label` "Aceitar o pedido de @x". Spinner enquanto aceita.
  - **Recusar**: bolinha igual ao "⋯" dos amigos (`bg-grape`, branco, `hover:bg-grape-deep`, `size-11` no celular e `sm:size-9`), com o ícone de X (`faXmark`). `aria-label` "Recusar o pedido de @x". Spinner enquanto recusa.
  - Enquanto um responde, os dois botões daquela linha ficam desativados.
- No celular os botões não podem empurrar a tela para o lado: o nome e o @ cortam com "…" antes disso.
- Paginação de 10 por página, embaixo da grade, como hoje. Ao responder, a pessoa sai da lista na hora e a página vem de novo (se ficar vazia, volta para a anterior).

## 2. Carga na abertura da página

- A 1ª página de pedidos recebidos (até 10) vem junto com a 1ª carga do servidor (`app/friends/page.tsx` → `friendLists`) e no `/api/friends` sem `list` (que o painel usa ao recarregar). Ao abrir /friends os pedidos já aparecem, sem "Carregando..." e sem clique.
- Trocar de página continua por `/api/friends?list=incoming&page=N`, com o Loading por cima da grade (sem pular de altura).
- Se não for mais usado, parar de calcular "amigos em comum" e "jogando desde" para os pedidos.

## 3. Sem pedidos

- Em vez da seção, uma faixa só (como `image-3.png`): borda tracejada (`border-2 border-dashed`, tom `track`/`lavender`), `rounded-3xl`, fundo transparente/branco, uma linha com **"Nenhum pedido novo"** (bold, `text-ink`) e, ao lado, "Quando alguém te adicionar, aparece aqui." (`text-muted`, menor). No celular, o texto pode quebrar em duas linhas.
- **Sem** botão "Copiar meu link".

## Critérios de aceite

- P1. Ao abrir /friends com pedidos, a grade já aparece aberta, sem clique e sem "Carregando..."; não há acordeão.
- P2. Seção branca, título "Pedidos de amizade" com a bolinha grape da quantidade; cartões em 2 colunas no computador e 1 no celular (375 px, sem rolagem lateral).
- P3. Cada pedido mostra avatar, nome, @ e só "pediu há X"; nada de amigos em comum nem "jogando desde".
- P4. "Aceitar" com o visual do "Duelar"; recusar com a bolinha grape de X, igual ao "⋯"; ambos com `aria-label`, spinner e foco visível; aceitar e recusar funcionam e atualizam a lista e a quantidade.
- P5. Com 0 pedidos: só a faixa tracejada "Nenhum pedido novo · Quando alguém te adicionar, aparece aqui.", sem botão.
- P6. Mais de 10 pedidos: paginação funciona, a página troca com Loading por cima e responder o último da página volta para a anterior.
- P7. `tsc` e `npm test` passam (Dev). QA: computador e celular, todos os critérios, estados (vazio, erro ao responder, sem rede) e as rotas de `/api/friends` só com a sessão do dono dos pedidos.

## Evidências (28/11)

- **Seção (`account/IncomingRequests.tsx`, reescrita):** sem acordeão. Cartão `bg-paper` com `border-2 border-track` e `rounded-3xl`; título "Pedidos de amizade" com a bolinha `bg-grape` da quantidade (leitor de tela: "Pedidos de amizade, N"); grade `sm:grid-cols-2`. Cada cartão tem avatar, nome e @ (cortam com "…"), "pediu há X" e, à direita, "Aceitar" (o `PILL` do `FriendRow`, `border-track bg-paper text-ink sweep-lime`) e a bolinha grape de X (`size-11 sm:size-9`, `hover:bg-grape-deep`, `faXmark`). Os dois têm `aria-label`, spinner e foco visível e ficam desativados enquanto um responde. Quem foi respondido sai na hora. Paginação de 10 embaixo; trocar de página busca `list=incoming` com o Loading por cima da grade.
- **Sem pedidos:** só a faixa `border-2 border-dashed border-lavender` com "Nenhum pedido novo" e "Quando alguém te adicionar, aparece aqui.", sem botão.
- **Carga:** `friendLists` (`lib/friends.ts`) traz também a página de pedidos recebidos (`incoming`, `incomingCount`, `incomingPage`), na 1ª carga do servidor (`app/friends/page.tsx`) e no `/api/friends?fp&op&ip` que o painel usa ao recarregar (o painel manda a página que a seção mostra). Saíram os cálculos de "amigos em comum" e "jogando desde" dos pedidos.
- **Checagens:** `npx tsc --noEmit` sem erros; `npm test` passa (check-replay 35, check-streak, check-catalog 5, check-hl 7, check-handle 6, check-pagination, check-live 2, check-races 3). Consulta no `teste-login` (só leitura) com a massa da @guiizitos: 12 pedidos, 10 na página 1 e 2 na página 2, só com id, @, nome, imagem e data do pedido. Sem build, navegador e prints: P1–P6 na tela ficam para o QA.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), branch `teste-login` com contas `qa_*` próprias (12 pedidos, um com nome bem comprido, mais um amigo em comum de verdade). A massa da @guiizitos não foi usada nem alterada. Contas apagadas no fim (0 restantes). Sem prints. Medido em 1280×800 e 375×667. Comparado com `image-2.png` e `image-3.png`; quando o print e a spec diferem, vale a spec (o print tem "Aceitar" lime e "Copiar meu link").

- **P1:**
  - 250 ms depois de abrir `/friends`, a grade já tem os 10 pedidos.
  - Sem "Carregando", sem acordeão (`aria-expanded`) e sem nenhuma chamada a `/api/friends`: vem na 1ª carga do servidor.
- **P2:**
  - Seção branca rgb(255, 255, 255), borda `track` e cantos de 24 px.
  - Título "Pedidos de amizade" com a bolinha grape e o número branco. O número visível tem `aria-hidden` e o leitor de tela ouve ", 12".
  - 2 colunas em 1280 e 1 em 375, sem rolagem lateral.
  - O nome comprido corta com "…" sem empurrar os botões.
- **P3:** cada pedido mostra avatar, nome, @ e só "pediu há X". Não aparece "em comum" nem "jogando desde", mesmo com amigo em comum de verdade. A API devolve só `id`, `handle`, `name`, `image` e `askedAt`.
- **P4:**
  - "Aceitar" tem fundo branco, borda `track` e o sweep lime no hover; altura de 36 px no computador e 44 px no celular, como o "Duelar".
  - Recusar é a bolinha grape com X, 36 px ou 44 px, com hover `grape-deep` rgb(58, 28, 184).
  - Os dois têm `aria-label` ("Aceitar/Recusar o pedido de @x") e foco visível.
  - Respondendo (com a resposta atrasada de propósito): spinner no botão clicado e os dois da linha desativados.
  - Aceito vira `accepted` e entra em "Seus amigos"; recusado é apagado. A bolinha atualiza na hora.
- **P5:** com 0 pedidos, só a faixa tracejada (`dashed`, lavanda) "Nenhum pedido novo · Quando alguém te adicionar, aparece aqui.", sem botão e sem rolagem lateral.
- **P6:**
  - A página 2 busca só `list=incoming&page=2`. O Loading fica por cima da grade (30% de opacidade) sem mudar a altura (388 px em 1280, 903 px em 375).
  - Aceitar na página 2 tira o pedido na hora (bolinha 11). Recusar o último da página 2 volta para a página 1 (10 pedidos, bolinha 10, sem paginação).
- **Estados:**
  - Erro ao responder (500): o pedido fica e aparece "Não deu certo. Tente de novo." em `role=alert`.
  - Sem rede: o pedido fica e aparece "Sem conexão. Recarregue a página para tentar de novo.".
- **P7 / segurança:**
  - Sem sessão, `/api/friends`, `?ip=2`, `?list=incoming` e `?list=incoming&page=2` dão 401.
  - Outra conta só vê os próprios pedidos (0), nunca os da dona. Também não aceita pedido feito para ela (404).
  - Aceitar vindo de outra origem dá 403. `?ip=2` traz a página 2 junto da carga. Página estranha vira 1.
  - A bateria de segurança da API rodou de novo sem regressão.
- `tsc`, `npm test`, `check:data` e o build passam.

Aprovada pelo QA em 28/11/2026.
