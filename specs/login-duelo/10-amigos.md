# Tela de amigos (`/friends`)

Estado: **pedido do dono, aprovado (27/11)**. Referência: print "Amigos 5" com pedidos, lista e o cartão "Adicionar amigo". Textos em português.

## Fluxo (como já funciona)

1. A digita o @ de B em "Adicionar amigo" e envia → cria um pedido pendente.
2. B vê o pedido na própria tela de amigos ("Pedidos de amizade") e escolhe Aceitar ou Recusar. Não há notificação fora do site.
3. Aceito: os dois aparecem na lista um do outro e podem se chamar para salas de duelo (até 3 amigos por sala). Recusado: o pedido some.
4. Remover amigo: some dos dois lados na hora.

## Layout (como no print, com os ajustes do dono)

- Fundo com o kanji decorativo **no canto superior direito**, no padrão das outras telas (não embaixo).
- Topo: título "Amigos" e subtítulo "O placar com cada amigo e um atalho para desafiar." Sem o link "‹ Início" e sem a quantidade ao lado do título (ajuste do dono, 27/11; o logo do cabeçalho já volta à home).
- Coluna da esquerda:
  - **Pedidos de amizade** (só se houver): bloco `blush` claro com o título "PEDIDOS DE AMIZADE · N" e uma linha por pedido (avatar, nome, @, botões "Aceitar" escuro e "Recusar" com contorno).
  - **Lista de amigos** num cartão branco com linhas: avatar (foto ou iniciais), nome, @, o placar dos duelos entre vocês ("2 x 0", com "nos duelos" embaixo) e o botão "Desafiar" (cria a sala do desafio de hoje com esse amigo). Linhas com hover sutil (`track`), divisórias finas, e um menu "⋯" discreto por linha com "Remover amigo" (com confirmação).
  - Ordem: quem tem duelo hoje primeiro, depois por nome.
  - Lista vazia: "Você ainda não tem amigos. Adicione pelo @ ao lado."
- Coluna da direita: cartão `grape` **"Adicionar amigo"** com o campo "@ do amigo" e o botão "Enviar". Mensagens embaixo: "Pedido enviado", "Nenhum jogador tem esse @", "Esse é o seu próprio @", "Vocês já são amigos".
- Celular: uma coluna, com "Adicionar amigo" logo abaixo do título.

## Fora desta versão

- Abas "Todos" / "Jogaram hoje".
- Cartão "Ou mande seu link" (não há página de perfil público ainda).
- "Cutucar" (não há sistema de notificação).
- Selo "jogou o #N" / "ainda não jogou": o servidor só sabe das partidas feitas em sala; o jogo solo fica no navegador. Sem dado confiável, não entra.

## Lista vazia (dono, 27/11)

Referência: print "Sua turma ainda está vazia" com três passos. Ajustes do dono:
- Cartão com fundo `grape` (o mesmo roxo do cartão do perfil), texto branco, sem borda tracejada.
- **Sem** as bolinhas de avatar no topo (nem a do usuário nem as com "+"). Só texto.
- Título "Sua turma ainda está vazia" e subtítulo curto, sem prometer o que não existe (ex.: "Com amigos aqui, você desafia a turma em duelos e vê o placar com cada um.").
- Três cartõezinhos de passo (`grape-deep`, número em bolinha `lime`, título e texto com a primeira letra maiúscula):
  1. "Adicione pelo @" — "Digite o @ do seu amigo em Adicionar amigo."
  2. "Peça para te adicionarem" — "Passe o seu @ (@nome) para a turma te achar."
  3. "Bora duelar" — "Desafie seus amigos no desafio do dia e compare o placar."
- **Sem** "Copiar meu link" e sem "Mandar no WhatsApp" (não há link de perfil por enquanto).
- O cartão "Adicionar amigo" da direita continua.

**Feito (27/11):** `account/EmptyFriends.tsx` no lugar do texto "Você ainda não tem amigos". Conferido no navegador (build de produção, conta de teste no teste-login, apagada) em 1280 e 375: cartão grape com texto branco, sem borda nem avatares; três passos `grape-deep` com o número em bolinha `lime` (lado a lado no computador, empilhados no celular), o passo 2 com o @ real; sem "Copiar meu link" e sem WhatsApp; "Adicionar amigo" continua; sem rolagem lateral. `tsc` e build passam.

## Critérios de aceite

- F1. Layout como acima, com o kanji no canto superior direito.
- F2. Placar entre os dois amigos calculado das salas já jogadas (vitórias x derrotas; empate não conta como vitória).
- F3. "Desafiar" cria a sala de hoje já com o amigo convidado.
- F4. Pedidos aparecem só para o destinatário; Aceitar/Recusar funcionam e atualizam a lista sem recarregar.
- F5. Sem abas, sem "mande seu link", sem "cutucar".
- F6. 375 px sem rolagem lateral; `tsc`, `npm test`, `npm run check:data`, `npm run build` passam.

## Evidências (27/11, sem commit e sem deploy)

- **F1.** `/friends` refeita (`account/FriendsPanel.tsx`, `account/FriendRow.tsx`): kanji 友達 no canto superior direito (`Watermark`, como nas outras telas), "‹ Início", "Amigos N", subtítulo; à esquerda os pedidos (bloco `blush` claro) e a lista em cartão branco; à direita o cartão `grape` "Adicionar amigo". No celular, uma coluna com "Adicionar amigo" logo abaixo do título.
- **F2.** Placar entre os dois:
  - As salas são apagadas um dia depois do desafio, então o placar não pode ser contado nelas. Tabela nova `duel_wins` (migração `004_duel_wins.sql`): só ids, uma linha por vitória, gravada quando o segundo dos dois termina a sala (`recordWins` em `lib/duels.ts`, com a mesma regra do duelo). Empate não grava. Apagada em cascata com a conta de qualquer um dos dois.
  - Testado: 2 vitórias, 1 derrota e 1 empate viram "2 x 0" e "0 x 1"; o outro lado vê o inverso; o placar continua depois de as salas serem apagadas.
  - O placar começa do zero: salas jogadas antes desta mudança não entram.
- **F3.** "Desafiar" cria a sala do Modo Emoji de hoje com o amigo convidado e abre a sala. Embaixo da lista há o link "Outro modo ou mais amigos" (`/room/new`). Quem tem sala com você hoje sobe para o topo da lista.
- **F4.** O pedido só aparece para quem recebeu. Aceitar e Recusar atualizam a tela sem recarregar (0 navegações). "Remover amigo" fica no menu "⋯", com confirmação na própria linha, e remove dos dois lados.
- **F5.** Sem abas, sem "mande seu link", sem "cutucar" e sem selo "jogou o #N".
- **F6.** Sem rolagem lateral em 375 e 1280 px. `tsc`, `npm test`, `check:data` e o build passam.
- **Mantido da tela antiga:** "Salas de hoje" (o Menu aponta para `#salas-de-hoje`) e "Pedidos enviados", com Cancelar.
- **Saiu:** a seção "Conta" do fim da tela (trocar @, sair, excluir). Isso agora fica na janela Meu perfil; a `/privacy` foi ajustada.
- **Antes do deploy:** rodar `npm run db:migrate` no banco principal (003 e 004). No `teste-login` já foi aplicada.
- Prints em `OpenBot\Shared\aknewme-design\amigos\`: com pedidos, com lista e vazia, em 375 e 1280, e o menu "Remover amigo". Contas de teste do `teste-login` apagadas (0 restantes).

## Pedidos de amizade: cores (dono, 27/11)

- O bloco "Pedidos de amizade" passou de `blush` para `track` (lilás claro do projeto). "Aceitar" ficou no roxo padrão (`grape`, texto branco, `sweep-lime` no hover); "Recusar" continua com contorno.
- Abrir `/friends` marca como lidas as notificações de amizade (11-notificacoes.md).
- Conferido no navegador em 1280 e 375: fundo do bloco = `track`, "Aceitar" grape com texto branco, "Recusar" branco com contorno, sem rolagem lateral.

## Ajustes de /friends (dono, 27/11)

- **Adicionar amigo:** sem o placeholder "do amigo" (fica só o "@" fixo). "Pedido enviado." com o ícone de check do projeto (FontAwesome `faCircleCheck`) e some sozinho em 4 s.
- **Pedidos enviados:** sem o rótulo "esperando". "Cancelar" mostra spinner e fica desativado enquanto cancela.
- **Pedidos de amizade:** "Aceitar" e "Recusar" com spinner no botão clicado e os dois desativados enquanto responde. A lista se atualiza sozinha quando as notificações mudam (pedido novo, ou cancelado do outro lado).
- **Lista de amigos:**
  - O fundo do hover fica dentro do cartão: a primeira e a última linha têm os cantos arredondados como o cartão (22 px, o raio de dentro).
  - "⋯" virou uma bolinha `grape` com o ícone branco.
  - Menu do "⋯": "Desafiar em outro modo" (abre `/room/new?friend=<id>` com o amigo já marcado), "Copiar username" (copia "@nome" e mostra "Copiado!") e, por último e em `danger`, "Remover amigo".
  - Confirmação de remover na própria linha: a foto e o nome ficam; só a parte da direita (placar, Desafiar, ⋯) vira "Remover" (`danger`) e "Cancelar". "Remover" mostra spinner e os dois ficam desativados enquanto remove.
- **Textos:** onde a tela chamava o @ de "@" ou "nome de usuário", agora é "username" (lista completa em 06-usuario.md). O "@" antes do valor e o "@" fixo do campo continuam.
- **Massa de dados para testar (só no branch `teste-login`):** `node --experimental-strip-types scripts/seed-friends.mjs --dev [--for <username>]` (padrão `guiizitos`) cria 47 contas falsas (`teste_*`, login falso `aknewme-seed-N`; umas com a foto padrão pública do Discord, outras sem): 30 amigos com placares variados (alguns 0 x 0), 12 pedidos recebidos, 5 enviados, 3 salas de hoje e 8 notificações (6 não lidas). Rodar de novo não duplica. Apagar só as falsas: `node scripts/unseed-friends.mjs --dev`. Os dois recusam rodar sem `--dev` ou se o banco do dev for o mesmo do `.env.local`.
- **Conferido no navegador** (build de produção, contas de teste no teste-login, apagadas) em 1280 e 375: todos os itens acima, com o atraso de 2 s nas chamadas para ver os spinners; `/room/new?friend=` com o amigo marcado; "Copiar username" com "@caio_…" na área de transferência. `tsc`, `npm test` e build passam.

## Pedidos em acordeão e "Ver mais" (dono, 27/11)

- **Pedidos recebidos** no topo, num acordeão **fechado** por padrão: "Pedidos para responder · N", com borda `grape` de 2 px e sem fundo colorido (`account/IncomingRequests.tsx`). O N vem com a página, por uma contagem leve (`GET /api/friends` devolve `incomingCount`, sem a lista). A lista só é buscada ao abrir (`GET /api/friends?list=incoming`), com o Loading do projeto. Fechar e abrir de novo reaproveita o que veio, a não ser que a quantidade mude (aceitou ou recusou, ou chegou pedido novo). Acessível: o título é um botão com `aria-expanded` e `aria-controls`, e Enter e espaço alternam.
- Aberto: até 10 pedidos e "Ver mais" (mais 10 por vez). Linhas compactas: foto de 32 px, texto menor, 12 px entre um pedido e outro, botões de 32 px no computador e 44 px no celular. No lugar do placar, "te mandou um pedido". Aceitar e Recusar só aqui. Sem data do pedido por enquanto.
- **Seus amigos · N**: título com a quantidade; mostra 10 e "Ver mais" (mais 10 por vez), sem número de página nem rolagem infinita. O corte é só na tela: a API continua devolvendo todos. Paginar no servidor só acima de ~100 amigos (não agora).
- "Pedidos enviados" e "Salas de hoje" sem mudança.
- **Conferido no navegador** (build de produção, com a massa da @guiizitos, recriada no fim) em 1280 e 375: acordeão fechado com "· 12", borda grape 2 px, sem fundo, acima da lista; nenhuma busca da lista ao carregar; ao abrir, "Carregando..." e depois 10 pedidos com "te mandou um pedido" e "Ver mais" → 12; fechar e abrir não busca de novo; Enter fecha; botões de 32 px (computador) e 44 px (celular); "Seus amigos · 30" com 10 → 20 → 30; aceitar um pedido leva a "· 11", a lista é buscada de novo e os amigos vão a 31. `tsc`, `npm test`, `check:data` e build passam.

## Paginação por páginas e ajustes dos pedidos (dono, 27/11)

Substitui o que conflitar na seção anterior ("Ver mais" e "Pedidos para responder").

- Acordeão dos pedidos: título **"Pedidos · N"**, borda igual à do cartão "Seus amigos" (`border-2 border-track`, a padrão do projeto), sem o texto "te mandou um pedido" nas linhas. Continua fechado por padrão, com a lista buscada só ao abrir.
- **Paginação por páginas** no lugar do "Ver mais": componente novo `components/Pagination.tsx` (não havia nenhum no projeto). Pílulas com os números, a página atual em `grape`, setas anterior/próxima (FontAwesome) desativadas nas pontas; até 7 posições no computador e 5 no celular, com reticências (`pageSlots` em `lib/pagination.ts`, testado em `scripts/check-pagination.mjs`, que entrou no `npm test`). `usePage` volta para a página 1 quando a lista encolhe e a página atual deixa de existir. Usada em "Seus amigos" e nos pedidos abertos, 10 por página. O corte continua só na tela.
- **O que estava errado com a massa de teste** (reproduzido com a @guiizitos): ao aceitar ou recusar um pedido no meio da lista, a quantidade no título mudava na hora, mas o pedido respondido **continuava na tela com Aceitar e Recusar ativos** até a lista ser buscada de novo; quem clicava de novo nessa janela recebia "Não deu certo". Agora quem foi respondido sai da lista assim que o servidor confirma, sem nova busca. A ordem dos pedidos (recebidos e enviados) passou a desempatar pelo username, para não mudar de lugar entre uma busca e outra quando dois pedidos têm o mesmo horário. Fechar e abrir, remover amigo e cancelar enviado já se comportavam bem.
- **Conferido no navegador** (build de produção, massa da @guiizitos, recriada antes de cada largura e no fim) em 1280 e 375: "Pedidos · 12" com a borda igual à de "Seus amigos"; página 1 com 10 e página 2 com 2, com as setas certas; aceitar um da página 2 tira a linha na hora (nunca com botões ativos), título "· 11" e sem nova busca; recusar o último da página 2 volta para a página 1; fechar e abrir não busca de novo; "Seus amigos · 31" com 4 páginas, cabendo em 375; remover o único da última página volta para a página 1. `tsc`, `npm test` (com o novo `check-pagination`), `check:data` e build passam.

## Sem salas: placar e "Desafiar" (dono, 27/11)

Substitui o que conflitar acima (13-escopo-lancamento.md).

- A lista de amigos não mostra mais o placar "x × y nos duelos" (vinha das salas, que estão desligadas) nem "Salas de hoje".
- "Desafiar" abre a janela de desafio por link (`account/ChallengeDialog.tsx`) com os modos de hoje: jogado → botão do fim de jogo que copia o link do duelo com o nome da conta; não jogado → leva para jogar e o desafio sai no fim do jogo.
- Menu "⋯": "Copiar username" e "Remover amigo" ("Desafiar em outro modo" saiu).

## Paginação no banco (dono, 27/11)

- Substitui o corte só na tela: o servidor devolve 10 por página (amigos, pedidos recebidos e enviados) e o total, em ordem estável (amigos por username). Detalhes e testes em 14-duelos-na-conta-e-paginacao.md.

## Pedidos sempre à mostra e Loading sem pulo (dono, 27/11)

- O cartão "Pedidos" aparece sempre, mesmo com 0: título "Pedidos · 0" (escolhi manter o número, igual ao de "Seus amigos"); aberto, "Nenhum pedido no momento." (sem buscar nada).
- Loading: sem lista ainda (1ª abertura dos Pedidos), uma caixa de 160 px com o Loading no centro (`LOADING_BOX`, a mesma altura mínima nos dois cartões). Trocando de página (Pedidos ou Seus amigos), a lista atual fica na tela, apagada, com o Loading no centro dela: a altura não pula.
- Conferido em 1280 e 375 (conta de teste sem pedidos, apagada; massa da @guiizitos): "Pedidos · 0" e "Nenhum pedido no momento."; caixa de 160 px com o Loading centralizado (0 px de desvio); trocar de página dos amigos manteve 790 px antes, durante e depois, com a lista a 30% e o Loading no centro.

## Botão "Enviar" com estados (dono, 27/11)

- O cartão "Adicionar amigo" saiu do `FriendsPanel` para `account/AddFriendCard.tsx` (o painel estava com 492 linhas; ficou com 393).
- Botão "Enviar": hover/foco no `LIME_DARKEN` (sweep lime-deep); enviando, sem texto, só o spinner, na mesma largura (o texto fica invisível segurando o tamanho); enviado, fica `lime-deep` (o projeto não tem token de "sucesso") com um check, o campo limpa e não há mensagem embaixo; erro, fica `danger` com um X e a explicação curta embaixo do campo (ex.: "Nenhum jogador tem esse username."). Os dois voltam ao normal em 2,5 s, e a explicação some junto. Leitor de tela: `aria-live` com "Pedido enviado" ou o erro; o campo aponta para a explicação (`aria-describedby`).
- O `FriendsPanel` reformatado tinha `adding` começando em `true` (o botão abria travado com o spinner e não enviava); com a extração, o estado novo começa em `false`.
- Conferido no navegador (build de produção, contas de teste no teste-login, apagadas) em 1280 e 375: vazio desligado (track); com texto, lime e hover com o gradiente lime-deep; enviando, só o spinner, 72 px antes e durante; enviado, rgb(178, 224, 63) com check, campo vazio, sem mensagem, "Pedido enviado" no aria-live; erro, rgb(194, 37, 92) com X e a explicação; os dois voltam em ~2,5 s. `tsc` e build passam.


## Primeira carga no servidor (dono, 27/11)

- `app/friends/page.tsx` virou Server Component (dinâmico, depende da sessão): confere a sessão; sem conta, o servidor responde com redirect 307 para `/login?next=/friends`, sem abrir a tela antes. Com conta, já busca no banco (`friendLists`) a 1ª página de amigos, a 1ª de enviados e o total de pedidos recebidos, e passa como dados iniciais para o `FriendsPanel`.
- Conta sem username: a tela já abre em "Escolha seu username". Depois de escolher, o painel busca no navegador como antes.
- O painel continua cuidando de aceitar/recusar/remover, do acordeão "Pedidos" (a lista de pedidos é buscada ao abrir, como antes), da troca de página (no navegador, por `/api/friends`), de Desafiar e dos avisos. A conta vinda do servidor também atualiza o cabeçalho e o Menu.
- Sem "Carregando..." ao abrir: o Loading dos pedidos só existe com o acordeão aberto. Sem banco ou sem AUTH_SECRET (ambiente sem conta), a página cai no fluxo antigo, todo no navegador.
- Conferido no navegador (build de produção, massa da @guiizitos) em 1280 e 375: o HTML já traz os amigos e "Pedidos"; 150 ms depois de abrir já há 10 amigos e nenhum "Carregando"; nenhuma busca a `/api/friends` ao abrir; "Seus amigos · 30". Sem conta: 307 para `/login?next=/friends`. Conta sem username: "Escolha seu username" já no HTML. `tsc`, `npm test` e build passam.

## Hover do "Enviar" com o sweep (dono, 27/11)

- O "Enviar" escurecia de uma vez, sem a animação da esquerda para a direita: o botão tinha `transition-colors`, que troca a transição do `sweep-*` (que anima o `background-size`) por uma só de cores. Saiu o `transition-colors`; o sweep já traz as transições do botão.
- Auditoria dos botões lime que escurecem: são só os quatro com `LIME_DARKEN` ("Enviar", "Jogue agora" da janela Desafiar e os dois "Mais" do Mais ou Menos, na carta e na faixa do celular). Nenhum outro botão lime escurece no hover (não há `hover:bg-*` em fundo lime). Os botões lime com `sweep-white` (clareiam) e com `sweep-ink` ("Desafiar um amigo" e "Próximo duelo": o ink entra e o texto fica branco) são outro efeito, de propósito, e ficaram.
- Conferido no navegador (build de produção) em 1280 e 375, com o mouse de verdade: nos quatro, o lime-deep sai de 0% e está em ~45% aos 120 ms e em 100% aos 0,8 s, a partir da esquerda, com o texto ink. `tsc` e build passam.

## Mais informação nos amigos e nos pedidos (dono, 27/11, pedido 8bd98d62)

Só dados que já existem no banco:
- **Seus amigos:** nome e @ em cima; embaixo, pequeno (muted): o placar dos duelos por link com você ("2 × 1 nos duelos", com "(1 empate)" se houver, ou "Sem duelos ainda"), "último duelo há 2 dias" e "amigos desde nov/2026". O placar vem de `link_duels` (as duas partidas salvas na conta, com o mesmo critério de vitória do duelo, `rank`); "amigos desde" é a data da 2ª linha da amizade, que nasce no aceite. No celular o texto ocupa a linha toda (o nome não corta) e os botões descem. O "⋯" tem a mesma altura do "Duelar" (44 px no celular, 36 px no computador).
- **Pedidos:** a lista aberta virou um grid de cartões (2 colunas no computador, 1 no celular), com a paginação de antes. Cada cartão: avatar, nome, @, "pediu há 3 horas · 2 amigos em comum" ("jogando desde nov/2026", pela data da conta, quando não há amigos em comum), e Aceitar/Recusar lado a lado.
- Datas relativas em pt-BR (`lib/relTime.ts`: "agora há pouco", "há 3 horas", "há 2 semanas", "nov/2026").
- Não existe no banco: quando a pessoa jogou pela última vez (o jogo solo fica no navegador) e a sequência dela. Por isso ficaram de fora.
- **Conferido:** `tsc` e `npm test` passam. As consultas novas rodaram no `teste-login` com a massa da @guiizitos (31 amigos, um com duelo "1 × 0" e último duelo; 12 pedidos com data, amigos em comum e data da conta). **Não testado no navegador** (regra nova do dono: o bot de QA valida). Ficam para o QA: o layout em 375 e 1280, o nome sem cortar no celular, o grid dos pedidos e o "⋯" com 44/36 px.
- **Placar à direita (dono, 27/11, 5c747ec1):** o placar dos duelos saiu da linha pequena e foi para a direita, antes do "Duelar": "2 x 0" grande (font-display, ink) com a legenda em grape ("Você lidera", "Você está atrás", "Empate"); sem duelos, só "Sem duelos". A linha pequena ficou "Último duelo há 34 minutos · Amigos desde nov/2026". No celular, o placar, o "Duelar" e o "⋯" descem juntos para a 2ª linha, e o nome não corta. Só `tsc` e `npm test`; não testado no navegador.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), branch `teste-login`, Redis local do QA e contas `qa_*` apagadas no fim (0 restantes). Sem prints. Medido em 1280 e 375. F2, F3 e as salas seguem a 13-escopo-lancamento.md: sem placar de salas e "Duelar" abre o duelo.

- **F1:**
  - Título "Amigos" sem número e sem "‹ Início"; kanji no canto superior direito.
  - Vazio: "Sua turma ainda está vazia" com os 3 passos, o passo 2 com o @ real, sem "Copiar meu link" e sem WhatsApp. "Pedidos · 0" sempre à mostra; aberto, "Nenhum pedido no momento.".
- **Adicionar amigo:**
  - Inexistente: danger + X e "Nenhum jogador tem esse username.", que volta em cerca de 2,5 s.
  - O próprio @: "Esse é o seu próprio username.".
  - Enviado: lime-deep com check, campo limpo e "Pedido enviado" no `aria-live`. O pedido entra em "Pedidos enviados" com Cancelar.
- **F4:**
  - O pedido só aparece para quem recebe: "Pedidos · 1" fechado, `aria-expanded`.
  - Aberto: nome, @, "pediu agora há pouco · jogando desde nov/2026", Aceitar e Recusar com 32 px no computador e 44 px no celular.
  - Aceitar mostra o spinner, tira o pedido e põe o amigo na lista, sem navegar.
- **Lista:**
  - Cada linha tem nome, @, "Amigos desde nov/2026", "Sem duelos" (ou "1 x 0" com "Você lidera" e "Último duelo agora há pouco"), "Duelar" e "⋯" com a mesma altura (36/44 px). O nome não corta.
  - "⋯" tem só "Copiar username" (copia "@nome" e mostra "Copiado!") e "Remover amigo".
  - Remover pede confirmação na linha e tira dos dois lados.
- **F5:** sem abas, sem "mande seu link" e sem "cutucar".
- **F6:** sem rolagem lateral em 1280 e 375. `tsc`, `npm test`, `check:data` e o build passam.
- **Paginação (14):** a 1ª carga vem do servidor, sem `/api/friends`. A página 3 busca só ela (`list=friends&page=3`), com o Loading na lista e a altura igual (702 → 702 e 1222 → 1222 px).

Aprovada pelo QA em 28/11/2026.
