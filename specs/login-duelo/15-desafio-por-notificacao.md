# Desafiar um amigo da lista por notificação

Estado: **feito (27/11)**, pedido do dono. Migração 008 aplicada só no `teste-login`; no principal, rodar `npm run db:migrate` antes do deploy (aplica 003–008).

## Hoje

"Desafiar" na lista de amigos abre a janela com os modos do dia; no modo já jogado, gera e **copia o link** do duelo. O amigo só fica sabendo se a pessoa mandar o link por fora.

## Novo

Na janela de Desafiar **aberta a partir de um amigo da lista**:
- Modo já jogado hoje: o botão passa a ser **"Desafiar <nome>"** e, ao clicar, **envia o desafio como notificação** para esse amigo (sem copiar link). Estados do botão iguais aos do "Enviar" de Adicionar amigo: spinner; enviado (lime-deep + check, rótulo "Desafio enviado"); erro (danger + X). Depois de enviado, aquele modo fica como "Desafio enviado" no dia (não manda de novo).
- Modo não jogado: "Jogue agora" (como hoje); ao terminar o jogo, o fim de jogo oferece desafiar.
- Um link "Copiar link" discreto continua disponível na janela, para quem quiser mandar por fora.
- A janela "Chamar pro duelo" (sem amigo escolhido) e o fim de jogo continuam copiando o link, como hoje.

## O amigo desafiado

- Recebe a notificação **"Gui te desafiou no Emoji #202."** (bolinha no menu e toast com o botão **"Jogar"**), que abre o duelo (mesmo link do duelo por link). Ao abrir, a notificação é marcada como lida.
- Ao terminar, o placar é recalculado no servidor e salvo na conta dos dois (`link_duels`), como já acontece no duelo por link logado.
- Quem desafiou recebe **"Bia respondeu seu desafio no Emoji. Veja o placar."** que abre a janela "Duelos" no rival.

## Regras

- Só entre amigos aceitos; um desafio por modo, por dia, para cada amigo (o servidor recusa repetido).
- Só o desafio de hoje; o desafio vence com o dia (a notificação some ou diz "desafio encerrado" se aberta depois).
- Tipos novos de notificação: `duel_challenge` e `duel_answered` (só ids, modo e dia; cascata na exclusão da conta; 30 dias).
- Limite de uso como as outras rotas.

## Prazo do convite (dono, 27/11) — substitui "um por modo, por dia"

- O duelo enviado vale **2 minutos** (constante única, fácil de mudar). Nesse tempo, quem enviou não consegue reenviar para o mesmo amigo no mesmo modo.
- Se o amigo **não aceitar** (abrir pelo "Jogar") em 2 minutos, o convite **expira sozinho**: some do cartão "Duelos" e do toast dele (ou aparece como "expirou", sem "Jogar"), e quem enviou pode enviar de novo.
- Se o amigo **aceitar** dentro do prazo, o duelo segue normal; não dá para reenviar aquele modo para ele no mesmo dia (já duelaram).
- Trava e prazo no **Redis** (chave por quem envia + amigo + modo + dia, com TTL de 2 min); o banco guarda só a notificação, com `expires_at`. O servidor recusa reenvio dentro do prazo (429/409 com o tempo restante) e recusa aceitar convite expirado (410).
- Na janela de quem enviou: depois de enviar, o botão mostra **"Duelo enviado · 1:59"** com contagem regressiva e desativado; ao expirar, volta para "Enviar duelo". Reabrir a janela mostra o tempo restante certo (vem do servidor).

## Amigo que já jogou o modo (dono + Produto, 27/11)

- O envio não é bloqueado (o servidor não sabe do jogo solo).
- Quem recebe e **já tem o resultado** daquele modo no navegador: a notificação/cartão diz "Você já jogou: veja o duelo" e o botão é **"Ver duelo"** (não "Jogar"). Ao abrir, vai direto à comparação usando o resultado que já tem.
- Esse resultado é enviado com as jogadas e o servidor recalcula antes de gravar (como hoje). Partida antiga sem jogadas guardadas: o duelo fica só no navegador, com um aviso curto "Este resultado não pôde ser conferido e fica só neste aparelho."
- **Não expira** quando o amigo já tem o resultado: aceitar depois dos 2 min é permitido se ele mandar as jogadas válidas daquele modo e dia (o servidor recalcula). Sem resultado, o prazo de 2 min continua.
- Sem "já jogou" no cartão do amigo na lista (não há esse dado).

## Critérios de aceite

- C1. Desafiar um amigo num modo jogado cria a notificação para ele e não copia nada.
- C2. O amigo abre pela notificação, joga, e o placar aparece na janela "Duelos" dos dois (contas).
- C3. Quem desafiou é avisado quando o amigo termina.
- C4. Repetir o mesmo desafio no mesmo dia é recusado; desafiar quem não é amigo é recusado.
- C5. `tsc`, `npm test`, `npm run check:data`, `npm run build` passam; migração (se houver) só no `teste-login`, com aviso do que rodar no principal.

## Como ficou (27/11)

- **Banco** (migração `008_duel_challenges.sql`): os tipos `duel_challenge` e `duel_answered` entram no CHECK de `notifications`; coluna `duel_id` (o mesmo id de `link_duels`); índice único (quem recebe, quem desafia, modo, dia) só para `duel_challenge`: um desafio por modo, por dia, para cada amigo, mesmo com dois cliques ao mesmo tempo. Só ids, modo e dia; cascata pelas contas; as de 30 dias saem ao criar uma nova.
- **Enviar** (`/api/duel-challenges`, `lib/duelChallenges.ts`): o navegador primeiro salva a partida de hoje na conta como "challenger" (`/api/link-duels`, com o placar recalculado) e depois manda `{ friend, mode, day, duelId }`. O servidor exige amizade aceita (403), o desafio de hoje (±1 dia de fuso, 410), a partida salva de quem desafia com esse id, modo e dia (409 no_duel) e recusa repetido (409 exists). Mesma origem e limite de uso (20/min) como as outras rotas. `GET ?friend&day` diz em quais modos já desafiou (a janela reabre com "Desafio enviado").
- **Janela Desafiar de um amigo** (`ChallengeModes` com `friend` → `account/FriendChallengeButton.tsx`): modo jogado = "Desafiar <nome>" (`LIME_DARKEN`); enviando, só o spinner na mesma largura; enviado, lime-deep + check "Desafio enviado" (fica no dia); erro, danger + X com a explicação embaixo (ex.: "Vocês não são mais amigos."), volta em 2,5 s; `aria-live`. Embaixo, "ou copiar o link para mandar por fora" (copia o mesmo link do duelo). Modo não jogado: "Jogue agora", como antes. "Chamar pro duelo" e o fim de jogo não mudaram (copiam o link).
- **Quem recebe**: "Ana te desafiou no Pistas #202." na bolinha do item Amigos do Menu, no aviso (toast) com "Jogar" e num cartão **"Desafios"** no topo de /friends (para quem não viu o aviso: o que já existia ao abrir o site não vira toast). "Jogar" abre o mesmo link do duelo por link, montado no servidor com a partida salva de quem desafiou; ao abrir /duel, a notificação fica lida. O "te desafiou" de outro dia não aparece (o desafio venceu).
- **Ao terminar**: o placar vai para a conta dos dois (`link_duels`, como no duelo por link logado). Se o duelo chegou por notificação, quem desafiou recebe "Bia respondeu seu desafio no Pistas. Veja o placar." (uma vez por duelo); "Ver placar" abre a home com a janela Duelos já no rival (`/?duelos=<id>`, o parâmetro sai do endereço) e marca o aviso como lido.
- **Conferido** (build de produção, contas de teste no `teste-login`, apagadas no fim junto com as notificações delas), 16 checagens:
  - C1: janela de Bia com "Desafiar Bia Duelo" no Pistas jogado e "Jogue agora" nos outros; spinner na mesma largura (396 px); depois lime-deep + check "Desafio enviado", nenhuma cópia, notificação `duel_challenge` com o id do duelo salvo de Ana; reabrindo, continua "Desafio enviado"; "copiar o link" copia o link do mesmo duelo.
  - C2: Bia vê "Amigos 1" no Menu e o cartão "Desafios · 1" com "Ana Duelo te desafiou no Pistas #202." e "Jogar"; "Jogar" abre /duel e marca lida; ao terminar, a partida de Bia vai para a conta ligada à de Ana; os dois veem o duelo na janela Duelos.
  - C3: Ana recebe `duel_answered`; o cartão mostra "Bia Duelo respondeu seu desafio no Pistas. Veja o placar."; "Ver placar" abre a janela Duelos no placar contra Bia, com o endereço limpo, e marca lida.
  - C4: repetido 409, não amigo 403, outro dia 410, duelo de outra pessoa 409, outra origem 403, nada criado; em 375, o amigo que saiu com a janela aberta dá danger + X e "Vocês não são mais amigos.", volta em 2,5 s, sem rolagem lateral.
  - Extra: o aviso (toast) de um desafio que chega com o site aberto mostra "Jogar" com o link do duelo; "Chamar pro duelo" sem amigo continua copiando o link.
  - C5: `tsc`, `npm test`, `npm run check:data` e `npm run build` passam.

## Rapidez, botões e /duel com conta (dono, 27/11, pedido 921cbdb0 e bug e7b29ab0)

- **Janela vazia no dev (bug):** os cartões esperavam a consulta "já mandou hoje?" (`GET /api/duel-challenges`), que no dev levava 4–7 s (e deu 404 enquanto o dev recompilava). Agora os cartões aparecem na hora; o estado de enviado entra quando a resposta chega; se a consulta falhar, um aviso discreto ("Não deu para conferir os desafios que você já mandou hoje. Se mandar de novo, o site avisa.").
- **Envio numa chamada:** `POST /api/duel-challenges` recebe também as jogadas, salva a partida (o mesmo replay de `/api/link-duels`) e cria a notificação, com a conferência e a criação numa consulta SQL. Tempos no dev, mesmo banco: antes, 2 chamadas em série (~2,2 s; no dev do dono, 5,1 s + 1,8 s); agora, 1 chamada (~1,45 s).
- **Cor:** os botões dos cartões de modo jogado são o roxo primário (`GRAPE_PRIMARY` em `buttons.ts`: grape, texto branco, sweep lime); o fim de jogo continua lime.
- **Copiar link:** botão secundário com contorno lavender e ícone de link, ao lado do principal no computador e embaixo no celular, com "Link copiado!" por 2,5 s.
- **/duel com conta:** sem o campo de apelido; só "Você joga como <nome>." e "Aceitar desafio". Sem conta, continua pedindo o apelido.

## Textos do duelo entre amigos (dono, 27/11, pedido ec04d3d0)

- Todos num lugar só: `src/lib/duelTexts.ts` (`DUEL_TEXT`). Na lista de amigos, "Duelar"; janela "Duelar com <nome>" ("<nome> recebe o duelo com o seu resultado e joga o mesmo."); botão "Enviar duelo"; enviado "Duelo enviado · 1:59"; aceito "Duelo aceito".
- Quem recebe: "Ana quer duelar com você no Emoji #202." (toast e cartão **"Duelos"** no topo de /friends), botão "Jogar". Resposta: "Bia respondeu seu duelo no Pistas. Veja o placar.", botão "Ver placar".
- Fim de jogo ("Desafiar um amigo") e "Chamar pro duelo" ("Desafiar no <modo>") não mudaram (`CHALLENGE_VERB`, no mesmo arquivo).
- Saiu o que sobrava das salas em /friends: a seção "Salas de hoje" (com "Ver convite"/"Abrir") e a busca de `/api/duels` no `FriendsPanel`, e o item "Salas de hoje" do Menu. As telas e rotas das salas continuam desligadas por `ROOMS_ENABLED` (não aparecem); religar as salas agora pede devolver essa seção.

## Prazo do convite: como ficou (dono, 27/11, pedido bb01f22a)

- Constante única `INVITE_SECONDS` = 120 em `lib/duelChallenges.ts` (a variável `DUEL_INVITE_SECONDS` só serve para os testes encurtarem o prazo).
- **Trava no Redis:** `SET duelinv:<quem envia>:<amigo>:<modo>:<dia> NX EX 120`. Dentro do prazo, reenviar → 409 `{ error: "pending", retryIn }` (segundos que faltam). No banco, a notificação guarda `expires_at` (migração `009_duel_invite_deadline.sql`, que tira o índice único "um por modo/dia" da 008). Sem Redis, o banco faz a mesma conta pelo `expires_at`.
- **Aceitar = abrir pelo "Jogar":** `/duel` com conta chama `PATCH /api/duel-challenges { duelId }`. No prazo: `expires_at` vira NULL (aceito), fica lida e a trava sai do Redis; aquele modo fecha para esse amigo no dia (reenviar → 409 accepted, botão "Duelo aceito"). Depois do prazo: 410, e a tela diz "Esse convite de duelo expirou. Peça para <nome> mandar de novo." (sem "Aceitar desafio"). Duelo por link comum (sem convite): 404, segue igual.
- **Expirou sem aceitar:** some da lista e da bolinha no servidor (`/api/notifications` não lista nem conta) e no navegador na hora, sem esperar a consulta de 60 s: o prazo é contado no relógio do banco (`now` vem junto da lista). Quem enviou volta a ver "Enviar duelo" e pode mandar de novo (o convite vencido é trocado pelo novo).
- **Quem enviou:** "Duelo enviado · 1:59" com contagem regressiva, desativado; reabrir a janela mostra o tempo que falta, vindo do servidor.
- **Conferido** (build de produção, prazo de 40 s no teste, 2 contas no `teste-login`, apagadas junto com as notificações e as chaves do Redis), 13 checagens: "Duelar"/"Duelar com…"/"Enviar duelo" roxo; sem salas na tela nem no Menu; "Duelo enviado · 0:40 → 0:38" desativado, chave no Redis com TTL e `expires_at` no futuro; reenviar no prazo 409 com `retryIn`; reabrir com o tempo do servidor; Bia vê "Duelos · 1" com "Ana Duelo quer duelar com você no Pistas #202." e a bolinha 1; no prazo, o cartão e a bolinha somem 80 ms depois do prazo do servidor, sem recarregar, e o servidor não lista nem conta; abrir depois do prazo 410 com o aviso; o botão de Ana volta para "Enviar duelo" e o reenvio funciona; Bia abre no prazo: aceito, lida, chave do Redis apagada, "Aceitar desafio"; reenviar aceito 409; Ana recebe "Bia Duelo respondeu seu duelo no Pistas. Veja o placar." e a janela mostra "Duelo aceito". `tsc`, `npm test` e build passam.
- **Antes do deploy:** `npm run db:migrate` no principal aplica 003–009.

## Cartão "Desafios" agrupado por pessoa (dono, 27/11, pedido 4696224f)

- No topo de /friends (`account/DuelNotices.tsx`), no layout da referência: cartão grape, título **"Desafios"** com o pontinho lime e a bolinha lime com a quantidade (convites + respostas).
- Uma linha por pessoa que desafiou (os modos juntos): avatar, "<nome> te desafiou em 2 modos" (ou "te desafiou no Emoji #202" com um só), embaixo "o placar aparece depois que você jogar · expira em 1:42" (o convite que vence primeiro, contando a cada segundo no relógio do banco) e, à direita, **um botão lime inteiro por modo**, "Jogar Opening #202" com ícone de play e hover LIME_DARKEN (pedido do dono, 27/11, substitui a pílula + botão escuro "Jogar"), com 44 px no celular e 36 px no computador. No celular os botões descem para baixo do nome.
- O convite que vence sai na hora (a pílula; a linha inteira quando era o último dela) e a bolinha diminui, sem recarregar. As respostas aos seus duelos ("Bia respondeu seu duelo no Pistas. Veja o placar.") ficam embaixo, no mesmo cartão, com "Ver placar".
- O toast continua "Ana quer duelar com você no Emoji #202." com "Jogar". Textos em `lib/duelTexts.ts`.
- Conferido no navegador (build de produção, contas de teste no `teste-login`, apagadas): em 1280 e 375, cartão grape "Desafios" com 3; Ana em uma linha com "Emoji #202" e "Pistas #202"; Caio com "te desafiou no Pistas #202"; "expira em 0:28 → 0:26"; "Jogar <modo>" com 36/44 px (botão lime único, depois do pedido do dono); sem rolagem lateral; o convite do Caio venceu e a linha dele sumiu sozinha, com a bolinha indo para 2. `tsc` e build passam.

## Bug: "Duelo aceito" sem ninguém ter aceitado (dono, 27/11, d6e2beb4)

- **Causa:** a 009 usava `expires_at` NULL como "aceito". Os convites feitos antes do prazo existir também tinham `expires_at` NULL e apareciam como aceitos, travando o modo no dia. Dois deles foram criados 28–30 s depois da 009, pelo dev ainda com o código antigo, que não gravava o prazo. No `teste-login`, os 4 convites do par do dono (9b95884b → 62c01449: Emoji ×2, Opening, Pistas) estavam assim. Nenhum foi jogado (sem resposta em `link_duels`), então ninguém tinha aceitado de verdade; os 2 marcados como lidos foram lidos pela tela antiga ao abrir o /duel.
- **Correção (migração `010_duel_invite_accepted.sql`, aplicada só no `teste-login`):** coluna `accepted_at`; "aceito" agora é só `accepted_at` preenchido (abrir pelo "Jogar" no prazo). Os antigos sem prazo e sem aceite viraram expirados (`expires_at = created_at`). Sem `accepted_at`, o convite está esperando se `expires_at` está no futuro e expirado nos outros casos (inclusive NULL). A lista de quem recebe só mostra os convites esperando.
- **Conferido:** o par do dono não tem mais nenhum modo aceito nem esperando (a janela volta a "Enviar duelo") e nada aparece na lista do amigo. O teste completo do prazo (build de produção, 40 s, 2 contas de teste apagadas) passou nas 14 checagens: aceitar no prazo grava `accepted_at` e mostra "Duelo aceito". `tsc`, `npm test` e build passam. Antes do deploy: `npm run db:migrate` no principal aplica 003–010.

### Como ficou (27/11, pedido f9e4110b)

- O envio não muda (não bloqueia).
- O servidor lista também o convite de hoje que passou do prazo e ainda não foi aceito. O navegador decide (`notify.ts`, `playedHere`): se o modo daquele dia já foi jogado neste aparelho, o convite não vence e aparece "Você já jogou: veja o duelo", com "Ver duelo" (no toast) e "Ver duelo Opening #202" (no cartão "Desafios"); se não foi, some e sai da bolinha no fim dos 2 min, como antes. Na linha do amigo em "Desafios", o "expira em" conta só os modos ainda não jogados; jogou todos, fica "Você já jogou: veja o duelo".
- Ao abrir, o /duel com o resultado já salvo vai direto à comparação (como antes). O aceite (`PATCH /api/duel-challenges`) leva as jogadas daquele modo e dia; depois do prazo, o servidor aceita se elas forem válidas (recalcula e o placar tem de bater). Sem jogadas válidas, continua 410.
- Partida antiga sem as jogadas guardadas: nada vai para a conta, e o resultado do duelo mostra "Este resultado não pôde ser conferido e fica só neste aparelho."
- Nada de "já jogou" no cartão do amigo da lista. Textos em `lib/duelTexts.ts`. Só `tsc` e `npm test`; não testado no navegador.
- **Aceite ao vivo (dono, 28/11, 2339a56a):** com a janela "Duelar com" aberta e um modo em "Duelo enviado · M:SS", a janela confere o estado a cada 4 s (`GET /api/duel-challenges`, só com a aba visível, parando quando ninguém mais está esperando). Se o amigo aceitar, o cartão muda sozinho para "<nome> aceitou" (com check), com o botão principal e o "Copiar link" desativados (opacidade 60%, cursor de bloqueado, legível). Ao vencer, volta para "Enviar duelo", como antes. Só `tsc` e `npm test`; não testado no navegador.
- **Cartão só com convites (dono, 28/11, 279a86ae):** o cartão "Desafios" de /friends mostra só os convites recebidos; as respostas aos seus duelos ficam na bolinha e no aviso, com "Ver placar". Sem convite, o cartão não aparece.
- **"Aceitou" numa linha (279a86ae):** o estado de aceito no botão da janela "Duelar com" é só "Aceitou" (com check).
- **"Ver placar" na janela "Duelar com" (279a86ae):** o modo em que o amigo já terminou (resposta em `link_duels`) mostra o botão roxo "Ver placar", que abre a janela Duelos no rival na página atual. Ordem: Enviar duelo → Duelo enviado · M:SS → Aceitou (bloqueado) → Ver placar. A janela continua conferindo enquanto há convite esperando ou aceito (este, por até 10 min).
- **Janela Duelos carregando (279a86ae):** com conta, enquanto os duelos chegam, Skeleton no lugar do "Desafiar um amigo" e de 3 rivais e, aberta num rival, no título, no placar grande e na lista de duelos. A busca começa antes, no hover/foco do "Ver placar" (aviso e janela "Duelar com"), e a janela usa essa resposta se tiver menos de 15 s.
- **Acordeão do duelo igual nos dois lugares (dono, 28/11, 91f71df7):** `DuelAccordion` (em `DuelResult.tsx`) é o mesmo no resultado do duelo e em cada duelo da janela Duelos: "Emoji #203" e "Hoje, 00:11" à esquerda; à direita o placar grande "0 x 2", a pílula ("Venceu" lime, "Perdeu" blush, "Empate" sun) e a seta. Aberto, a linha divisória e o "RODADA A RODADA / VOCÊ / GU" com a lista. Fechado por padrão.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), branch `teste-login`, Redis local do QA e contas `qa_*` apagadas no fim (0 contas, notificações e chaves do Redis). Sem prints. Medido em 1280 e 375, com 2 pares de contas e o teste do prazo de 2 min de verdade.

- **C1:**
  - "Duelar" abre "Duelar com <nome>" com os 3 modos.
  - No modo jogado, "Enviar duelo" é grape. Enviando, aparece só o spinner, na mesma largura (244/261 px); o clique duplo manda 1 POST só.
  - Depois aparece "Duelo enviado · 1:58", desativado, com a contagem andando. Nada é copiado.
  - Ao reabrir a janela, o tempo vem do servidor.
  - Bia recebe a notificação, o aviso "Ana quer duelar com você no Pistas #203." com "Jogar" e a bolinha.
- **C2:**
  - O cartão "Desafios" mostra "te desafiou no Pistas #203" e "expira em M:SS".
  - O botão lime "Jogar Pistas #203" (um por modo) tem 36 px no computador e 44 px no celular, como a spec corrigida. O ícone de play e o `LIME_DARKEN` foram conferidos no código.
  - "Jogar" abre `/duel` com "Você joga como <nome>." e "Aceitar desafio", sem apelido, e grava `accepted_at` e lida.
  - A janela de Ana muda sozinha para "Aceitou" (opacidade 60%, cursor de bloqueado).
  - A partida de Bia vai para a conta ligada à de Ana, e os dois veem o duelo na janela Duelos.
- **C3:** Ana recebe "Bia respondeu seu duelo no Pistas. Veja o placar.". "Ver placar" abre a janela Duelos no rival ("1 x 0", "Venceu").
- **Prazo:**
  - Em 2 min, o convite some do cartão e da bolinha sem recarregar, e Ana volta a ver "Enviar duelo".
  - O link aberto depois do prazo mostra "Esse convite de duelo expirou. Peça para … mandar de novo.", sem "Aceitar desafio".
  - Quem já jogou o modo vê "Você já jogou: veja o duelo" e "Ver duelo Pistas #203"; o aceite tardio com as jogadas é aceito e salvo na conta.
- **C4:**
  - O servidor recusa repetido no prazo (409 `pending` com `retryIn`), modo já aceito (409 `accepted`), não amigo (403), outro dia (410), placar que não bate (409), outra conta aceitando (404) e id do duelo de outra pessoa (409 `taken`, migração 011).
  - Na tela, o amigo que saiu com a janela aberta gera danger + X e "Vocês não são mais amigos.", que volta em 2,5 s.
  - "Copiar link" copia o link do duelo.
- **C5:** `tsc`, `npm test`, `check:data` e o build passam.
- **Observação:** a linha "Conferido no navegador" da seção do cartão "Desafios" ainda diz "Jogar com 32/44 px". O que vale é 36/44 px, do item corrigido logo acima.

Aprovada pelo QA em 28/11/2026.
