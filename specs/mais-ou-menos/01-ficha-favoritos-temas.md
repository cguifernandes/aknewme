# Mais ou Menos: ficha, favoritos e rodadas temáticas

Estado: **pedido do dono, aprovado (26/11)**. Base: `OpenBot\Shared\aknewme-ideias\mais-ou-menos.md` (ideias 1, 2, 5 e 6). Textos em português.

Regra que não muda: **errou, perdeu**. A partida acaba no primeiro erro e recomeça do zero. Sem vidas. Sem categoria de duração (quase todos têm ~23 min).

## 1. Ficha na carta (ideia 1)

- Cada carta mostra, além do título e da imagem: gênero, estúdio, ano e episódios.
- O dado que está sendo comparado na rodada **não aparece** na carta da direita (como hoje). Ex.: na rodada "mais episódios", a carta da direita mostra gênero, estúdio e ano, mas não os episódios.
- No celular, a ficha fica compacta (uma linha de etiquetas pequenas) e não pode empurrar os botões para fora da tela em 375 px.

## 2. Ficha depois do erro (ideia 2)

- Na tela de fim de partida, mostrar os dois animes da rodada em que errou: título, imagem, a resposta certa da categoria (os dois valores), gênero, estúdio, ano e a sinopse curta (já existe, sem spoiler), e um link "Ver no MyAnimeList".
- No celular, a sinopse aparece recolhida ("Ler sinopse").

## 3. Nova categoria: favoritos (ideia 5)

- Pergunta: "Qual tem mais favoritos no AniList?" (a fonte aparece na pergunta, para não confundir com a popularidade do MyAnimeList).
- Dado: campo `favourites` da API GraphQL do AniList (gratuita), buscado pelo script de dados (como o `npm run mal`), gravado junto dos dados do catálogo, com a data da coleta.
- Antes de ligar a categoria: medir a cobertura. Só entra se pelo menos 90% dos animes do pool tiverem o número; os que não tiverem ficam fora só dessa pergunta.
- Os dias e desafios já congelados (`catalogo-v1.ts`) não mudam.

## 4. Rodadas temáticas: teste com 2 temas (ideia 6)

- Duas rodadas temáticas, escolhidas antes de começar a partida (seletor simples: "Todos os animes" padrão, e os 2 temas).
- Escolher os 2 temas com o maior número de animes com imagem no pool, com pelo menos 25 cada (ex.: uma década e um gênero; ex.: "Anos 2010" e "Ação"). Entregar a contagem de cada candidato.
- O recorde e as medalhas são separados por tema (o recorde de "Todos" não se mistura).

## 5. Celular e pendências (dono, 26/11)

- **Topo compacto no celular (até 640 px):** título menor; seletor de tema e placar (sequência, recorde, próxima medalha) na mesma faixa.
- **Botões Mais e Menos fixos embaixo** no celular: sempre visíveis, sem diminuir a imagem. Faixa fixa no fim da tela, com o fundo do projeto, respeitando a área segura do celular (`env(safe-area-inset-bottom)`). O conteúdo ganha espaço embaixo para não ficar escondido atrás dela. Na tela de fim de partida, a faixa mostra "Jogar de novo" e "Compartilhar".
- **Gêneros duplicados:** unificar no catálogo "Sci-Fi" → "Ficção científica", "Horror" → "Terror", "Dark fantasy" → "Fantasia sombria". Os dias congelados (`catalogo-v1.ts`) não mudam de anime; confirmar que o teste de congelamento continua passando.
- **`npm run mal`:** esperar e tentar de novo quando o AniList responder 429 (mesmo método do `npm run anilist`), para não perder imagens.
- **Painel `/plays`:** separar as partidas do Mais ou Menos por tema (Todos, Anos 2010, Ação).

## 6. Layout aprovado pelo dono (26/11): protótipo `prototipo-celular-d.html`

Referência: `specs/mais-ou-menos/prototipo-celular-d.html` e o print `prototipo-e-375x667.png`. Substitui o que conflitar com a seção 5.

**Celular (até 640 px)**
- Cards dos dois animes **iguais**, um embaixo do outro, com o "VS" entre eles: imagem no topo (~112 px de altura), nome, e o valor centralizado embaixo do nome (o número no card da esquerda/de cima; "?" no card do palpite), com a unidade ("episódios") logo abaixo.
- Etiquetas sobre a imagem: ano · estúdio e o gênero (ex.: "Ação · Shounen"), lado a lado. Sem a linha de gênero embaixo do título.
- Card de cima em `grape` (como hoje); card do palpite branco com borda `mist`.
- Faixa fixa embaixo só com os botões Mais e Menos, mais baixos (~44 px), sem o texto de apoio.
- Topo menor: selos de modo e rodada menores; título ~20 px.
- **Placar** em `grape` (não mais `ink`), com quatro blocos `grape-deep`: Tema (seletor em pílula `lime` com seta), Sequência e Recorde (números `lime`, rótulos pequenos em caixa-alta `lavender`) e a medalha com barra de progresso `lime`.
- Em 375×667, os dois cards (até o "?" e a unidade) e os botões aparecem sem rolar.

**Desktop**
- Mesmo padrão nos cards (gênero dentro da imagem, valor centralizado embaixo do nome) e no placar (`grape` com blocos).
- Cards continuam lado a lado.

**Todos os jogos (desktop e celular)**
- Selos de modo e de rodada (ex.: "Mais ou Menos", "Rodada 1 · Episódios", "Desafio diário #201") menores, no mesmo componente/estilo em todos os modos.

## 7. Ícones dos botões (dono, 27/11)

- Trocar as setas dos botões Mais e Menos pelos ícones do padrão do projeto (FontAwesome, como no resto do site), no mesmo tamanho e cor do texto.

## Critérios de aceite

- M1. Carta com gênero, estúdio, ano e episódios, sem mostrar o valor da rodada na carta da direita.
- ~~M2. Fim de partida com a ficha dos dois animes e o link do MyAnimeList.~~ Saiu (dono, 27/11): depois do erro fica só o resultado e "Jogar de novo"/"Compartilhar".
- M3. Categoria favoritos ligada só com cobertura ≥ 90%, com a fonte na pergunta e a data da coleta.
- M4. Dois temas com ≥ 25 animes cada, seletor, recorde por tema. O seletor está fora da tela por enquanto (`THEMES_ENABLED = false`, seção 8).
- M5. Errar continua encerrando a partida.
- M6. 375 px sem rolagem lateral; botões visíveis; `tsc`, `npm test`, `npm run check:data`, `npm run build` passam.

## Evidências (26/11/2026, sem commit e sem deploy)

**M1. Ficha na carta** (`HigherLowerFacts.tsx`, `cardFacts` em `lib/higherLower.ts`)
- Ano e estúdio ficam na etiqueta sobre a imagem; gênero (os 2 primeiros) e episódios, numa linha de etiquetas embaixo do título. No celular a linha tem 21 px de altura.
- O dado da rodada não entra na ficha: na rodada de episódios a carta da direita não mostra os episódios, e na de ano não mostra o ano. Conferido no teste e no Chrome.

**M2. Ficha depois do erro** (`HigherLowerRecap.tsx`)
- "A rodada que você errou": os dois animes com capa, o valor da categoria de cada um, gênero, estúdio, ano, episódios, sinopse e "Ver no MyAnimeList" (`myanimelist.net/anime/<id>`, em nova aba).
- No celular a sinopse fica recolhida em "Ler sinopse"; no computador aparece inteira.

**M3. Favoritos**
- Script novo `npm run anilist` (`scripts/fetch-anilist.mjs`): lê o campo `favourites` do AniList pelo id do MAL e grava `src/data/animes/anilist.ts`, com a data (`ANILIST_UPDATED = 2026-11-26`).
- O AniList limita os pedidos por minuto (resposta 429). O script espera o tempo que ele pede e tenta de novo; se um lote falhar de vez, fica o número antigo.
- Cobertura medida: **131 de 131 animes (100%)**. A pergunta está ligada.
- A regra dos 90% fica em `categoriesFor`: abaixo disso a pergunta desliga sozinha, e anime sem número fica fora só dela.
- Pergunta: "Qual tem mais favoritos no AniList?". O rodapé mostra "Favoritos: AniList, lidos em 26/11/2026".
- `catalogo-v1.ts` não foi tocado. Os dias 1 a 202 saem iguais ao retrato de antes (diferença 0).

**M4. Temas**
- Contagem dos candidatos (animes com imagem, banco de 131):
  - Décadas: Anos 2010: 61 · Anos 2000: 25 · Anos 2020: 21 · Anos 1990: 17 · Anos 1980: 6 · Anos 1960: 1.
  - Gêneros: Ação: 59 · Fantasia: 29 · Comédia: 27 · Drama: 25 · Sobrenatural: 24 · Aventura: 21 · Mistério: 13 · Romance: 13 · os demais, 10 ou menos.
  - Estúdios: Madhouse: 15 · A-1 Pictures: 11 · Toei Animation: 8 (nenhum chega a 25).
- Escolhidos: **Anos 2010 (61)** e **Ação (59)**, os dois maiores no geral.
- Seletor (`HigherLowerThemes.tsx`): "Todos os animes" (padrão), "Anos 2010" e "Ação". Fica travado enquanto há uma sequência em andamento e destrava ao perder. O tema escolhido é lembrado.
- Recorde e medalhas por tema: "Todos" continua na chave `aknewme.hl` (quem já jogava mantém o recorde); cada tema usa `aknewme.hl.<tema>`.

**M5.** Errar continua encerrando a partida: no Chrome, depois do erro nada entra sozinho e aparece "Jogar de novo".

**M6.**
- Sem rolagem lateral em 375 e 1280 px, e os dois botões cabem na largura.
- No celular (375 × 812) os botões ficam a cerca de 1020–1040 px do topo, então é preciso rolar uns 220 px para chegar neles. Já era preciso rolar desde o aumento da imagem (seção 3 da spec visual); a ficha e o seletor somaram cerca de 60 px.
- `tsc`, `npm test` (com o `check-hl.mjs` novo, 7 testes), `npm run check`, `check:data` e o build passam.

**Pendências**
- Nomes de gênero duplicados no banco: "Ficção científica" (10) e "Sci-Fi" (1), "Terror" (7) e "Horror" (1), "Fantasia sombria" (2) e "Dark fantasy" (1). Não afeta os dois temas escolhidos, mas afetaria um tema desses gêneros.
- O painel `/plays` não separa as partidas por tema.
- O `npm run mal` tem a mesma fraqueza com o limite do AniList na busca das imagens (foi o que derrubou os banners no lote 1). Vale aplicar nele a mesma espera.

Prints em `OpenBot\Shared\aknewme-design\mais-ou-menos-ficha\`: carta, fim de partida, pergunta de favoritos e seletor de tema, em 375 e 1280 px.

## Evidências da seção 5 (26/11/2026, sem commit e sem deploy)

- **Topo compacto no celular (até 640 px):** título com 24 px. O tema virou uma lista (`ThemeSelect`) dentro da faixa do placar, junto de sequência, recorde e próxima medalha. No computador nada mudou.
- **Botões fixos no celular** (`BAR` em `HigherLowerGame.tsx`):
  - Faixa fixa no fim da tela com Mais e Menos; a imagem continua com 144 px.
  - Entre o acerto e a próxima rodada os botões ficam no lugar, desligados.
  - No fim de partida a faixa mostra "Jogar de novo" e "Compartilhar".
  - Usa `env(safe-area-inset-bottom)`, e a página ganhou 112 px embaixo. Rolando até o fim, o último texto termina 42 px acima da faixa.
  - Medido no Chrome: em 375×667 os botões ficam de 603 a 655 px; em 375×812, de 748 a 800 px. Sem rolagem lateral.
- **Limite conhecido:** os botões ficam sempre à vista, mas o nome do anime da direita (o do palpite) continua abaixo da dobra. Em 375×812 aparece só o topo da imagem dele; em 375×667, quase nada. Para ver o nome sem rolar seria preciso diminuir a imagem ou pôr o nome na faixa.
- **Gêneros:** "Sci-Fi" → "Ficção científica" (Gurren Lagann), "Horror" → "Terror" (Another), "Dark fantasy" → "Fantasia sombria" (Hell's Paradise). `check-catalog` passa, e os dias 1 a 202 (sorteio e posts do bot) saem iguais ao retrato de antes.
- **`npm run mal`:** a busca de imagens no AniList agora espera o `Retry-After` do 429 e tenta até 5 vezes por lote. Se um lote falhar de vez, o anime fica com as imagens que já estavam gravadas. **Não rodei o script inteiro** (leva uns 8 minutos e regrava nota e membros): conferi só a sintaxe. O mesmo método rodou de verdade no `npm run anilist`.
- **`/plays` por tema:**
  - O jogo manda o tema em cada partida, e o `/api/played` grava os contadores também por tema (`hl:start:<tema>`, `hl:done`, `hl:sum`, `hl:best`). Tema desconhecido é ignorado e conta só no total.
  - O painel ganhou a tabela "Por tema" (partidas, % do total, terminadas, sequência média, maior sequência). As partidas de antes da separação aparecem numa nota e só entram no total.
  - Testado com um Redis de mentira e chave descartável, sem tocar no Redis de produção. O print do painel usa números de exemplo.
- `tsc`, `npm test`, `npm run check`, `check:data` e o build passam.
- Prints em `OpenBot\Shared\aknewme-design\mais-ou-menos-celular\`: rodada e fim de partida em 375×667, 375×812 e 1280×800, fim da página rolada no celular e o `/plays` (exemplo).

## Evidências da seção 6 (26/11/2026, sem commit e sem deploy)

- **Cards iguais** (`HigherLowerGame.tsx`, `HigherLowerFacts.tsx`): imagem em cima com as etiquetas dentro dela ("ano · estúdio" e o gênero), nome, e o valor centralizado embaixo do nome com a unidade. A carta do palpite mostra "?" no lugar do número. A linha de gênero embaixo do título saiu.
- **Celular:**
  - Imagem com 112 px, cards empilhados com o VS no meio (40 px), card de cima `grape` e o do palpite branco com borda `mist`.
  - Faixa fixa só com Mais e Menos, de 44 px, sem texto de apoio. No fim, "Jogar de novo" e "Compartilhar".
  - Topo: selos com 11 px, título com 20 px.
  - Medido em 375×667: o card de cima vai de 178 a 383 px, o do palpite termina a unidade em 595 px, e a faixa começa em 607 px. Os dois cards (até o "?" e a unidade) e os botões aparecem sem rolar.
  - O nome fica sempre numa linha no celular: nome comprido diminui a letra (20 → 16 → 14 → 12 px) e, no limite, corta com "…". Sem isso, um nome em duas linhas empurrava a unidade para trás da faixa.
- **Placar** (`HigherLowerHud.tsx`, `HigherLowerThemes.tsx`): faixa `grape` com quatro blocos `grape-deep`: Tema (pílula `lime` com seta), Sequência e Recorde (números `lime`, rótulos em caixa-alta `lavender`) e a medalha com barra `lime`. Vale também no computador, onde a fileira de medalhas continua. A linha de botões de tema do computador saiu: o tema agora é a pílula do placar nas duas larguras.
- **Computador:** cards lado a lado, com as etiquetas dentro da imagem e o valor centralizado embaixo do nome; a pergunta por extenso e os botões continuam na carta.
- **Selos** (`components/badge.ts`, `BADGE`): um estilo só, com 11 px no celular (21 px de altura) e 12 px no computador (24 px). Usado no Mais ou Menos, Emoji, Opening, Pistas, na home ("Desafio diário #" e "N dias seguidos") e na tela de erro. Medido nas quatro páginas, nas duas larguras.
- **Diferenças em relação ao protótipo e à seção 1:**
  - Os episódios deixaram de aparecer na carta no celular (o protótipo tem só duas etiquetas). Do `sm` para cima há uma terceira etiqueta com os episódios, fora da rodada de episódios.
  - No celular, o elogio "Na mosca! · próxima rodada…" não aparece mais depois do acerto, para a carta não mudar de altura; o selo do meio vira ✓ e o número é revelado.
- `tsc`, `npm test`, `npm run check`, `check:data` e o build passam.
- `HigherLowerGame.tsx` está com 474 linhas, perto do limite de 500 do projeto. A próxima mudança grande nele deve vir com uma extração.
- Prints em `OpenBot\Shared\aknewme-design\mais-ou-menos-layout-aprovado\`: rodada e fim em 375×667, 375×812 e 1280×800, e os selos do Modo Emoji em 375 e 1280.

## 8. Ajustes do dono (27/11): botão, título, categoria, temas e fim de partida

- **Botão "Mais":** variante nova e reutilizável `LIME_DARKEN` (`src/components/buttons.ts`): lime que, no hover e no foco, só escurece para o token novo `lime-deep` (#b2e03f, texto `ink` a 10:1), sem sweep. Vale na carta (computador) e na faixa fixa (celular).
- **Título fixo:** "Compare os dois animes", que não muda por rodada e cabe numa linha em 375 e 1280. O selo "Rodada N" ficou só com o número.
- **Categoria em destaque:** selo `ink` com texto `lime`, centrado logo acima das cartas, com a pergunta curta da rodada (`CATEGORY[cat].short`): "Mais episódios?", "Estreou primeiro?", "Nota maior?", "Mais membros?", "Mais favoritos no AniList?". 18 px no celular, 24 px no tablet, 30 px no computador; entra com "pop" quando a categoria troca.
- **Temas:** o seletor saiu da tela, sem apagar nada: chave `THEMES_ENABLED = false` em `src/lib/features.ts`. Desligada, o jogo começa sempre em "Todos os animes" com o recorde dele (`aknewme.hl`), mesmo que um tema esteja salvo; o código dos temas e os recordes por tema ficam. O placar perde o bloco do tema.
- **Fim de partida:** saiu a seção "A rodada que você errou" (`HigherLowerRecap.tsx` apagado; não era usado em outro lugar). Depois do erro fica o resultado na carta e "Jogar de novo"/"Compartilhar".
- **Conferido no navegador** (build de produção) em 1280×800, 375×667 e 375×812: título numa linha só; selo "Mais episódios?" a 8–16 px das cartas (30 px no computador); sem seletor de tema, com o tema "Ação" salvo a partida conta em "Todos"; Mais e Menos à vista sem rolar (375×667: 615–659 px); hover do "Mais" com fundo rgb(178, 224, 63), sem imagem de sweep e texto ink; depois de errar, sem a ficha da rodada e com "Jogar de novo". `tsc`, `npm test`, `check:data` e build passam.

## 9. Categoria na carta, pergunta e botões do modo (dono, 27/11)

Substitui o selo grande da seção 8.

- Saiu o selo grande da categoria acima das cartas. Em cada carta, entre o nome e o valor, uma pílula `lime` pequena em caixa-alta com a categoria (`CATEGORY[cat].tag`): "ANO DE ESTREIA", "EPISÓDIOS", "NOTA NO MAL", "MEMBROS NO MAL", "FAVORITOS NO ANILIST". O valor fica embaixo (no palpite, "?"); a linha de unidade embaixo do número saiu, porque a pílula já diz o que é.
- Na carta do palpite, embaixo do "?", a pergunta com o texto do modo (`guessQuestion`): ano "X estreou antes ou depois de 2019?"; episódios "X tem mais ou menos episódios que Y?"; nota "A nota de X é maior ou menor que 8,10?" (com o mesmo formato do número da carta); membros "X tem mais ou menos membros no MAL?"; favoritos "X tem mais ou menos favoritos no AniList?". No celular ela fica só para leitor de tela (não cabe em 375×667 com os botões); os botões já dizem o modo.
- Botões com o texto do modo (`guessLabels`), com as setas: ano "Depois de 2019"/"Antes de 2019"; "Mais episódios"/"Menos episódios"; "Nota maior"/"Nota menor"; "Mais membros"/"Menos membros"; "Mais favoritos"/"Menos favoritos". Lime (`LIME_DARKEN`) em cima e grape embaixo, na carta e na faixa fixa do celular (cabem sem encurtar).
- **Ano:** "Depois de" é o palpite "mais" (estreou mais tarde = valor maior), a mesma lógica de antes (`isRight`); `scripts/check-hl.mjs` ganhou o teste dos textos e dessa regra.
- `LIME_DARKEN` agora tem sweep: o `lime-deep` entra da esquerda para a direita (`sweep-lime-deep`, o mesmo `@utility sweep-*`), texto `ink`; com movimento reduzido a cor troca sem animar (regra global).
- Conferido no navegador (build de produção) em 1280×800 e 375×667, jogando as 5 categorias: pílula nas duas cartas entre o nome e o valor, sem o selo de cima, pergunta e botões do modo certos, botões à vista sem rolar (375×667: 613–659 px); hover do "Mais" com o gradiente lime-deep cobrindo 100% e texto ink. `tsc`, `npm test` e build passam.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100). Sem prints. Medido em 1280×800 e 375×667, jogando de verdade no navegador: 6 rodadas certas em sequência, passando pelas 5 categorias, e depois um erro de propósito. Valem as seções 6 a 9.

- **M1:**
  - O palpite mostra "?". A carta da direita não mostra o dado da rodada (conferido em todas as rodadas).
  - Cada carta tem a pílula da categoria.
  - A pergunta do modo aparece visível no computador e só para leitor de tela no celular.
  - Os botões têm o texto do modo, com `arrow-up` e `arrow-down` do FontAwesome. "Mais" é lime e "Menos" é grape.
  - O hover do "Mais" é o sweep `lime-deep` cobrindo 100%, com o texto em ink.
- **M3:** a pergunta de favoritos aparece; o rodapé traz "Favoritos: AniList, lidos em 26/11/2026".
- **M4 (temas desligados):**
  - Não há seletor nem bloco de tema, mesmo com um tema salvo no navegador.
  - O recorde vai para "Todos" (`aknewme.hl`).
  - O placar é grape com 3 blocos `grape-deep`: Sequência, Recorde e a medalha.
- **M5:** errar encerra a partida, com "Jogar de novo" e "Compartilhar", sem a ficha da rodada. Depois do erro, nada entra sozinho.
- **M6 e layout:**
  - Sem rolagem lateral. O título "Compare os dois animes" fica numa linha.
  - Em 375×667, a faixa é fixa embaixo, com os botões de 44 px.
  - Os selos de modo têm 11 px no celular e 12 px no computador em Mais ou Menos, Emoji, Opening e Pistas.
  - Os gêneros duplicados (Sci-Fi, Horror, Dark fantasy) não estão mais no catálogo.
  - `tsc`, `npm test`, `check:data` e o build passam.
- **Observação (no limite):** em 375×667, o "?" do palpite termina exatamente onde a faixa começa. A caixa do texto vai até 611 px e a faixa começa em 607 px, então a margem de baixo do texto fica 4 px por trás da faixa. Um nome em duas linhas pode esconder o "?".
- **Não testado:** `/plays` por tema (precisa do `PLAYS_KEY`, que não está no ambiente do QA) e o `npm run mal` (regrava os dados do catálogo).

Aprovada pelo QA em 28/11/2026.
