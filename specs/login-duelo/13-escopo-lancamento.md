# Escopo do próximo lançamento: conta e amigos, sem salas

Estado: **decisão do dono (27/11)**.

## Entra

- Login (Google e Discord), username, perfil, estatísticas, excluir conta.
- Amigos: adicionar pelo username, pedidos (aceitar/recusar/cancelar), remover, notificações de pedido e de aceite.
- **Desafiar um amigo** a partir da lista de amigos, do jeito mais simples: o mesmo desafio do fim de jogo (duelo por link).

## Sai (por enquanto)

- **Salas de duelo** inteiras: criar sala (`/room/new`), a sala (`/room/[id]`), "Salas de hoje" (em `/friends` e no painel da conta), "Desafiar em outro modo", "Voltar para a sala" no fim de jogo e as notificações de convite e de "terminou a sala".
- **Placar "x × y nos duelos"** da lista de amigos: ele vinha só das salas (`duel_wins`); sem salas, não há de onde vir. Sai da lista.
- O código e as tabelas das salas ficam no repositório, desligados por uma chave única (`ROOMS_ENABLED = false`), para poder voltar depois. Com a chave desligada: rotas `/room/*` e `/api/duels/*` respondem 404, nada de sala aparece na interface e nenhuma notificação de sala é criada.

## "Desafiar" na lista de amigos

- O botão "Desafiar" abre o mesmo fluxo de desafio do fim de jogo (janela com a aba de desafiar), não uma sala:
  - mostra os modos do dia (Emoji, Opening, Pistas); para cada um, se a pessoa **já jogou hoje**, o botão gera e copia o link do duelo com o nome da conta (como no fim de jogo); se **ainda não jogou**, leva para jogar esse modo, e o desafio é feito no fim do jogo;
  - o link é o duelo por link que já existe (o amigo abre e joga o mesmo desafio).
- O menu "⋯" do amigo fica com "Copiar username" e "Remover amigo".

## Critérios de aceite

- L1. Nenhuma tela mostra sala de duelo; `/room/*` e `/api/duels/*` dão 404.
- L2. "Desafiar" na lista abre o fluxo de desafio do fim de jogo e copia o link quando o modo já foi jogado hoje.
- L3. A lista de amigos não mostra placar de duelos.
- L4. Notificações só de pedido e de aceite.
- L5. `tsc`, `npm test`, `npm run check:data`, `npm run build` passam.

## Feito (27/11)

- **Chave:** `ROOMS_ENABLED = false` em `src/lib/features.ts` (com `roomsOff()` para as rotas e `ROOM_NOTIFICATIONS`). O código e as tabelas das salas ficaram; ligar de novo é trocar para `true`.
- **Rotas:** `/room/new` e `/room/[id]` chamam `notFound()`; as quatro rotas de `/api/duels` respondem 404 antes de qualquer coisa.
- **Interface:** sem "Salas de hoje" no Menu e em `/friends` (a lista nem busca `/api/duels`); sem "Voltar para a sala" no fim de jogo (`activeRoom` devolve null); sem "Desafiar em outro modo". Textos que falavam de salas: `/account` (Sair e Excluir conta), janela "Excluir sua conta?" (agora "Seus amigos e os pedidos de amizade." e "As notificações."), vantagens da tela de login ("Adicione seus amigos pelo username", "Desafie um amigo com um link", "Saiba quando te mandam um pedido de amizade"), `/privacy` e `/terms` (atualizadas em 27/11, sem salas, placar de salas nem convites).
- **Notificações:** `notify` não cria `room_invite` nem `room_finished`; a lista e a contagem de não lidas deixam de fora as de sala que já existissem.
- **Amigos:** a lista vem só com a pessoa (sem as subconsultas de `duel_wins` e de salas) e não mostra placar. "Desafiar" abre `account/ChallengeDialog.tsx`: os três modos de hoje; modo já jogado mostra o `ChallengeButton` do fim de jogo ("Desafiar no Pistas"), que com conta usa o nome da conta, gera o link do duelo e copia; modo não jogado leva para jogar ("Jogar o Emoji e desafiar no fim"). Menu "⋯": "Copiar username" e "Remover amigo".
- **Massa de dados:** `scripts/seed-friends.mjs` não cria mais salas, placares nem convites (30 amigos, 12 recebidos, 5 enviados, 7 notificações). No banco de dev continua 1 sala real da @guiizitos (de antes, não da massa); com a chave desligada, ela não aparece.
- **Conferido** (build de produção, massa da @guiizitos) em 1280 e 375, 19 checagens: L1 (7 rotas de sala com 404), L2 (janela com os 3 modos; Pistas jogado copia "⚔️ gui te desafiou no aknewme · Modo Pistas…/duel?m=pistas" e mostra "Link copiado!"; Emoji e Opening levam a /emoji e /opening), L3 (sem placar nem "sala" em /friends), L4 (uma notificação de sala inserida à mão não aparece na lista nem na contagem); Menu sem "Salas de hoje"; fim de jogo sem "Voltar para a sala" mesmo com sala guardada no navegador; "Excluir sua conta?" sem salas; /privacy, /terms e /login sem a palavra "sala". L5: `tsc`, `npm test`, `check:data` e build passam.

## Textos sobre duelos e conta (Produto, 27/11)

- Tela de login, subtítulo: "Entre para adicionar amigos e desafiá-los." (antes: "Entre para desafiar amigos, ver como eles foram e guardar seu histórico de duelos.").
- Janela "Duelos": o título da coluna da esquerda e o nome da janela (`aria-label`) viraram "Duelos deste aparelho", com o aviso curto embaixo: "Placar de cada rival. Partidas e duelos ficam neste navegador." O botão do cabeçalho e o item do Menu continuam "Duelos". Na aba de desafiar do fim de jogo (DuelPitch) não entrou aviso, para não repetir.
- Conferido no navegador (build de produção) em 1280 e 375: o subtítulo do login, o título e o aviso da janela (aberta pelo botão "Duelos" no computador e pelo Menu no celular), sem rolagem lateral. `tsc` e build passam.

- **404 para qualquer método (falha do QA, 28/11):** com `ROOMS_ENABLED = false`, `src/middleware.ts` responde 404 a qualquer método em `/api/duels` e em tudo abaixo (antes, um método que a rota não exporta dava 405 e mostrava que ela existe). As páginas `/room/*` já davam o 404 do site (`notFound()`). Religar as salas é só a chave.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), branch `teste-login` e contas `qa_*` apagadas no fim (0 restantes). Sem prints. Medido em 1280 e 375.

- **L1:**
  - 1ª rodada: `/api/duels/[id]` dava 405 no POST, e `/join` e `/result` davam 405 no GET.
  - Reteste com o `src/middleware.ts`:
    - GET, POST, PUT, PATCH e DELETE em `/api/duels`, `/api/duels/<id>`, `/join`, `/result` e `/api/duels/x/y/z` dão 404, com e sem conta. Sem corpo e com os cabeçalhos de segurança.
    - `/room/new` e `/room/<id>` dão 404 com a página "Página não encontrada | aknewme".
    - Nenhuma outra rota foi afetada (25 conferidas, inclusive `/api/duel` do duelo por link, que continua aceitando POST, e `/api/duelsx`, que dá 404 normal).
  - Nenhuma tela fala de sala: `/friends`, o Menu, o fim de jogo, `/login`, a janela "Excluir sua conta?", `/privacy` e `/terms`.
- **L2:** "Duelar" na lista abre a janela com os modos de hoje. No jogado, manda o duelo ou copia o link; nos outros, mostra "Jogue agora". Os detalhes estão na 15.
- **L3:** a lista de amigos não tem placar de salas (o placar que aparece é o dos duelos por link, da 14).
- **L4:** notificação de sala inserida à mão não aparece nem conta.
- **L5:** `tsc`, `npm test`, `check:data` e o build passam.

Aprovada pelo QA em 28/11/2026.
