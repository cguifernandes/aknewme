# Duelos salvos na conta e paginação no banco

Estado: **aprovado pelo dono (27/11)**.

## 1. Duelos por link salvos na conta, com placar validado

Hoje: o duelo por link guarda o placar no navegador; o servidor (Redis) aceita o resultado pronto que o navegador manda (dá para inventar placar). Quem joga logado no PC não vê o duelo no celular.

Novo, **para quem está logado**:
- Tabela `link_duels` no Neon: id do link/desafio, modo, dia, quem desafiou (user_id), quem respondeu (user_id), as jogadas de cada um, o placar de cada um calculado no servidor, quando terminou. Só ids e jogadas; cascata na exclusão da conta de qualquer um dos dois.
- **Placar validado:** o servidor recalcula o resultado a partir das jogadas com a mesma regra do jogo (`src/lib/replay.ts`, que já existe e foi usado nas salas) e grava só o recalculado. Resultado que não bate é recusado (409). Vale também para o desafiante (o placar dele que vai no link é conferido pelas jogadas dele).
- A janela "Duelos" (e o placar por rival), logado, lê do servidor: aparece igual no PC e no celular. Rival identificado pela conta quando os dois estão logados; quando o outro lado não tem conta, fica pelo apelido, ligado à conta de quem está logado.
- Duelo com um lado sem conta: o lado logado guarda na conta; o lado sem conta continua como hoje (navegador + Redis).
- **Sem conta:** nada muda (navegador + Redis, como hoje), e o aviso "Partidas e duelos ficam neste navegador" continua só para quem está sem conta. Logado, o título volta a "Duelos".

## 2. Paginação no banco

- `GET /api/friends?list=friends&page=N` e `?list=incoming&page=N`: o servidor devolve só os 10 itens da página e o total (`LIMIT/OFFSET`, ordem estável: quem tem duelo hoje primeiro e depois username; pedidos por data e username). Pedidos enviados: até 10, com página se passar disso.
- O componente `Pagination` continua igual; troca só a fonte dos dados. Ao mudar de página, mostra o Loading do projeto só na lista.
- Aceitar/recusar/remover atualizam a página atual (e voltam para a anterior se ela ficar vazia).

## Duelos feitos antes do login (decidido, 27/11)

- **Não importar** para a conta (as jogadas do navegador podem ser editadas; o placar não seria verificável).
- Na tela de login, **só se houver duelos locais**, um aviso discreto acima dos botões Google e Discord, sem confirmação: "Os duelos que você jogou sem conta ficam neste navegador e não entram na sua conta."
- Os duelos locais não são apagados: deixam de aparecer na janela "Duelos" enquanto a pessoa está logada e voltam ao sair.

## Critérios de aceite

- D1. Logado no PC, duelo jogado aparece na janela "Duelos" no celular (mesma conta).
- D2. Placar enviado que não bate com as jogadas é recusado; nada é gravado.
- D3. Excluir conta apaga os duelos dela.
- D4. Sem conta, o duelo funciona igual a hoje.
- P1. A primeira carga de `/friends` não traz a lista inteira: só a página 1 e o total.
- P2. Trocar de página busca só aquela página; ações na lista atualizam a página certa.
- `tsc`, `npm test`, `npm run check:data`, `npm run build` passam. Migração nova aplicada no `teste-login`; avisar o que rodar no banco principal antes do deploy.

## Feito (27/11)

- **Banco:** migração `007_link_duels.sql` (aplicada só no `teste-login`). Tabela `link_duels`: uma linha por jogador logado em cada duelo (desafiante ou quem respondeu), com o id do link, modo, dia, código do jogador no navegador, nome, jogadas e o placar recalculado (`{ won, score, tiles }`). Quem respondeu guarda também quem desafiou como veio no link e, se o desafiante tem conta, `rival_id`. Cascata: excluir a conta apaga as linhas dela e as linhas ligadas a ela (`rival_id`).
- **Servidor:** `src/lib/linkDuels.ts` e `/api/link-duels`. `POST` refaz a partida com `replay` e só grava o recalculado; placar que não bate: 409 `mismatch`, nada gravado (vale para o desafiante e para quem respondeu); só o desafio de hoje (±1 dia), uma vez por duelo (409 `exists`), nada contra si mesmo (409 `self`). `GET` devolve os duelos da conta (60 dias): rivais com conta pela linha deles (placar conferido); quem respondeu sem conta, pelas respostas do Redis, sem repetir quem já está na conta.
- **Navegador:** `src/lib/accountDuels.ts`. Logado, o `ChallengeButton` (fim de jogo, janela de Desafiar e "Chamar pro duelo") salva a partida do desafiante depois de copiar/compartilhar (sem atrasar o menu do celular), e o fim de jogo aberto por um link salva a de quem respondeu (e manda o nome da conta para o Redis). A janela "Duelos" logada lê só da conta (`accountRivals`): título "Duelos", sem o aviso do navegador; sem conta, tudo como antes ("Duelos deste aparelho" + aviso). Os duelos do navegador não são apagados: voltam ao sair.
- **Duelos antes do login:** não entram na conta. Na tela de login, só se houver duelos neste navegador: "Os duelos que você jogou sem conta ficam neste navegador e não entram na sua conta." (`hasLocalDuels`).
- **Paginação no banco:** `GET /api/friends[?fp=N&op=N]` devolve só a página (10) dos amigos e dos enviados, com os totais, e a quantidade de recebidos; `?list=friends|incoming|outgoing&page=N` devolve uma página. Ordem estável: amigos por username; pedidos por data e username. `/friends` busca só a página pedida, com Loading só na lista; ações recarregam a página atual e, se ela ficar vazia, voltam para a anterior (`usePage`). "Pedidos enviados" ganha paginação se passar de 10. A tela de nova sala (desligada) passa a receber só a primeira página de amigos.
- **Conferido** (build de produção, contas de teste no teste-login, apagadas: 0 contas e 0 duelos de teste no fim; massa da @guiizitos recriada): D1 A desafia logado e B responde logado; A num navegador vazio, a 375 px, vê o duelo com Bia na janela "Duelos". D2 placar inventado (desafiante: 409; respondente com jogadas que não terminam a partida: 400) e nada gravado. D3 excluir a conta de A apaga os duelos dela e o de B ligado a ela. D4 sem conta, o link sai com o apelido e nada chama `/api/link-duels`. Aviso no login só com duelos locais. P1 a 1ª carga traz 10 amigos, total 30, 12 recebidos e 5 enviados, numa chamada só; P2 página 3 busca só ela (com Loading na lista), remover lá recarrega a página 3 (9, total 29), e os pedidos da página 2, respondidos, voltam para a página 1. `tsc`, `npm test`, `check:data` e build passam.
- **Antes do deploy, no banco principal:** `npm run db:migrate` (aplica 003 a 007).

## Janela "Duelos": sem rival e "Chamar pro duelo" (dono, 27/11)

- Sem nenhum rival, a coluna da esquerda não tem mais o botão "Desafiar um amigo": só "Você ainda não tem duelos. Desafie alguém e o placar aparece aqui." Com rivais, o botão continua (rola até o "Chamar pro duelo" e leva o foco ao primeiro cartão).
- O "Chamar pro duelo" usa o mesmo componente da janela de Desafiar da tela de Amigos (`ChallengeModes`, extraído do `ChallengeDialog`): um cartão por modo de hoje; jogado → "como <nome> ✏️" e o botão de desafiar/copiar; não jogado → leva para jogar; sem conta, pede o apelido do jeito do `ChallengeButton`. O campo "Como seu amigo vai te ver" saiu.
- Conferido em 1280 e 375, logado e deslogado: sem rivais, sem o botão e com o aviso; 3 cartões; sem conta, o cartão do Pistas pede o apelido; sem rolagem lateral.

## Aviso de duelos locais em caixinha (dono, 27/11)

- O aviso da tela de login deixou de ter o estilo do subtítulo: virou uma caixinha discreta (fundo `track`, cantos de 12 px, padding 10 × 12 px) com o ícone `faCircleInfo` em `grape` à esquerda e o texto em `ink`, 13 px (o subtítulo tem 16 px): "Duelos jogados sem conta ficam só neste navegador." Continua só quando há duelos neste navegador.
- Espaço: 32 px entre o subtítulo e a caixinha (antes 28, colado como um bloco só de texto) e 28 px entre a caixinha e os botões (antes 12).
- Conferido no navegador (build de produção) em 1280 e 375: com duelos locais, a caixinha com fundo rgb(237, 232, 255), ícone circle-info rgb(75, 43, 214) à esquerda, texto rgb(29, 13, 102) a 13 px, 28 px até os botões, sem rolagem lateral; sem duelos locais, sem caixinha. `tsc` e build passam.

## Cartões de modo: "Jogue agora" (dono, 27/11)

- No modo ainda não jogado, o botão do cartão (`ChallengeModes`) virou o lime `LIME_DARKEN` com "Jogue agora" e a seta; saiu o "Ainda não jogou hoje" (o botão já diz). Conferido: os 3 cartões sem jogo com "Jogue agora" lime levando a /emoji, /opening e /clues.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), branch `teste-login`, Redis local do QA e contas `qa_*` apagadas no fim (0 restantes). Sem prints. Medido em 1280 e 375.

- **D1:** Ana desafia e Bia responde, as duas logadas. Num navegador vazio, na outra largura (1280 → 375 e 375 → 1280), a janela "Duelos" de Ana mostra o duelo com Bia ("1 x 0", "Você lidera").
- **D2:** placar inventado, de quem desafia e de quem responde, dá 409, e nada é gravado.
- **D3:** excluir a conta apaga os duelos dela e os ligados a ela (`rival_id`).
- **D4:** sem conta, `/api/link-duels` dá 401 e o duelo segue pelo navegador.
- **Mais regras do servidor:**
  - Responder de novo dá 409 `exists`; responder o próprio duelo dá 409 `self`.
  - Desafiante único por duelo (migração 011).
- **Janela Duelos:**
  - Logada: título "Duelos" sem o aviso do navegador e Skeleton enquanto carrega.
  - Sem conta: "Duelos deste aparelho" + "Partidas e duelos ficam neste navegador."
  - Sem rival: "Você ainda não tem duelos. Desafie alguém e o placar aparece aqui.", sem o botão.
  - "Chamar pro duelo" tem 3 cartões, com "Jogue agora" para `/emoji`, `/opening` e `/clues`. Sem conta e com o jogo feito, pede o apelido.
  - O acordeão mostra "Pistas #203", "Hoje, HH:MM", "1 x 0" e "Venceu".
- **Login:**
  - A caixinha só aparece com duelos locais: fundo `track` rgb(237, 232, 255), ícone circle-info, 13 px e 28 px até os botões.
  - Sem duelos locais, não aparece. Sem rolagem lateral.
- **P1 e P2:**
  - A 1ª carga traz 10 amigos e o total (23), sem `/api/friends` no navegador.
  - A página 3 busca só ela, com o Loading na lista e sem pular a altura.
  - Página estranha (−5) vira 1.
  - Os pedidos recebidos têm 2 itens na página 2, de um total de 12.
- `tsc`, `npm test`, `check:data` e o build passam.

Aprovada pelo QA em 28/11/2026.
