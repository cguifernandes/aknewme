# Nome de usuário (@) no login

Estado: **pedido do dono, aprovado (26/11)**. Referência visual: três prints da tela "Escolha seu @" (vazio, "livre ✓" e "já tem dono" com sugestões). Textos em português; rotas em inglês.

## 1. Termo

- Na interface, "handle" vira **@** ("seu @", "Salvar meu @", "Adicionar pelo @") e, em frases, **nome de usuário**. A palavra "handle" não aparece mais para o usuário (telas de conta, amigos, sala, termos e privacidade).
- No código, nas rotas (`/handle`) e no banco, nada muda.

## 2. @ automático no primeiro login

Ao entrar pela primeira vez, o servidor tenta criar o @ sozinho:
- **Discord:** o nome de usuário do Discord (`username`, escopo `identify`, sem pedir nada a mais).
- **Google:** o nome da conta (escopo `profile`), convertido: minúsculas, sem acento, espaços viram `_`, só `a-z`, `0-9` e `_`, de 3 a 20 caracteres.
- Se o @ gerado for **válido, livre e não reservado**, ele é salvo, a pessoa vai direto para onde estava (`next`, ou a home) sem aviso na tela (o toast foi removido em 27/11; a troca fica no perfil).
- Se **não der** (inválido, já tem dono ou reservado), a pessoa vê o passo 2 (seção 3), com o campo já preenchido com a sugestão e as alternativas livres.
- O @ criado automaticamente **não conta** como troca no limite de trocas.
- Nenhum dado novo é guardado: só o @ resultante. Sem e-mail.

## 3. Passo 2 dentro da tela de login

Quando o passo 2 for necessário, ele aparece **na própria tela de login**, no lado branco, no lugar dos botões de Google e Discord (o painel roxo da esquerda fica). Transição: os botões saem e o passo 2 entra deslizando, com o movimento que o projeto já usa; sem animação com `prefers-reduced-motion`.

Conteúdo (como nos prints):
- Indicador "Passo 2 de 2 · último" com dois tracinhos `grape`.
- Título "Escolha seu @" e o subtítulo "É por ele que seus amigos te acham e te desafiam."
- Campo com `@` fixo à esquerda e placeholder `seu_nome`. Contador `N/20` à direita, embaixo; à esquerda, "Letras minúsculas, números e _".
- Selo dentro do campo, à direita: "livre ✓" (`lime`) ou "já tem dono" (`blush`), com a borda do campo na mesma família de cor.
- Quando já tem dono: "Esse já foi. Tenta um desses:" e três sugestões livres em pílulas clicáveis ("Livres: @nome_ @nome200 @nome_anime").
- Cartão de prévia "Assim te veem nos duelos": avatar (foto ou iniciais em `lime`), nome e o @ em `grape`.
- Botão "Salvar meu @": botão `lime` do projeto (com a sombra inferior e o sweep); desativado em `track` enquanto o @ não é válido e livre.
- Texto embaixo: a regra real de troca (hoje "Dá para trocar depois, até 3 vezes a cada 30 dias.").
- Link "Fazer depois" no topo à direita (ou abaixo do botão, no celular): segue sem @, como hoje.
- Sem o cabeçalho e o menu do site nessa etapa.

A rota `/handle` continua existindo para trocar o @ depois, com o mesmo visual (sem o indicador de passo e com o título "Trocar seu @").

## 4. Menu

- Com conta, o menu ganha o item **"Meu @nome"**, que leva à troca de @ (`/handle`).

## 5. Indicador de disponibilidade (dono, 27/11)

Vale para todo campo de @ (passo 2 do login e edição no modal "Meu perfil"):
- Sai o selo de texto ("livre ✓" / "já tem dono"). No lugar, uma **bolinha** de tamanho fixo (ex.: 28 px) dentro do campo, à direita. A largura e a altura **nunca mudam** entre os estados (campo e bolinha não pulam).
- Estados da bolinha:
  - **verificando** (enquanto digita e enquanto espera o servidor): spinner do projeto inteiro e visível, centrado na bolinha;
  - **livre**: check (ícone do projeto) em `ink` sobre `lime`; o botão "Salvar" fica ativo;
  - **já tem dono / reservado / não permitido**: X em `ink` sobre `blush`; a explicação continua na linha curta embaixo do campo ("Esse já foi. Tenta um desses:" com as sugestões, ou "Esse @ não é permitido.");
  - **vazio ou formato inválido**: bolinha vazia (só o contorno) e a regra de formato embaixo.
- O botão "Salvar" só fica ativo no estado livre.
- Para leitor de tela, a bolinha tem texto escondido ("Verificando", "Disponível", "Já tem dono") com `aria-live="polite"`.

## Critérios de aceite

- U1. Login com Discord cujo usuário está livre: entra direto, sem passo 2 e sem aviso.
- U2. Login com Google com nome que vira um @ livre: idem.
- U3. Nome que vira um @ já usado: aparece o passo 2 na tela de login, com o selo "já tem dono" e três sugestões livres.
- U4. O @ automático não conta no limite de trocas.
- U5. Nenhum texto da interface usa "handle".
- U6. Passo 2 cabe em 375 px sem rolagem lateral; botões ≥ 44 px; foco visível; erros com `role="alert"`.
- U7. `tsc`, `npm test`, `npm run check:data`, `npm run build` passam.

## Evidências: regra do @ e indicador (27/11, sem commit e sem deploy)

**Regra do @ (01-requisitos.md, R5b a R5f)**
- A regra fica num lugar só, `src/lib/handle.ts`: `MAX_HANDLE_CHANGES = 1`, `HANDLE_HOLD_DAYS = 30` e os textos (`HANDLE_TEXT`).
- Estados da conta: sem @, provisório (criado no login), escolhido (resta uma troca) e definitivo. O `/api/me` devolve `handleState`.
- Servidor (`lib/handleChange.ts`, `api/me/handle`):
  - a escolha saindo do @ provisório, ou de nenhum @, é livre e não conta;
  - depois, uma troca; a segunda é recusada com `409 handle_final`, para sempre;
  - o @ antigo fica guardado para a mesma conta por 30 dias.
- Migração `006_handle_rule.sql`: coluna `users.handle_auto`. As trocas (`handle_changes`) não são mais apagadas.
- Contas que já tinham @ antes desta mudança contam como "@ escolhido": resta uma troca, mesmo que o @ delas tenha sido criado sozinho no login (não havia registro disso).
- Telas:
  - na escolha livre: "Escolha com calma: depois disso, você só pode trocar uma vez." (passo 2 do login e janela Meu perfil);
  - na troca: "Você só pode trocar seu @ uma vez." e, ao salvar, a confirmação "Trocar para @novo? Depois disso, só o suporte pode mudar seu @." com "Trocar" e "Voltar";
  - depois da troca: "@ definitivo" no lugar do "Editar", na janela e em `/account`.
  - o aviso do 1º login passou a dizer "Seu @ é @nome. Ele é provisório: você pode escolher outro."
- `/terms` traz o texto do R5d. A `/privacy` diz que a data da troca fica guardada até a conta ser excluída.
- R5e (suporte) é processo, sem tela: não há nada no código para o suporte trocar o @ ou desfazer uma troca.

**Filtro de @ ofensivo (R5f)**
- `src/lib/handleFilter.ts`: duas listas num arquivo só. Uma bloqueia o termo em qualquer lugar do @; a outra, de termos curtos, só quando é o @ inteiro ou uma parte separada por `_`.
- Normaliza `0→o`, `1→i` e `l`, `3→e`, `4→a`, `5→s`, `7→t`, e ignora os `_`.
- Vale no @ automático (nome ofensivo cai no passo 2, sem @), na verificação ao vivo, na escolha, na troca e nas sugestões. Mensagem: "Esse @ não é permitido. Escolha outro."
- Letras repetidas ("fuuuck") não são tratadas: juntar letras bloquearia palavras normais.
- Teste `scripts/check-handle.mjs` (no `npm test`): 24 casos bloqueados, 18 com troca de letras ou `_`, 64 @ normais liberados (nomes e palavras como "computador", "grape", "therapist") e todos os títulos e apelidos do catálogo liberados.

**Indicador de disponibilidade (seção 5)**
- `account/HandleDot.tsx`: bolinha de 28 px dentro do campo, à direita, no passo 2 do login e na janela Meu perfil. Sai o selo de texto.
- Estados: só o contorno (vazio ou inválido), spinner de 16 px centrado (verificando), check em `ink` sobre `lime` (livre) e X em `ink` sobre `blush` (já tem dono, reservado ou não permitido). Texto para leitor de tela com `aria-live`.
- "Salvar" só fica ativo no estado livre.
- Medido no Chrome nos 4 estados, nos dois lugares, em 375 e 1280 px: a bolinha tem sempre 28×28 e fica na mesma posição, e o campo não muda de tamanho.

**Testes**
- Servidor, com contas no `teste-login` (apagadas, 0 restantes): escolha livre saindo do automático não conta; uma troca ok; a segunda recusada; o @ antigo guardado; nome ofensivo fica sem @ automático.
- Navegador: escolha livre sem confirmação; a troca pede confirmação e nada é gravado antes dela; depois, "@ definitivo" sem "Editar"; `POST` da segunda troca responde `409 handle_final`; @ ofensivo responde `400 offensive`.
- `tsc`, `npm test`, `npm run check`, `check:data` e o build passam.
- **Antes do deploy:** rodar `npm run db:migrate` no banco principal (003 a 006). No `teste-login` já está aplicada.
- Prints em `OpenBot\Shared\aknewme-design\regra-do-arroba\`.

**Ajuste da confirmação (27/11).** O texto passou a ser "Trocar para @novo? Não dá para mudar depois.", e a caixa tem a mesma largura do campo do @ acima dela (medido: bordas iguais em 1280 e 375 px). Os botões "Trocar" e "Voltar" continuam. Prints: `confirmacao-1280` e `confirmacao-375` em `OpenBot\Shared\aknewme-design\regra-do-arroba\`; o print antigo da confirmação foi removido.

## Sem o aviso do @ automático (dono, 27/11)

- O toast "Seu @ é @nome. Ele é provisório: você pode escolher outro." do 1º login saiu: menos avisos na tela. O @ automático continua sendo criado (`autoHandle`), provisório como antes, e a troca segue no perfil ("Editar" no cartão roxo).
- Saíram junto o que só servia a ele: o `auto` do JWT, o `autoHandle` da sessão e do `/api/me`, e o botão "Trocar" do `SignInToast` (o toast continua para notificações e erro de login).
- Conferido no navegador (build de produção, conta de teste no teste-login, apagada no fim): login de volta com @ automático vai direto para a página, sem toast; `/api/me` sem `autoHandle`. `tsc`, `npm test`, `check:data` e build passam.

## "username" no lugar de "@" nos textos (dono, 27/11)

Onde a interface chamava o @ de "@" ou "nome de usuário", agora diz "username". O "@" antes do valor (ex.: @gisitos) e o "@" fixo nos campos continuam. Textos trocados:

- `src/components/account/AccountPage.tsx`: <p className="text-muted">sem @ ainda</p> → <p className="text-muted">sem username ainda</p>
- `src/components/account/AccountPage.tsx`: Seu @ → Seu username
- `src/components/account/AccountPage.tsx`: "Você ainda não escolheu um @." → "Você ainda não escolheu um username."
- `src/components/account/AccountPage.tsx`: "Escolher meu @" → "Escolher username"
- `src/components/account/AccountPage.tsx`: suas salas e seu @. Pede confirmação antes. → suas salas e seu username. Pede confirmação antes.
- `src/components/account/EmptyFriends.tsx`: ["Adicione pelo @", "Digite o @ do seu amigo em Adicionar amigo."] → ["Adicione pelo username", "Digite o username do seu amigo em Adicionar amigo."]
- `src/components/account/EmptyFriends.tsx`: `Passe o seu @${ → `Passe o seu username${
- `src/components/account/FriendsPanel.tsx`: "Nenhum jogador tem esse @." → "Nenhum jogador tem esse username."
- `src/components/account/FriendsPanel.tsx`: "O @ tem de 3 a 20 caracteres: letras minúsculas, números ou _." → "O username tem de 3 a 20 caracteres: letras minúsculas, números ou _."
- `src/components/account/FriendsPanel.tsx`: "Esse é o seu próprio @." → "Esse é o seu próprio username."
- `src/components/account/FriendsPanel.tsx`: "Seus amigos te acham pelo @. Escolha o seu para adicionar amigos." → "Seus amigos te acham pelo username. Escolha o seu para adicionar amigos."
- `src/components/account/FriendsPanel.tsx`: aria-label="@ do amigo" → aria-label="Username do amigo"
- `src/components/account/FriendsPanel.tsx`: Seu @ é <strong className="text-white"> → Seu username é <strong className="text-white">
- `src/components/account/HandleStep.tsx`: "Escolha seu @" : "Trocar seu @" → "Escolha seu username" : "Trocar seu username"
- `src/components/account/HandleStep.tsx`: Seu @ (nome de usuário) → Seu username
- `src/components/account/HandleStep.tsx`: Salvar meu @ → Salvar username
- `src/components/account/InlineHandle.tsx`: aria-label="Seu novo @" → aria-label="Seu novo username"
- `src/components/account/InlineHandle.tsx`: aria-label="Confirmar a troca do @" → aria-label="Confirmar a troca do username"
- `src/components/account/LoginCard.tsx`: "Escolha seu @" → "Escolha seu username"
- `src/components/account/NeedHandle.tsx`: <Title>Escolha seu @.</Title> → <Title>Escolha seu username.</Title>
- `src/components/account/NeedHandle.tsx`: Escolher meu @ → Escolher username
- `src/components/account/NewRoom.tsx`: "Seus amigos te acham pelo @. Escolha o seu para abrir uma sala." → "Seus amigos te acham pelo username. Escolha o seu para abrir uma sala."
- `src/components/account/useHandleCheck.ts`: "Você já usou sua troca de @. Agora só o suporte pode mudar." → "Você já usou sua troca de username. Agora só o suporte pode mudar."
- `src/components/header/SiteMenu.tsx`: >sem @ ainda</span> → >sem username ainda</span>
- `src/components/ProfileDialog.tsx`: <span className="text-on-grape">sem @ ainda</span> → <span className="text-on-grape">sem username ainda</span>
- `src/components/ProfileDialog.tsx`: aria-label={userHandle ? "Editar seu @" : "Escolher seu @"} → aria-label={userHandle ? "Editar seu username" : "Escolher seu username"}
- `src/components/ProfileDialog.tsx`: {userHandle ? "Editar" : "Escolher @"} → {userHandle ? "Editar" : "Escolher username"}
- `src/components/ProfileDialog.tsx`: <dt className="font-semibold text-muted">Usuário</dt> → <dt className="font-semibold text-muted">Username</dt>
- `src/lib/handle.ts`: once: "Você só pode trocar seu @ uma vez." → once: "Você só pode trocar seu username uma vez."
- `src/lib/handle.ts`: offensive: "Esse @ não é permitido. Escolha outro." → offensive: "Esse username não é permitido. Escolha outro."
- `src/app/privacy/page.tsx`: O nome de usuário (@) que você escolhe, para seus amigos te encontrarem. Quando você troca de @, o anterior fica guardado para a sua conta por 30 dias. Guardamos também a data da troca e se o seu @ atual foi criado automaticamente no login → O username (@) que você escolhe, para seus amigos te encontrarem. Quando você troca de username, o anterior fica guardado para a sua conta por 30 dias. Guardamos também a data da troca e se o seu username atual foi criado automaticamente no login
- `src/app/privacy/page.tsx`: não incluem seu nome, seu @, seu e-mail nem tokens → não incluem seu nome, seu username, seu e-mail nem tokens
- `src/app/privacy/page.tsx`: te encontrar pelo seu @, te convidar → te encontrar pelo seu username, te convidar
- `src/app/terms/page.tsx`: Você escolhe seu @ ao entrar e pode trocá-lo uma única vez. → Você escolhe seu username ao entrar e pode trocá-lo uma única vez.
- `src/app/terms/page.tsx`: Podemos remover um @ ofensivo → Podemos remover um username ofensivo

`scripts/check-handle.mjs` passou a esperar os textos novos de `HANDLE_TEXT`.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), branch `teste-login`, Redis local do QA e contas `qa_*` apagadas no fim (0 restantes). Sem prints.

- **Servidor:**
  - @ automático é provisório; a 1ª escolha é livre e não grava troca; a única troca leva a "final"; a 2ª troca dá 409 `handle_final`, mesmo para voltar ao próprio @ guardado.
  - O @ antigo fica guardado para a mesma conta (`held`, com 3 sugestões). `taken` vem com 3 sugestões, e elas estão mesmo livres.
  - Ofensivos dão 400, inclusive com troca de letras e `_`. Nomes normais passam. Nome ofensivo da conta não vira sugestão; "José da Silva" vira `jose_da_silva`.
  - **Reteste (migração 011):** 2 e 3 trocas em paralelo → só 1 passa e fica 1 linha em `handle_changes`.
- **Tela, em 1280 e 375:**
  - U3: o passo 2 aparece na tela de login, com "Passo 2 de 2 · último", a sugestão no campo, "Esse já foi. Tenta um desses:" e 3 pílulas, sem cabeçalho e sem Menu.
  - A bolinha é 28×28 nos 4 estados, na mesma posição, e o campo não muda de altura. Tem texto para leitor de tela com `aria-live`.
  - "Salvar" só fica ativo no livre, grava e volta para o `next`, sem aviso.
  - U1/U2: com @ automático, vai direto ao `next`.
  - U6: sem rolagem lateral, botões ≥ 44 px e foco visível.
  - Troca no Meu perfil: a regra aparece antes; a confirmação tem a largura do campo (288/288 e 265/265 px); nada é gravado antes de "Trocar"; depois, sem "Editar" e sem "@ definitivo", em `/account` também.
  - U5: a palavra "handle" não aparece em nenhum texto nem atributo de acessibilidade das telas.
  - U7: `tsc`, `npm test`, `check:data` e o build passam.
- **Não testado aqui:** o @ automático vindo do Google ou do Discord de verdade (precisa do OAuth real). A conversão do nome e o filtro foram conferidos pelo servidor e pelo `npm test`.

Aprovada pelo QA em 28/11/2026.
