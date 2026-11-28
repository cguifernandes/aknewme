# Menu com perfil e modal "Meu perfil"

Estado: **pedido do dono, aprovado (26/11)**. Referências: print do menu com o perfil no topo e print do modal "Meu perfil". Textos em português.

Observação: a primeira versão foi feita pelo agente de catálogo, fora do fluxo. Esta spec registra o que vale e pede revisão.

## Menu

- Com conta: topo com o perfil (foto 44 px, nome, @ ou "sem @ ainda", seta) → abre o modal "Meu perfil". Depois: Amigos, Salas de hoje (sem contadores), divisória, Como jogar, Estatísticas, Desafios anteriores, divisória, Apoiar o projeto, Seguir no X.
- Rodapé numa linha só: **Sair** em `danger` à esquerda; **Termos** e **Privacidade** à direita (como no print).
- O botão do menu é só o ícone; sem foto nele.
- **Hover:** o dono não gostou do hover atual dos itens. Usar o padrão de hover do projeto de forma consistente em todos os itens (cor entrando da esquerda para a direita, como os botões), inclusive no bloco do perfil; foco de teclado com a mesma aparência.

## Modal "Meu perfil" (primeira versão)

Só o que temos de dado no servidor:
- Título "Meu perfil" e botão de fechar.
- Cartão `grape` (como no print): foto grande com anel, nome em `font-display`, o @ com o chip "Editar @" (ou "Escolher @"), e a linha "Jogando desde DD de mês de AAAA" (data de criação da conta). À direita (embaixo, no celular): botão `lime` "Adicionar amigos" (→ `/friends`).
- Cartão "Conta" (como o do print, sem e-mail): linhas "Seu @ … editar" e "Privacidade → Política de privacidade"; embaixo, "Sair da conta" (contorno) e "Excluir conta" (`danger`, com a confirmação que já existe).
- Fora desta versão (sem dado no servidor): Seu jogo, Por modo, Duelos, Conquistas, nível, contagem de amigos, "entrou com Google", "Compartilhar perfil", e-mail.
- Visual com os componentes, sombras e tokens do projeto (como os outros diálogos: Estatísticas, Duelos).

## Segunda rodada do dono (26/11) — substitui o que conflitar acima

**Menu**
- Hover e foco dos itens (perfil, Amigos, Salas de hoje, Como jogar, Estatísticas, Desafios anteriores, Apoiar, Seguir no X, Sair, rodapé): sem o sweep lime. Só um fundo roxo claro um pouco mais escuro que o painel (ex.: `track` → `mist`), com transição de cor. Foco de teclado igual, mais o contorno `grape`.
- "Entrar" continua como está hoje (grape com sweep lime).
- Menos padding em cima e embaixo dos itens (altura mínima de toque de 44 px no celular; no desktop pode ser menor, ≥ 36 px).

**Sair da conta sem "pulo"**
- Hoje, ao sair, a home aparece com o perfil, o perfil some e só depois a página recarrega (mudança de layout). Ao clicar em Sair: mostrar o carregamento na hora (botão desativado com spinner), limpar o cache da conta e ir direto para a página sem conta, numa navegação só, sem a etapa intermediária.

**Carregamento**
- Volta o spinner do projeto com o texto "Carregando…" ao lado/abaixo, com o texto pulsando (fica mais claro e mais escuro, em loop). Sai a animação do logo preenchendo (08-conta.md, seção 4, fica revogada). Com `prefers-reduced-motion`: sem pulsar.

**Selo de dias seguidos**
- Bolinha do número menor; padding da pílula maior, com o padding de cima, de baixo e da esquerda iguais, para a bolinha ficar centralizada no espaço.

**Modal "Meu perfil"**
- "Editar @" vira **"Editar"** (sem o @). Ao clicar, o @ do cartão vira um campo de texto ali mesmo (com o `@` fixo, a mesma validação ao vivo e as mesmas regras do `/handle`), e o botão "Editar" vira **"Salvar"** (com "Cancelar"). Não leva mais para outra página. Erros e "já tem dono" aparecem embaixo do campo.
- Embaixo do cartão, dois cartões lado a lado (no celular, um embaixo do outro):
  - **Seu jogo** (esquerda, mais largo), como no print de referência: etiqueta "ÚLTIMOS 30 DIAS"; quatro números (dias seguidos em destaque `lime`, recorde de dias, desafios jogados, pistas em média); a grade dos últimos 30 dias com a legenda "acertou o diário" (`lime`), "jogou e errou" (`blush`), "não jogou" (`track`), com hoje marcado; e a linha "N de 30 dias jogados · X% de acerto". Dados do histórico que já existe no navegador (o mesmo das Estatísticas e da sequência). Como os dados são deste aparelho, uma nota pequena "Dados deste aparelho". Sem número inventado.
  - **Conta** (direita), como no print: Seu @ · editar (abre a edição no cartão de cima), Privacidade → Política de privacidade, e os botões Sair da conta e Excluir conta. Sem e-mail (não guardamos).

## Terceira rodada do dono (26/11) — substitui o que conflitar acima

**Menu**
- Sem animação de entrada nos itens (tirar a cascata); o painel pode continuar abrindo como hoje.
- "Sair" e os links "Termos"/"Privacidade" do rodapé: no hover, só o texto escurece (sem fundo). Aplicar o mesmo padrão de "link-botão" aos outros lugares do site que têm esse tipo de link (ex.: tela de Apoiar).

**Selo de dias seguidos**
- O selo sumiu (o dono suspeita que depois de entrar na conta). Deve aparecer na home com ou sem conta, sempre que a sequência for maior que zero. Achar a causa e corrigir.

**Troca de @**
- Remover a tela `/handle`. Toda troca ou escolha de @ passa a ser feita no modal "Meu perfil" (e no passo 2 do login). Links que levavam a `/handle` passam a abrir o modal já em modo de edição; `/handle` redireciona para a home.
- Edição inline: ao clicar em "Editar", o @ do cartão vira um campo **no mesmo lugar** (sem linha nova), e o botão "Editar" vira **"Salvar"**. Sem botão "Cancelar" (Esc ou fechar o modal cancelam). Selo "livre"/"já tem dono" dentro do campo; sugestões e erro numa linha curta logo abaixo, só quando houver.

**Cartão roxo do perfil**
- Sem sombra.

**Cartão "Conta"**
- Linhas: **E-mail** (mascarado, ex.: `g••••@gmail.com`, sem edição), **Usuário** (`@nome · editar`, em vez de "Seu @"), **Privacidade** com os links "Política de privacidade" e "Termos".
- Botões "Sair da conta" e "Excluir conta": em pílula, cada um com 50% da largura, juntos ocupando 100%.

**E-mail (mudança de privacidade, aprovada pelo dono)**
- O login passa a pedir o e-mail: Google `openid profile email`, Discord `identify email`.
- O e-mail **é salvo no banco** (decisão do dono, 26/11): coluna `email` em `users` e o indicador `email_verified` vindo do provedor (Google `email_verified`; Discord `verified`). Gravado/atualizado a cada login.
- Uso: mostrar mascarado no cartão "Conta" e achar a conta em pedidos de suporte ou de exclusão. Não aparece para outros jogadores, não vai para logs e não é usado para e-mail de marketing (isso exigiria consentimento próprio, fora deste escopo).
- Não juntar contas automaticamente por e-mail nesta versão (fica para uma spec própria; só com e-mail verificado).
- Excluir conta apaga o e-mail junto (já acontece com o registro do usuário).
- Contas que entraram antes disso: o e-mail aparece depois do próximo login; até lá, a linha mostra "aparece no próximo login".
- Atualizar `03-seguranca.md` (Dados pessoais: o e-mail passa a ser guardado, com o motivo) e a página `/privacy` (o que é guardado, para quê, por quanto tempo e como apagar).

## Estatísticas no perfil e menu mais curto (dono, 27/11)

- **Com conta:** o card "Seu jogo" da janela Meu perfil vira **"Estatísticas"**, com o mesmo conteúdo e design do diálogo de Estatísticas de hoje (`StatsBoard`, abas por modo: sequência, números, distribuição, último mês, jogos recentes). Reusar o componente, sem duplicar. O item "Estatísticas" sai do menu para quem está logado.
- **Sem conta:** nada muda; "Estatísticas" continua no menu, abrindo o diálogo de hoje.
- O card "Conta" continua ao lado (ou embaixo, se o espaço pedir); "Notificações" continua.
- **"Desafios anteriores" sai do menu** (com e sem conta). Continua acessível pelo card da home ("Mais jogos") e pelo link do fim de jogo.

**Feito (27/11):** `StatsTabs.tsx` (título + abas + `StatsBoard`) é usado pelo diálogo `StatsDialog` (sem conta) e pelo cartão "Estatísticas" da janela Meu perfil (com conta), na largura toda; "Conta" ficou embaixo. `GameCard.tsx` e `lib/profileStats.ts` saíram. Conferido no navegador (build de produção, conta de teste no branch teste-login, apagada no fim) em 1280 e 375: menu sem conta = Entrar, [Duelos no celular], Como jogar, Estatísticas, Apoiar o projeto, Seguir no X; menu com conta sem "Estatísticas" e sem "Desafios anteriores"; cartão do perfil com as 3 abas e o mesmo conteúdo do diálogo, troca de aba por clique e seta, sem rolagem lateral; card do arquivo segue na home. `tsc`, `npm test`, `check:data` e build passam.

### Ajuste (dono, 27/11): Estatísticas compactas no perfil

- No perfil, "Estatísticas" e "Conta" voltam a ficar **lado a lado** (no celular, empilhados).
- Versão **compacta** só no perfil (o diálogo de quem não tem conta continua completo):
  - abas Emoji/Opening/Pistas menores;
  - **sai** a distribuição "Pontos por jogo";
  - fica o **Último mês** (grade com legenda);
  - **Jogos recentes** em versão pequena (poucos itens, uma linha cada);
  - os números de topo (sequência, recorde etc.) numa linha curta, só se couber sem apertar.
- Tem de caber ao lado do card Conta no computador, sem rolagem lateral.

**Feito (27/11):** `StatsCompact.tsx` (faixa com Sequência, Recorde, Jogos e Vitórias; "Último mês" com legenda; 3 jogos recentes, uma linha cada; sem a distribuição e sem "Compartilhar") entra pelo `StatsTabs compact` (abas de 12 px). O "Último mês" virou `MonthCard` em `StatsBoard.tsx`, usado pelas duas versões. No perfil, Estatísticas e Conta ficam lado a lado a partir de 1024 px (Conta com 20rem) e empilhadas abaixo disso. Conferido no navegador (build de produção, conta de teste no branch teste-login, apagada no fim): em 1280, lado a lado (630 px e 320 px), os 4 números numa linha; em 375, empilhadas e números em 2 × 2; sem rolagem lateral nos dois; aba sem jogos com estado vazio pequeno; o diálogo sem conta continua completo (distribuição e "Compartilhar"). `tsc`, `npm test`, `check:data` e build passam.

## Login com Discord no dev e aviso de erro (dono, 27/11)

- **Bug:** no `npm run dev`, entrar com Discord voltava para `/login` com "Não deu para entrar". **Causa:** o Discord devolve `iss=https://discord.com` na volta do login (RFC 9207; o `/.well-known/openid-configuration` dele traz `authorization_response_iss_parameter_supported: true`). O provedor Discord do Auth.js não declara emissor, então ele comparava com o padrão `https://authjs.dev` e recusava a resposta (`OperationProcessingError: unexpected "iss"`). Não era escopo, banco (003–006 aplicadas no teste-login), @ automático, redirect nem segredo (com código falso o Discord responde `invalid_grant`, não `invalid_client`). **Correção:** `issuer: "https://discord.com"` no provedor (`src/auth.ts`). O mesmo vale para produção.
- **Log:** `lib/authLog.ts` registra o tipo do erro e o motivo por baixo dele (código OAuth e status, ou a mensagem da checagem), sem dados pessoais; no `npm run dev` a linha vai também para `.next/auth-errors.log`.
- **Aviso:** o erro do login virou o toast do projeto (`SignInToast` com `place: "top-right"`, `role=alert`), no canto superior direito, que some em 6 s e tem "Fechar"; o `?error=` sai da URL. "Cancelar" no provedor (`OAuthCallbackError`) mostra "Você cancelou o login no Discord." (ou Google); o resto, "Não deu para entrar. Tente de novo."
- **Conferido:** login real com Discord e com Google pelo dono no `localhost:3000`; volta simulada do Discord com `iss` certo passa, com `iss` errado continua recusada; toast medido em 1280 e 375 (16 px do topo e da direita, sem rolagem lateral). `tsc`, `npm test`, `check:data` e build passam.

## Modal "Excluir sua conta?" (dono, 27/11)

Referência: print com o título "Excluir sua conta?", a caixa rosa com a lista e os botões "Cancelar" e "Excluir para sempre".
- Abre ao clicar em "Excluir conta" (no perfil e em `/account`), no padrão de diálogo do projeto.
- **Sem** campo "Digite excluir para confirmar".
- Texto "Isso apaga para sempre:" e uma caixa `blush` clara com a lista, cada item com a primeira letra maiúscula. A lista só fala do que o servidor realmente apaga:
  - "Seus amigos, pedidos de amizade e o placar dos duelos."
  - "Suas salas de duelo e as notificações."
  - "Seu login com Google ou Discord e o e-mail guardado."
  - "O @nome, que fica livre para outra pessoa."
- Nota pequena embaixo da caixa: "A sequência e as estatísticas deste aparelho continuam aqui, sem conta." (elas ficam no navegador e a exclusão não as apaga).
- Números só quando o servidor tem o dado (ex.: "Seus 6 amigos"); sem número inventado.
- Botões lado a lado, em pílula: "Cancelar" (contorno) e "Excluir para sempre" (`danger`, vermelho). Enquanto exclui: spinner no botão e os dois desativados. Depois: sai da conta e vai para a home sem conta, sem "pulo" (mesmo fluxo do Sair).
- Esc e clique fora cancelam.

**Feito (27/11):** `DeleteAccount` (`account/AccountActions.tsx`) abre um `<dialog>` com o título, "Isso apaga para sempre:", a caixa `blush` clara com os quatro itens (o do @ usa o @ real da conta e some se ainda não há @), a nota da sequência e os botões em pílula "Cancelar" e "Excluir para sempre" (`danger`). Sem números: a lista não mostra contagens. A exclusão não toca o localStorage (`leaveAccount` só tira a marca da conta), então a nota vale. Conferido no navegador (build de produção, contas de teste no teste-login, apagadas) em 1280 e 375, no perfil e em `/account`: sem campo de digitar; Esc, clique fora e Cancelar fecham e o perfil continua aberto; ao excluir, spinner e os dois botões desativados, e Esc não fecha; depois vai para `/` sem conta (menu com "Entrar"), o usuário some do banco e o histórico do aparelho fica. `tsc`, `npm test`, `check:data` e build passam.

## Cartão Conta: linha "Legal" (dono, 27/11)

- A linha "Privacidade" quebrava: com o cartão Conta de 20rem (280 px de conteúdo), "Privacidade" + "Política de privacidade" + "Termos" pediam cerca de 300 px, e os links caíam para a linha de baixo. Escolha: o rótulo virou **"Legal"** e o link, **"Privacidade"** (o nome para leitor de tela continua "Política de privacidade"); a linha não quebra mais (`flex-nowrap`), com os links à direita, alinhados ao rótulo.
- Conferido no navegador (build de produção, @guiizitos no teste-login) em 1280 (cartão ao lado de Estatísticas, 320 px), 375 (305 px) e 320 (250 px): as três linhas do cartão (E-mail, Username, Legal) têm uma linha só, com o valor no meio da altura do rótulo e dentro do cartão. `tsc` e build passam.


## Carregamento: padrão único (dono, 27/11)

- Toda tela ou área que carrega usa o mesmo componente: spinner do projeto e, embaixo dele, sempre o texto **"Carregando"** com os **três pontos animados** (aparecem um a um, em loop). Nada de textos diferentes por tela ("Entrando", "Buscando amigos" etc.).
- Vale para login ("Entrando"), `/friends`, sala, perfil e qualquer outro carregamento de área. Spinners pequenos dentro de botões continuam sem texto.
- Com `prefers-reduced-motion`: "Carregando..." parado.

## Quarta rodada do dono (27/11)

**Modal "Meu perfil"**
- Mais largo, para os rótulos dos cards de "Seu jogo" não quebrarem linha.
- Números dos quatro cards de "Seu jogo" um pouco maiores.
- Rótulos com a primeira letra maiúscula: "Dias seguidos", "Recorde de dias", "Desafios jogados", "Pistas em média"; legenda "Acertou o diário", "Jogou e errou", "Não jogou".
- Tirar a nota "Dados deste aparelho".
- Card "Conta": tirar o "· editar" da linha Usuário (a edição fica só no "Editar" do cartão roxo). Linha E-mail: se não houver e-mail, a linha não aparece (sem "aparece no próximo login"). Linha Privacidade: os links "Política de privacidade" e "Termos" alinhados à direita, como os outros valores.
- "Sair da conta" e "Excluir conta" com a animação de botão do projeto (sweep), mantendo as cores atuais (contorno ink e `danger`).
- "Adicionar amigos" continua levando a `/friends`.

## Critérios de aceite

- M1. Menu igual à lista acima, com o rodapé Sair | Termos Privacidade.
- M2. Hover e foco dos itens do menu no padrão do projeto, iguais em todos os itens.
- M3. Modal com o cartão e a seção Conta; nenhum dado inventado.
- M4. 375 px sem rolagem lateral; Esc fecha; foco volta ao menu.
- M5. `tsc`, `npm test`, `npm run check:data`, `npm run build` passam.

## Evidências (26/11, sem commit e sem deploy)

Revisão da 1ª versão (feita fora do fluxo):
- O `Loading.tsx` tinha virado um spinner. Voltou a ser o logo preenchendo em loop, como pede a 08-conta.md (seção 4).
- No `useMenu.ts`, a cascata dos itens tinha sido tirada e o recuo lateral tinha mudado. A cascata voltou.
- O `AccountMenu.tsx` já tinha sido apagado, e nada o importava.
- `lib/account.ts` e `lib/users.ts`: o `created_at` em `/api/me` ficou, porque é o "Jogando desde". O cache da conta continua só com id, nome, @ e foto.

M1 a M5:
- Menu (`header/SiteMenu.tsx`, `header/useMenu.ts`): perfil no topo (foto 44 px, nome, @, seta), Amigos e Salas de hoje. O rodapé fica numa linha: Sair (`danger`) à esquerda, Termos e Privacidade à direita.
- Todos os itens, inclusive o perfil, Entrar e o rodapé, têm o mesmo hover e foco: `sweep-lime` (a cor entra da esquerda), e o foco tem também o contorno grape. A conferência no Chrome mostrou o fundo cheio no hover e no foco por teclado em cada item, nos 12 itens a 375 px e nos 11 a 1280 px.
- Janela "Meu perfil" (`ProfileDialog.tsx`):
  - cartão `grape` com a foto com anel, o nome, o @ com o chip "Editar @", "Jogando desde 26 de novembro de 2026" e o botão `lime` "Adicionar amigos";
  - cartão Conta com "Seu @ · editar", "Política de privacidade", "Sair da conta" (contorno) e "Excluir conta" (com a confirmação).
  - O teste confere que a janela não tem e-mail, conquistas, duelos, compartilhar, nível, "Seu jogo" nem "Por modo".
- Sem rolagem lateral em 375 e 1280 px; Esc fecha e o foco volta ao botão Menu.
- A foto padrão usa as iniciais do primeiro e do último nome (GF), como no print.
- `tsc`, `npm test`, `npm run check:data` e o build passam.
- Prints em `OpenBot\Shared\aknewme-design\menu-perfil\`: `menu-hover-1280/375`, `perfil-1280/375`, `header-1280` e `carregando-375`. Foram tirados com uma conta de teste no branch `teste-login`, apagada no fim (0 restantes).

## Evidências da segunda rodada (26/11, sem commit e sem deploy)

- **Menu** (`header/useMenu.ts`, `header/SiteMenu.tsx`):
  - Hover e foco dos itens: fundo `track`, com transição de cor e sem sweep. O bloco do perfil, que já tem fundo `track`, passa a `mist`. O `track` foi escolhido para os itens porque o Sair em `danger` fica com 4,4:1 sobre o `mist`, e com o `track` passa (4,7:1).
  - "Entrar" continua com o `sweep-lime`.
  - Altura dos itens: 44 px no celular e 36 px no computador, medidos no Chrome.
- **Sair sem pulo** (`account/leave.ts`, `forgetAccountQuietly` em `lib/account.ts`):
  - O spinner aparece no Sair na hora, e o Menu fica aberto.
  - O cookie é apagado no servidor e o cache é limpo sem redesenhar a página. Depois vem uma navegação só para a mesma página, já sem conta.
  - O teste confirmou que o perfil fica na tela até a troca de página e que houve 1 navegação. Na página nova, o `/api/me` responde 401 e o Menu começa com "Entrar".
  - "Sair da conta" e "Excluir conta" usam o mesmo caminho.
- **Carregamento** (`Loading.tsx`):
  - O spinner do projeto voltou, com "Carregando…" pulsando (`animate-pulse`) e parado com movimento reduzido.
  - A animação do logo e o `--animate-logo-fill` saíram de `globals.css`.
- **Selo** (`header/StreakBadge.tsx`): bolinha de 28 px na pílula de 40 px, com 6 px de folga em cima, embaixo e à esquerda (medido). No celular continua só a bolinha, de 36 px, para o toque.
- **Janela Meu perfil** (`ProfileDialog.tsx`, `account/InlineHandle.tsx`, `account/GameCard.tsx`):
  - "Editar" abre o campo do @ no próprio cartão, numa linha inteira embaixo da foto. A verificação ao vivo e as regras são as do `/handle`: o `useHandleCheck` agora é o mesmo para o `HandleStep` e para a janela.
  - O campo mostra "Salvar", "Cancelar", "já tem dono" com as sugestões livres, e os erros. Esc cancela a edição sem fechar a janela. Salvar grava sem sair da página, e o cabeçalho passa a mostrar o @ novo.
  - Card "Seu jogo": últimos 30 dias calculados por `lib/profileStats.ts` (testado em `check-streak.mjs`) a partir do histórico deste aparelho. Mostra dias seguidos, recorde, desafios jogados, pistas em média, a grade com legenda e o dia de hoje marcado, "N de 30 dias jogados · X% de acerto" e "Dados deste aparelho".
  - Card "Conta": Seu @ · editar, Política de privacidade, Sair da conta e Excluir conta. Sem e-mail.
  - No celular, os cards ficam empilhados. Nenhuma largura tem rolagem lateral.
- `tsc`, `npm test`, `npm run check`, `check:data` e o build passam.
- Prints em `OpenBot\Shared\aknewme-design\menu-perfil-2\`: menu com hover num item e no Entrar, selo, janela normal e editando, e carregamento, em 375 e 1280 px. Foram tirados com 2 contas de teste no `teste-login`, apagadas no fim (0 restantes).

## Evidências da terceira rodada (26/11, sem commit e sem deploy)

- **Selo sumindo: causa encontrada.**
  - A sequência (`aknewme.streak`) guardava e comparava a data em UTC (`toISOString`), mas o desafio vira à meia-noite local. No Brasil, das 21:00 à meia-noite o "hoje" em UTC já é o dia seguinte. Quem tinha jogado no dia anterior ficava com a sequência zerada nesse horário e o selo sumia, com ou sem conta.
  - Jogar nesse horário também gravava o dia seguinte e podia não somar o dia.
  - O login não tinha relação: o dono testou à noite.
  - Correção: `localDate`/`streakAlive` em `lib/streak.ts`, usados em `getStreak`/`recordPlay`/`streakLastDay` (`lib/game.ts`). Datas já gravadas em UTC, um dia à frente, continuam valendo.
  - Teste: `check-streak.mjs`, às 21:30 de Brasília, cobre jogou ontem, gravado em UTC e perdeu um dia. No Chrome, às 21:32, uma conta com a sequência de ontem mostra o selo em 1280 e 375 px.
- **Menu:**
  - Sem a animação de entrada nos itens (a cascata saiu do `useMenu.ts`).
  - Sair, Termos e Privacidade viraram link-botão: sem fundo, e no hover e no foco só o texto escurece (`danger` → token novo `danger-deep`, 7,9:1; `grape` → `grape-deep`).
  - O mesmo padrão (`LINK` em `account/ui.tsx`, com transição) foi para o link do X na tela de Apoiar e para os links do cartão Conta.
- **`/handle` saiu:**
  - A página só redireciona para a home (307, conferido). `HandleForm.tsx` foi apagado.
  - `openProfileEdit` (`account/profileEdit.ts`) abre a janela já editando. Quem usa: o toast do @ automático (botão "Trocar"), `/account` ("Trocar"), a seção Conta de Amigos ("Trocar meu @") e Amigos/criar sala sem @ (`NeedHandle`, que segue sozinho quando o @ é salvo).
  - O passo 2 do login continua com o `HandleStep`.
- **Edição no mesmo lugar** (`account/InlineHandle.tsx`):
  - O "@nome" vira um campo na mesma linha e o "Editar" vira "Salvar". Não há Cancelar: Esc desfaz a edição, e fechar a janela também.
  - O selo "livre"/"já tem dono" fica dentro do campo. "Livres: …" ou o erro aparecem numa linha curta embaixo, só quando há.
  - No celular, a foto fica em cima, e o @ e o Salvar dividem a linha.
- **Cartão roxo:** sem sombra (conferido: `box-shadow: none`).
- **Cartão Conta:**
  - E-mail mascarado (`g••••@example.com`), ou "aparece no próximo login".
  - "Usuário: @nome · editar".
  - Privacidade com "Política de privacidade" e "Termos".
  - "Sair da conta" e "Excluir conta" em pílula, metade cada (131 + 131 de 270 px em 1280; 127 + 127 de 261 em 375). A confirmação de excluir ocupa a linha toda.
- **E-mail** (decisão do dono: salvar no banco):
  - Escopos Google `openid profile email` e Discord `identify email`.
  - Migração `003_user_email.sql` (`email`, `email_verified`) aplicada no `teste-login` com `npm run db:migrate -- --dev`, que é uma opção nova; rodada de novo, deu "já aplicada".
  - `upsertAccount` grava e atualiza a cada login. Se o provedor não mandar o e-mail, fica o que já estava.
  - `/api/me` devolve só a versão mascarada, e o completo não sai do servidor.
  - Teste no `teste-login` (`apitest/email-test.mjs`, fora do repositório): grava, atualiza, mantém e apaga junto ao excluir a conta. As contas de teste foram apagadas (0 restantes).
  - `03-seguranca.md` e `/privacy` foram atualizadas.
  - **Antes do deploy: rodar `npm run db:migrate` no banco principal.**
- `tsc`, `npm test`, `npm run check`, `check:data` e o build passam.
- Prints em `OpenBot\Shared\aknewme-design\menu-perfil-3\`: hover em Sair e em Termos, selo com conta, janela normal e editando, em 375 e 1280 px. Foram tirados com 2 contas de teste no `teste-login`, apagadas no fim (0 contas e 0 e-mails restantes).

**Rodapé do menu sem fundo (26/11, pedido b0da6e96).**
- O que se viu: o `hover:bg-track` (roxo claro) da segunda rodada, que a terceira rodada já tinha tirado.
- O servidor de dev (`:3000`) estava parado na hora da checagem, e o código atual não pinta fundo.
- Blindagem extra:
  - sem o realce de toque do celular (`-webkit-tap-highlight-color: transparent`);
  - sem contorno no foco por teclado (texto mais escuro e sublinhado de 2 px);
  - `bg-transparent` explícito.
- Teste com o mouse de verdade (CDP: mover, apertar e soltar fora), teclado e toque, a 1280 e 375 px: sem fundo, sombra ou contorno em nenhum estado.

## Evidências da quarta rodada (27/11, sem commit e sem deploy)

- **Selo que não aparecia: causa.**
  - O selo só era desenhado com sequência maior que zero (`if (streak <= 0) return null` em `header/StreakBadge.tsx`). Com sequência 0 ele sumia inteiro, com ou sem conta.
  - A sequência fica no navegador (`aknewme.streak`), por endereço. Ela é 0 em três casos: não jogou ontem nem hoje; navegador sem histórico; ou o endereço é outro (o `localhost:3000` do `npm run dev` não enxerga o que foi jogado em aknewme.com).
  - Não tenho acesso ao navegador do dono para dizer qual dos três é o dele. O login, a lista `aknewme.played` e o fuso não escondem o selo: a migração da lista só alimenta o painel, e o fuso foi corrigido na terceira rodada.
  - Correção: o selo aparece sempre na home, também com 0 ("0 · Dias seguidos · Jogue hoje"). O painel, com 0, diz "Jogue o desafio de hoje para começar uma sequência."
  - Conferido com conta logada e navegador sem nenhum histórico: selo à esquerda do Duelos em 1280 px e a bolinha com 0 em 375 px.
- **Janela Meu perfil:**
  - Largura de 54 para 64 rem (1024 px em 1280). Os quatro rótulos de "Seu jogo" ficam numa linha, nas duas larguras.
  - Números dos quatro cards com 36 px (eram 30).
  - Rótulos e legenda com a primeira maiúscula. A nota "Dados deste aparelho" saiu.
  - Conta: a linha Usuário mostra só o @ (sem "· editar"; sem @ ainda, fica o atalho "escolher"). A linha E-mail só aparece quando há e-mail. Os links de privacidade ficam encostados à direita.
  - "Sair da conta" (contorno `ink`) e "Excluir conta" (contorno `danger`) com o sweep do projeto: no hover a cor entra da esquerda e o texto fica branco (5,7:1 sobre o `danger`).
- **Mais ou Menos:** os botões já usavam Font Awesome (`faUpLong`/`faDownLong`, dentro de uma bolinha no computador). Agora são `faArrowUp` e `faArrowDown` soltos, do tamanho e da cor do texto, no computador e no celular.
- `tsc`, `npm test`, `check:data` e o build passam.
- Prints em `OpenBot\Shared\aknewme-design\perfil-rodada-4\`. Foram tirados com 2 contas de teste no `teste-login`, apagadas no fim (0 restantes).

## Evidências: carregamento único e ajustes do perfil (27/11, sem commit e sem deploy)

- **Carregamento único** (`components/Loading.tsx`): spinner do projeto e, embaixo, sempre "Carregando" com três pontos que aparecem um a um, em loop de 1,4 s. O componente não aceita mais texto por tela.
  - Usos unificados (7): login ("Entrando"), `/friends`, `/account`, `/room/new`, a sala e "Conferindo sua partida" dentro da sala.
  - Os spinners pequenos de dentro dos botões e a bolinha do campo do @ continuam sem texto.
  - Medido no Chrome, no login e em `/friends`, em 375 e 1280 px: texto "Carregando...", os pontos passam por 0, 1, 2 e 3 visíveis, e a largura do texto não muda (99 px). Com movimento reduzido, os três pontos ficam parados.
- **Sem o selo "@ definitivo":** quem já usou a troca vê só o @, sem "Editar", na janela e em `/account`.
- **"Adicionar amigos":** no canto superior direito do cartão roxo no computador (24 px do topo e da direita). No celular continua embaixo, na largura toda, sem cobrir o nome.
- **Botões da Conta:** "Sair da conta" e "Excluir conta" agora são pílulas de verdade. Antes o `rounded-lg` da classe base ganhava do `rounded-full`. Cores, sweep e metade da largura cada um continuam (162 + 162 px em 1280; 127 + 127 em 375).
- `tsc`, `npm test` e o build passam. Sem prints, por decisão do dono (27/11): a conferência foi por medição no navegador.

## Abas das Estatísticas sem sweep (dono, 27/11)

- As abas Emoji/Opening/Pistas (`StatsTabs`, no diálogo e no perfil) não usam mais o sweep no hover: a aba não escolhida ganha fundo `lavender` numa transição curta (150 ms); a escolhida não muda. Foco de teclado: contorno `grape`. Outras abas/seletores parecidos (o de modo do `NextDuel`) já trocavam só a cor.
- Conferido: hover na aba não escolhida com fundo lavender e sem imagem de fundo; a escolhida em grape; foco por seta com contorno grape.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), branch `teste-login` e contas `qa_*` apagadas no fim (0 restantes). Sem prints. Medido em 1280 e 375, com o mouse e o teclado de verdade (CDP). Vale a regra mais nova de cada rodada.

- **M1 (Menu):**
  - Sem conta: Entrar (grape com sweep lime), [Duelos no celular], Como jogar, Estatísticas, Apoiar o projeto e Seguir no X.
  - Com conta: o perfil no topo (foto de 44 px, nome, @, seta), Amigos, Duelos, Como jogar, Apoiar e Seguir no X. Sem Estatísticas, sem Desafios anteriores, sem Salas de hoje e sem "Meu @".
  - Rodapé numa linha: Sair em danger à esquerda; Termos e Privacidade à direita.
  - O botão do Menu é só o ícone.
- **M2 (hover e foco):**
  - Os itens ganham fundo `track` rgb(237, 232, 255) no hover, sem sweep. O perfil passa de `track` a `mist` rgb(230, 222, 255).
  - No rodapé só o texto escurece: Sair → rgb(156, 26, 72), Termos e Privacidade → rgb(58, 28, 184).
  - Foco por teclado: fundo `track` + contorno grape de 2 px.
  - Sem cascata na entrada. Altura dos itens: 36 px no computador e 44 px no celular.
  - No celular (toque) não há hover, como esperado.
- **M3 (Meu perfil):**
  - Janela de 1024 px em 1280. O cartão grape não tem sombra e traz "Editar" e "Jogando desde DD de mês de AAAA".
  - "Adicionar amigos" leva a `/friends`: fica a 24 px do topo e da direita no computador, e embaixo, na largura toda, no celular.
  - Estatísticas compactas: abas de 12 px, Sequência/Recorde/Jogos/Vitórias e Último mês, sem a distribuição e sem Compartilhar. A aba não escolhida ganha lavender no hover, sem sweep, e a seta troca a aba.
  - Estatísticas e Conta ficam lado a lado no computador (Conta com 320 px) e empilhadas no celular.
  - Conta: E-mail mascarado (`g••••@example.com`; o completo não aparece), Username e Legal (Privacidade e Termos). Todas as linhas numa linha só, dentro do cartão.
  - "Sair da conta" e "Excluir conta" em pílula, metade cada (134+134 px em 1280, 127+127 px em 375).
- **Sem conta:** o diálogo de Estatísticas continua completo, com a distribuição e Compartilhar.
- **M4:** sem rolagem lateral com o Menu e a janela abertos. Esc fecha o Menu (o foco volta ao botão) e a janela. Clique fora também fecha.
- **`/handle`:** redireciona para a home (307).
- **Erro do login:**
  - Discord cancelado: "Você cancelou o login no Discord." em `role=alert`, a 16 px do topo e da borda visível. Em 1280 a medida deu 31 px até o fim da janela, que inclui a barra de rolagem de 15 px.
  - O `?error=` sai do endereço. Outro erro mostra "Não deu para entrar. Tente de novo.".
- **Excluir sua conta?** (conferido na 08): sem campo de digitar, lista sem salas, a nota da sequência, Esc cancela, os botões ficam desativados durante a exclusão e depois a home abre sem conta.
- **M5:** `tsc`, `npm test`, `check:data` e o build passam.

Aprovada pelo QA em 28/11/2026.
