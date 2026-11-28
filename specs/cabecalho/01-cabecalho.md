# Cabeçalho do site

Estado: **aprovado pelo dono** (referência: `image.png` com o menu aberto, e `image-2.png` com a sequência). Idioma: textos em português, como o site inteiro; só as rotas ficam em inglês (decisão final do dono, 26/11; ver `login-duelo/01-requisitos.md`, seção Idioma). Rótulos: Duelos, Entrar (ou Amigos), Menu, Como jogar, Estatísticas, Desafios anteriores, Apoiar o projeto, Seguir no X, Termos, Privacidade, "dia seguido"/"dias seguidos", "hoje já foi"/"jogue hoje".

## Escopo

- O cabeçalho é um componente só (`src/components/SiteHeader.tsx`), usado em todas as telas: home, arquivo, amigos, handle, sala, suporte e os jogos. O novo desenho vale para **todas** as telas, para o site ficar consistente.
- A **sequência de dias** e o botão **Duelos** são exclusivos da home (como hoje). Nas outras telas não aparecem.

## Layout (desktop e celular)

Ordem da esquerda para a direita:
1. **Logo** "aknewme" (leva à home).
2. **Sequência de dias** (só na home, e só se a sequência for maior que zero). Estilo de `image-2.png`: um círculo com o número da sequência e um check verde no canto, o texto "dia seguido" (ou "dias seguidos") em negrito e, embaixo, "hoje já foi" quando o jogo de hoje já foi feito, ou "jogue hoje" quando não foi. **Sem ícone de chama.** O fundo é claro (`track`), com texto `ink`.
3. **Duelos** (só na home): texto "Duelos" com o badge de quantidade de duelos novos, como hoje.
4. **Entrar** (ou o estado logado, como hoje): botão `lime` com texto `ink`, altura de 40 px.
5. **Menu**: botão `ink`/`grape-deep` com o ícone de três linhas e o texto "Menu", altura de 40 px.

No celular (até 375 px): logo, Entrar e Menu sempre. Na home, a sequência fica como círculo com o número, sem o texto, para caber. Duelos fica só dentro do menu. Nada pode estourar a largura da tela.

## Menu (abre ao clicar em "Menu")

Painel branco, sombra `shadow-pop-lg`, canto arredondado, abaixo do botão. Itens, nesta ordem:
- **Como jogar** → abre o diálogo de como jogar (o mesmo de hoje).
- **Estatísticas** → abre o diálogo de estatísticas (o mesmo de hoje).
- **Apoiar o projeto** → `/support`.
- **Seguir no X** → `@aknewmee`, à direita, em cinza; abre o X em nova aba.
- Rodapé do menu, em linha pequena: **Termos** (`/terms`) e **Privacidade** (`/privacy`).

Comportamento:
- Fecha com Escape, com clique fora e ao escolher um item. Ao fechar, o foco volta ao botão "Menu".
- Acessível por teclado (Tab e setas, ou Tab entre os itens). `aria-expanded` e `aria-haspopup` no botão. Foco visível em todos os itens.
- Ao escolher "Como jogar" ou "Estatísticas", o menu fecha e o diálogo abre no mesmo lugar de hoje.
- Em outras telas, o item **Desafios anteriores** entra no menu (hoje é um ícone de relógio). Na home, ele também pode ficar no menu, para o cabeçalho ter só o que está na imagem.

## Critérios de aceite

- H1. Em 375 px, em todas as telas, o cabeçalho cabe sem rolagem lateral. Medido nas telas home, arquivo, amigos e um jogo.
- H2. Em 1280 px, a home mostra a sequência (quando > 0), Duelos, Entrar e Menu, nessa ordem.
- H3. O menu abre, fecha com Escape e com clique fora, e cada item leva ao lugar certo. Os diálogos "Como jogar" e "Estatísticas" abrem a partir do menu.
- H4. A sequência não tem ícone de chama. O texto mostra "hoje já foi" quando o jogo de hoje já foi feito.
- H5. Só tokens de `globals.css`. Sem hex solto. Sem animação infinita; respeita `prefers-reduced-motion`.
- H6. `tsc`, `npm test`, `npm run check:data` e `npm run build` passam. Cada arquivo com até 500 linhas.

## Fora do escopo agora

- O painel "Sua sequência" (com a semana inteira, `image-2.png`) ao clicar na sequência. Fica para uma tarefa própria, depois da aprovação.
- Mudanças no login e nas telas de jogo além do cabeçalho.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100). Sem prints (decisão do dono de 27/11, que vale no lugar do pedido de prints do P6). Medido em 1280 e 375, com o mouse e o toque de verdade (CDP). Vale o que as rodadas de `02-sequencia.md` e da `login-duelo/09` substituíram: o "Entrar" fica dentro do Menu, o Menu é só o ícone e o painel não tem convite de login.

- **H1:** sem rolagem lateral em 375 e 1280 na home, `/archive`, `/emoji`, `/support` e `/friends` (com conta).
- **H2:**
  - Em 1280, a ordem é logo, selo, Duelos, Menu.
  - Em 375, logo, selo (só o círculo) e Menu; Duelos fica dentro do Menu.
  - Fora da home, não há selo nem Duelos.
- **H3:**
  - Menu com `aria-expanded` e `aria-haspopup`. "Como jogar" abre o diálogo e fecha o Menu.
  - "Apoiar o projeto" leva a `/support`. "Seguir no X" abre x.com/aknewmee em nova aba, com "@aknewmee".
  - O Menu fecha com Esc e com clique fora (conferido na 09).
- **H4:** sem chama. Com o jogo de hoje feito, o selo diz "hoje já foi"; sem jogo, "jogue hoje".
- **H5:** sem animação infinita no cabeçalho.
- **H6:** `tsc`, `npm test`, `check:data` e o build passam.
- **Selo:**
  - Aparece também com 0, com e sem conta.
  - Em 1280: pílula grape de 40 px, bolinha lime de 28 px com 6 px de folga em cima, embaixo e à esquerda; "Dias seguidos" em branco e "Jogue hoje" em lavender, com linhas de 16 e 14 px.
  - Em 375: só o círculo lime de 36 px.
- **P1:** o hover em Duelos e Menu tem o sweep do projeto.
- **P2:**
  - O painel abre com o mouse em cima (computador) e com o toque (celular). Fecha ao sair com o mouse, com Esc e com toque fora.
  - Fundo branco, sem título e sem "Entrar para guardar".
- **P4:**
  - A semana vai de seg a dom: dias jogados "jogado", hoje marcado, futuro "ainda não". O recorde está certo (4).
  - Com 2 dias e sem jogo: "Jogue o desafio de hoje para manter sua sequência de 2 dias.".
  - Depois de jogar: "Você já jogou hoje. Volte amanhã e chegue a 4 dias. Próximo desafio em HH:MM:SS.".
  - Com 0 e sem jogo: sem caixa de mensagem.
- **P5:** Termos e Privacidade são links em negrito, grape e sublinhados, sem caixa.
- **Observação (não é critério):** no computador, quem passa o mouse e depois clica no selo fecha o painel, porque o clique alterna. Vale o Produto decidir se o clique com o painel aberto deve manter o painel aberto.

Aprovada pelo QA em 28/11/2026.
