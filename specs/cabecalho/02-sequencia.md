# Painel "Sua sequência" e padrão de botões do cabeçalho

Estado: **pedido do dono, aprovado** (referência: a imagem com o painel "Sua sequência" e o link "Entrar para guardar"). Textos em português; só as rotas ficam em inglês. Rótulos do painel: "Sua sequência" (em caixa-alta), "dia seguido"/"dias seguidos", "recorde", seg–dom, "Você já jogou hoje. Volte amanhã e chegue a N dias. Próximo desafio em HH:MM:SS.", "Jogue o desafio de hoje para manter sua sequência de N dias.", "Salva só neste aparelho." e o link "Entrar para guardar".

## 1. Hover dos botões do cabeçalho (padrão do projeto)

- Os botões **Duelos**, **Entrar** e **Menu** devem usar a mesma animação de hover dos outros botões do projeto: a cor entra da esquerda para a direita (classes `sweep-lime` ou `sweep-white`, já existentes em `globals.css`). Hoje esses três não têm a animação.
- Sem novo estilo: só a classe que já existe, como o `ChallengeButton` e o `DuelsDialog` usam.
- Respeita `prefers-reduced-motion` (regra global já existente).

## 2. Painel da sequência ("Sua sequência")

Abre ao passar o mouse sobre o círculo da sequência (desktop) e ao tocar nele (celular). Fecha ao sair do mouse, com Escape ou com clique fora.

Conteúdo, de cima para baixo:
- Título pequeno em caixa-alta: **SUA SEQUÊNCIA**.
- Número grande com "dia seguido" (ou "dias seguidos" no plural). À direita, em cima: **recorde** com "N dias" (o recorde da sequência).
- Uma linha com os 7 dias da semana atual (seg a dom). Dia jogado: círculo `lime` com check. Hoje (sem jogo ainda): contorno. Dia futuro: contorno tracejado. Dia perdido: `track`.
- Caixa `track` com a mensagem:
  - se já jogou hoje: "Você já jogou hoje. Volte amanhã e chegue a N dias. Próximo desafio em HH:MM:SS.";
  - se não jogou: "Jogue o desafio de hoje para manter sua sequência de N dias." (sem contagem regressiva).
- Rodapé: "Salva só neste aparelho." e, ao lado, o link **Entrar para guardar** (sublinhado, em negrito, cor `grape`, o mesmo estilo do link de Termos e Privacidade da seção 3).

Dados (só no navegador, sem servidor):
- Guardar a lista das datas jogadas (dia do desafio), além da sequência atual que já existe. Migrar sem perder a sequência atual.
- Recorde = maior sequência já vista neste aparelho.
- Semana = segunda a domingo da semana atual.
- A contagem regressiva vai até a meia-noite de Brasília.

Regra de login: o painel tem **um** convite para entrar ("Entrar para guardar"). Nada de outros convites dentro dele. **Substituído pela seção 8: sem convite de login.**

## 3. Termos e Privacidade no menu

- No rodapé do menu, **Termos** e **Privacidade** viram links com o mesmo estilo do "Entrar para guardar": negrito, cor `grape`, sublinhado com `underline-offset-4`, sem caixa. Não usar a caixa com borda que está hoje.

## 4. Ajustes do dono (26/11, depois da primeira versão)

- Painel: trocar o fundo branco por uma superfície do projeto (proposta: `grape` com texto branco e acentos `lime`, como os cards da home). Mantém contraste mínimo de 4.5:1.
- Maiúscula inicial nos rótulos: "Dia seguido"/"Dias seguidos", "Hoje já foi", "Jogue hoje".
- Check dos dias: usar o mesmo check que o projeto já usa (o dos quadradinhos de resultado), não um ícone novo.
- Rodapé do painel: tirar "Salva só neste aparelho."; fica só o link "Entrar para guardar", em uma linha (sem quebra).
- Tipografia do painel: as mesmas classes de texto do projeto (tamanhos, pesos e `font-display` dos títulos), sem tamanhos próprios.
- Cabeçalho: Duelos, Entrar e Menu hoje têm três estilos diferentes. Unificar num estilo só, do projeto (mesma altura, forma e família de cor; o destaque fica só em Entrar, se fizer sentido).
- Menu: só o ícone (três linhas), sem o texto "Menu". O nome fica no `aria-label`.

## 5. Segunda rodada de ajustes do dono (26/11)

Substitui o que conflitar com as seções 2 e 4:
- Painel: volta ao fundo branco (como no início), com o texto `ink` e o link em `grape`.
- Tirar o título "SUA SEQUÊNCIA". O painel começa direto no número com "dias seguidos" e o recorde.
- "Entrar para guardar" centralizado no rodapé do painel.
- Cabeçalho: tirar o botão "Entrar". Ele passa a ser o primeiro item do menu, com fundo `grape` e texto branco (o lime se confundia com o hover dos outros itens), e o hover padrão do projeto (`sweep-lime`, texto `ink`). Com conta, o item vira "Amigos" (o que o botão mostrava antes).
- Menu: a linha acima de Termos e Privacidade vai de uma borda à outra do painel do menu (sem o recuo lateral).

## 6. Selo da sequência no cabeçalho (dono, 26/11)

- Fundo do selo (pílula com o círculo e o texto) em `grape`, com "Dias seguidos" em branco e "Jogue hoje"/"Hoje já foi" em `lavender`. Contraste ≥ 4.5:1.
- Menos espaço entre as duas linhas ("Dias seguidos" e "Jogue hoje"): linhas coladas, sem folga extra.

## Critérios de aceite

- P1. Passar o mouse em Duelos, Entrar e Menu mostra a animação de cor da esquerda para a direita, igual aos outros botões do projeto.
- P2. Passar o mouse (ou tocar) na sequência abre o painel com o conteúdo da seção 2. Fecha com Escape e clique fora.
- ~~P3. O painel mostra só um convite de login ("Entrar para guardar").~~ Saiu (seção 8): o painel não tem convite de login.
- P4. Os dias da semana marcam os dias jogados, com o recorde certo.
- P5. Termos e Privacidade no menu têm o estilo de link sublinhado da seção 3.
- P6. `tsc`, `npm test`, `npm run check:data` e `npm run build` passam. Prints do painel e do menu em 375 e 1280 px.

**Seção 6 feita (26/11, sem commit e sem deploy).** A pílula do selo é `grape`, com "Dias seguidos" em branco (8,0:1) e "Jogue hoje"/"Hoje já foi" em `lavender` (5,5:1). As linhas ficaram coladas: 16 px de altura de linha, sem folga. No celular continua só o círculo `lime`. Print: `OpenBot\Shared\aknewme-design\menu-perfil\header-1280.png`.

## 7. Selo e painel com sequência 0 (dono, 27/11)

- O selo aparece sempre na home, também com sequência 0 ("0 · Dias seguidos · Jogue hoje"). Antes ele sumia com 0.
- No painel, com sequência 0 e sem jogo hoje, a caixa da mensagem não aparece (a frase "Jogue o desafio de hoje para começar uma sequência." saiu). Os outros textos continuam: o número, o recorde, a semana e, com sequência maior que 0, as mensagens de sempre.
- Feito em `header/StreakBadge.tsx`. Print: `OpenBot\Shared\aknewme-design\amigos\painel-sequencia-0-1280.png`.

## 8. Sem "Entrar para guardar" (dono, 27/11)

- A sequência continua só no navegador, mesmo com conta (decisão do dono). O link "Entrar para guardar" prometia algo que não acontece e saiu do painel (`StreakBadge.tsx`); saiu junto o que só servia a ele (a leitura de "tem conta" no painel).
- O painel fica com o número, o recorde, a semana e a mensagem (esta só com jogo hoje ou sequência acima de 0, seção 7).
- Procurei outros textos que prometam guardar a sequência ou os dias com login: não há. A `/privacy` já diz que a sequência fica no navegador, com ou sem conta; o "Seu recorde fica salvo" do Como jogar é do Mais ou Menos e também fica no navegador.
- Conferido no navegador (build de produção) em 1280 e 375, sem conta: o painel abre sem link "Entrar" nem "guardar". `tsc` e build passam.

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
