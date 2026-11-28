# Foto de perfil e painel da conta no cabeçalho

Estado: **pedido do dono, aprovado (26/11)**. Textos em português; rotas em inglês.

## Escopo

- Sem upload de imagem por enquanto. A foto vem do Google ou do Discord, se o provedor fornecer. Já guardamos só a URL da foto (HTTPS de `lh3.googleusercontent.com` ou `cdn.discordapp.com`), sem dado novo.
- Sem foto: círculo `lime` com as iniciais do nome em `ink` (como o cartão "Assim te veem nos duelos").

## Cabeçalho

- **Sem conta:** como hoje ("Entrar" é o primeiro item do menu).
- **Com conta:** aparece o **avatar** (40 px, redondo, borda do projeto) no cabeçalho, ao lado do menu. O item "Entrar"/"Amigos" e o item "Meu @nome" saem do menu.
- Hover e foco no avatar seguem o padrão do projeto (anel `lime` ou o sweep, o que já existir para botões redondos).

## Painel da conta (abre ao clicar no avatar)

Mesmo comportamento do menu (abre abaixo, fecha com Esc e clique fora, foco volta ao avatar, `aria-expanded`, animação de abertura do projeto). Conteúdo, de cima para baixo:
- Avatar grande (56–64 px), **nome** em `font-display` e o **@** em `grape`. Sem @ ainda: no lugar dele, o link "Escolher meu @".
- Itens:
  - **"Meu @"** → `/handle?edit=1` (ou "Escolher meu @" → `/handle`, se não tiver).
  - **"Amigos"** → `/friends`, com o número de pedidos pendentes, se houver.
  - **"Salas de hoje"** → a lista de salas em `/friends` (se não existir âncora, leva a `/friends`).
  - Divisória de ponta a ponta.
  - **"Sair"** (encerra a sessão e volta à página atual, sem conta).
- O painel não mostra e-mail (não guardamos).

## Critérios de aceite

- A1. Com conta e foto: o cabeçalho mostra a foto; sem foto, as iniciais.
- A2. Clicar no avatar abre o painel com nome, @ (ou "Escolher meu @"), Amigos, Salas de hoje e Sair; fecha com Esc e clique fora.
- A3. Sem conta, nada muda em relação a hoje.
- A4. Em 375 px, o cabeçalho com sequência, Duelos (ou não, no celular), avatar e menu cabe sem rolagem lateral; o painel também.
- A5. `tsc`, `npm test`, `npm run check:data`, `npm run build` passam.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), branch `teste-login` e contas `qa_*` apagadas no fim (0 restantes). Sem prints. Medido em 1280 e 375. O cabeçalho e o painel seguem o que a 09-menu-perfil.md substituiu: o botão do Menu é só o ícone e o perfil fica no topo do Menu, abrindo o Meu perfil.

- **A1:**
  - Com foto do Discord, o perfil do Menu mostra a foto com 44 px, nome, @ e a seta.
  - Sem foto, mostra as iniciais do primeiro e do último nome ("GS") em ink sobre lime.
- **A2:**
  - O Menu abre com o perfil, Amigos, Como jogar, Apoiar, Seguir no X e o rodapé Sair | Termos Privacidade. "Salas de hoje" saiu pela 13.
  - Fecha com Esc (o foco volta ao Menu) e com clique fora.
- **A3:** sem conta, o Menu começa com "Entrar".
- **A4:** cabeçalho e Menu com conta sem rolagem lateral em 375 e 1280.
- **A5:** `tsc`, `npm test`, `check:data` e o build passam.

Aprovada pelo QA em 28/11/2026.
