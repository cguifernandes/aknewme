# Notificações dentro do site

Estado: **pedido do dono, aprovado (27/11)**. Vem depois de `10-amigos.md`. Textos em português.

## Escopo desta versão

Notificação **dentro do site** (sem e-mail e sem notificação do navegador/celular). Quem recebe vê na próxima vez que abrir o aknewme, e na hora se estiver com o site aberto.

Eventos:
- **Pedido de amizade recebido:** "Bia quer ser sua amiga."
- **Pedido aceito:** "Leo aceitou seu pedido de amizade."
- **Convite para sala de duelo:** "Gustavo te desafiou no Emoji #203."
- **Amigo terminou a sala** (para quem já jogou): "Amanda terminou o duelo. Veja o placar."

## Como aparece

- **Bolinha** `lime` com o número de não lidas no botão do menu (com conta, sobre a foto/menu) e no item "Amigos".
- **Aviso (toast)** do projeto quando chega uma nova com o site aberto, com o link da ação (ver pedidos, entrar na sala, ver placar).
- **Lista de notificações** no painel da conta ("Notificações"), com as últimas 20, as não lidas em destaque e "Marcar todas como lidas". Clicar leva à ação e marca como lida.

## Dados e regras

- Tabela `notifications` (id, user_id, tipo, dados mínimos: id do amigo/sala, criada em, lida em). Sem texto livre gravado; a frase é montada na tela.
- Apagada junto com a conta (cascata). Notificações com mais de 30 dias são apagadas.
- Busca de não lidas: uma vez ao abrir o site (junto do `/api/me` do contexto da conta) e a cada 60 s só com a aba visível. Sem conexão permanente nesta versão.
- Limite de uso: as rotas que criam notificação já têm limite (amizade, salas); não criar notificação repetida do mesmo tipo e mesma origem em menos de 1 min.
- Recusar pedido não notifica quem pediu.

## Fora desta versão

- E-mail e notificação push do navegador (exigem consentimento e outra infraestrutura).
- "Cutucar".

## Critérios de aceite

- N1. A envia pedido → B vê a bolinha e o toast (se estiver com o site aberto em até 60 s) e a notificação na lista.
- N2. B aceita → A recebe "aceitou seu pedido".
- N3. Convite de sala → o convidado recebe e, ao clicar, entra na sala.
- N4. Marcar como lida zera a bolinha; excluir conta apaga as notificações.
- N5. `tsc`, `npm test`, `npm run check:data`, `npm run build` passam.

## Evidências (27/11, sem commit e sem deploy)

- **Banco:** migração `005_notifications.sql`, tabela `notifications` com quem recebe, quem causou, o tipo e, nas de sala, a sala com o modo e o dia (para a frase continuar certa depois que a sala some). Sem texto livre. Cascata na exclusão de quem recebe ou de quem causou. As de mais de 30 dias são apagadas quando chega uma nova.
- **Servidor** (`lib/notifications.ts`, `api/notifications`): criadas no pedido de amizade, no aceite, no convite de sala e quando alguém termina a sala (avisa só quem já tinha terminado). Recusar não notifica. Mesmo tipo, mesma origem e mesma sala em menos de 1 minuto: não repete. Uma falha ao notificar nunca derruba a ação.
- **Site** (`lib/notify.ts`, `account/Notifications.tsx`):
  - Consulta ao abrir (junto do `/api/me`) e a cada 60 s só com a aba visível; ao voltar para a aba, consulta na hora.
  - Bolinha `lime` com o número no botão do Menu e no item "Amigos".
  - Aviso (toast) com o link da ação para a que chega com o site aberto: "Ver pedidos", "Ver amigos", "Entrar na sala", "Ver placar".
  - ~~Cartão "Notificações" na janela Meu perfil~~: saiu em 27/11 (ver abaixo).
- **Texto do pedido:** ficou "Bia te mandou um pedido de amizade." em vez de "Bia quer ser sua amiga.", porque o site não sabe o gênero de ninguém.
- **Testes com 3 contas no `teste-login` (apagadas, 0 restantes):**
  - N1: A manda o pedido; em 55 s B viu a bolinha "1", o aviso com "Ver pedidos" e a notificação na lista.
  - N2: B aceita e A recebe "aceitou seu pedido". Recusar não gera nada para quem pediu. Pedir de novo na hora não duplica.
  - N3: o convite chega como "Bia te desafiou no Emoji #202." com "Entrar na sala"; clicar na lista abre a sala e marca como lida.
  - Amigo terminou a sala: avisa quem já tinha terminado, não quem terminou por último.
  - N4: "Marcar todas como lidas" some com a bolinha; excluir a conta de quem causou ou de quem recebe apaga as notificações (5 → 0).
- N5: `tsc`, `npm test`, `check:data` e o build passam.
- **Antes do deploy:** rodar `npm run db:migrate` no banco principal (003, 004 e 005). No `teste-login` já está aplicada.
- A `/privacy` cita as notificações.
- Prints em `OpenBot\Shared\aknewme-design\notificacoes\`.

## Sem o cartão no perfil (dono, 27/11)

- O cartão "Notificações" saiu da janela Meu perfil. Ficam a bolinha `lime` com o número (botão do Menu e item "Amigos") e o aviso (toast) com o link da ação: pedidos e aceites levam a `/friends`; convite e placar, à sala.
- Pedido de amizade se aceita ou recusa só no bloco "Pedidos de amizade" de `/friends`.
- Como a bolinha zera agora: ao abrir o lugar da ação. `/friends` marca como lidas as de amizade e a sala marca as dela (`useReadOnArrival` em `account/Notifications.tsx`, `markReadWhere` em `lib/notify.ts`), inclusive as que chegam com a tela aberta.
- Conferido no navegador (build de produção, contas de teste no teste-login, apagadas) em 1280 e 375: A pede amizade a B; B vê "Menu, 1 notificação não lida"; a janela Meu perfil não tem mais o cartão; ao abrir `/friends` a bolinha some e o banco fica com 0 não lidas. `tsc`, `npm test`, `check:data` e build passam.

## Pedido cancelado, recusado ou aceito apaga o aviso (dono, 27/11)

- **Bug:** quem cancelava um pedido enviado deixava a notificação "pedido de amizade" no outro lado, com a bolinha "1" para sempre. **Causa:** `removeFriend`, `declineFriend` e `acceptFriend` (`lib/friends.ts`) só mexiam em `friendships` e nunca apagavam a notificação criada no pedido.
- **Correção:** `dropNotifications` (`lib/notifications.ts`) apaga as notificações "pedido de amizade" entre os dois ao cancelar (os dois sentidos), ao recusar e ao aceitar. Do outro lado, a bolinha zera e o bloco de pedidos some na próxima consulta (até 60 s, ou na hora ao voltar para a aba): `/friends` relê pedidos e amigos quando a lista de notificações muda.
- **Conferido** com contas no teste-login (apagadas), em 1280 e 375: A pede a B (B fica com 1 notificação e a bolinha "1"); A cancela → 0 notificações de pedido de B no banco; B abre o site → sem bolinha e sem o bloco. Recusar e aceitar também deixam 0.

## Só pedido e aceite (dono, 27/11)

- Com as salas desligadas (`ROOMS_ENABLED = false`, 13-escopo-lancamento.md), só existem as notificações de pedido de amizade e de pedido aceito. `notify` não cria convite de sala nem "terminou a sala", e `listNotifications` deixa de fora (na lista e na contagem de não lidas) as de sala que já estivessem no banco.
- Conferido: uma notificação de sala inserida à mão para a @guiizitos não apareceu em `/api/notifications` nem na contagem (5 não lidas, só pedido e aceite).

## Aviso pausa com mouse e foco (dono, 27/11)

- Todos os avisos (`SignInToast`): com o mouse em cima ou com o foco de teclado dentro (ex.: no "Fechar"), o tempo e a barrinha param; ao sair, continuam de onde pararam (o relógio guarda o que falta; a barra usa `animation-play-state`). Cada aviso novo recomeça a barra.
- Conferido em 1280 e 375: com o mouse em cima, a barra ficou parada no mesmo ponto por 7 s (mais que os 6 s do aviso) e, ao sair, continuou e o aviso sumiu no tempo que faltava; com o foco no "Fechar", parou e, ao tirar o foco, continuou.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), branch `teste-login` e contas `qa_*` apagadas no fim (0 restantes). Sem prints. Medido em 1280 e 375. N3 (convite de sala) não se aplica: as salas estão desligadas (13-escopo-lancamento.md).

- **N1:**
  - Com o site de Bia aberto, a bolinha chegou em 43 a 59 s: "Menu, 1 notificação não lida", e o item Amigos com 1.
  - O aviso "Ana te mandou um pedido de amizade." é um link inteiro com `aria-label` "Ver pedidos" que leva a `/friends`.
  - O servidor lista o `friend_request`.
- **N2:** ao aceitar, Ana recebe o aviso "… aceitou seu pedido de amizade." O `friend_request` some de quem aceitou.
- **N4:**
  - Abrir `/friends` marca as de amizade como lidas (0 não lidas no banco) e a bolinha some. "Marcar todas" (API) também zera.
  - Excluir a conta apaga as notificações.
- **Regras:**
  - Cancelar ou recusar o pedido apaga a notificação do outro lado.
  - Pedido repetido não duplica.
  - Marcar como lida a de outra pessoa não muda nada.
  - Notificação de sala inserida à mão não aparece nem conta.
- **N5:** `tsc`, `npm test`, `check:data` e o build passam.

Aprovada pelo QA em 28/11/2026.
