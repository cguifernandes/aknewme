# Novos animes no catálogo

Estado: **pedido do dono, aprovado (26/11)**: adicionar o máximo de animes populares que faltam.

## Problema técnico (resolver antes de adicionar)

O sorteio diário (`pickAnimes`/`dailyAnimes` em `src/lib/game.ts`) embaralha a lista inteira. Mudar a lista muda o sorteio de **todos** os dias: desafios anteriores (arquivo, resultados salvos, estatísticas, `/plays`), o desafio do dia em andamento (duelos e salas) e a fila do bot do X (`src/lib/xposts.ts`).

Regra: **dias que já começaram nunca mudam de anime.**
- Congelar o catálogo atual (106 animes) como a lista usada por todo dia anterior a um dia de corte `CATALOG_V2_FROM` (o primeiro dia futuro em que a mudança vai ao ar).
- Do dia de corte em diante, o sorteio usa o catálogo novo.
- O bot do X: a fila continua igual até o dia de corte; os animes novos entram depois, sem repetir o que saiu nos últimos 30 dias.
- Teste automático: para todos os dias de 1 até o dia anterior ao corte, `dailyAnimes` dá exatamente o mesmo resultado antes e depois da mudança.

**Feito em 26/11/2026 (sem commit, sem deploy).**
- `CATALOG_V2_FROM` fica só em `src/lib/catalog.ts`. Por enquanto vale #203 (28/11/2026), um valor provisório: o final é definido quando o lote for aprovado.
- A lista congelada está em `src/data/animes/catalogo-v1.ts`, com os 106 títulos na ordem do sorteio. Ela também guarda os membros no MAL e as aberturas com áudio de hoje. Por isso, atualizar o MAL ou pôr uma abertura nova num anime antigo não muda os dias anteriores ao corte. Se um título dessa lista sumir do banco, o build e o `npm test` falham.
- Bot (`src/lib/xposts.ts`): até o corte, a fila é a mesma de sempre. No dia do corte, os animes novos entram na frente das duas filas (metade de manhã, metade à tarde) e depois cada fila continua de onde parou.
- O teste é o `scripts/check-catalog.mjs`, que roda no `npm test`. Ele usa o banco com 10 animes falsos no meio das épocas, membros do MAL alterados e uma abertura nova em animes antigos. Nos dias 1 a corte − 1, os 3 modos, a música e o resgate do Opening e os posts do bot têm que ficar iguais. Do corte em diante, os novos têm que ser sorteados, o bot tem que postá-los nos 10 primeiros dias e nenhum anime pode se repetir em 30 dias.
- Para o próximo lote, congele a lista v2 do mesmo jeito.

## Seleção dos animes

- Critério: popularidade no MyAnimeList (número de membros), entre os que ainda não estão no catálogo (comparar também os aliases).
- Cada anime precisa de: título, aliases, 4 emojis, 2 pistas de emoji, ano, estúdio, gênero, episódios, sinopse curta em português sem spoiler, e pelo menos uma abertura (nome e artista). O formato é o de `src/data/animes/` (um arquivo por época).
- Todo fato tem fonte (MyAnimeList/AniList). O que não for confirmado fica de fora do lote.
- Lotes de até 25 animes; cada lote é aprovado pelo dono antes de entrar no código.

## Critérios de aceite

- N1. Arquivo, estatísticas e desafios anteriores iguais aos de antes (teste automático N/A de diferença = 0).
- N2. `node scripts/check-data.mjs` ok; `npm run openings` e `npm run mal` rodados para os novos.
- N3. Nenhum anime repetido (por título ou alias).
- N4. `tsc`, `npm test`, `npm run build` passam.

**Lote 1 incluído em 26/11/2026 (sem commit, sem deploy).**
- Os 25 do `lote-1.ts` (aprovado pelo dono) entraram nos arquivos de época, por ordem de estreia: 2 em `anos-2000.ts`, 11 em `anos-2010.ts` e 12 em `anos-2015.ts`. O banco passou de 106 para 131.
- Ajuste para o `check:data`: em Classroom of the Elite, "escola de elite" entregava o título. A pista 1 e a sinopse passaram a dizer "escola de prestígio".
- `npm run mal`:
  - nota, membros e imagens dos 131, com o ID do MAL de cada novo vindo do `lote-1.ts`.
  - O AniList recusou parte dos pedidos de imagem. Por isso os 106 antigos ficaram com as imagens de antes, e as dos novos foram buscadas de novo, com pausa. Resultado: 129 banners e nenhuma capa pequena do MAL.
  - Nota e membros dos antigos foram atualizados. Os dias antes do corte usam os membros congelados.
- `npm run openings`:
  - 21 aberturas com prévia gravadas: as "ok" (nome e artista batem) e duas "duvidosas" que são a mesma música, com o nome em japonês ou em "TV size" (Hyouka e Oregairu).
  - Ficaram de fora a cover de Food Wars ("Kibou no Uta" por Miura Jam), a versão de caixinha de música de DanMachi e uma música errada de Hataraku Maou-sama.
  - O Modo Opening passou de 96 para 114 animes.
  - Ainda sem áudio: Bakemonogatari, Highschool of the Dead, Another, The Devil is a Part-Timer!, Overlord, DanMachi e Darling in the FranXX.
  - Nenhuma prévia foi ouvida. O `find-openings.mjs` pede para ouvir antes de publicar.
- Imagens: o `fetch-images.mjs` baixou as 50 que faltavam (25 animes × banner e capa).
- N1: os dias 1 a 202 (sorteio dos 3 modos, música, resgate e posts do bot) saem iguais ao retrato tirado antes do lote. Diferença: 0.
- Do corte em diante, 19 animes novos são sorteados nos primeiros 30 dias, e o bot posta os 25 novos em 20 dias.
- N2 a N4: `check:data` ok (131 animes, 114 no Opening), `npm test` ok (com o `check-catalog`), `npm run check`, `tsc` e build ok.
- Os scripts `fetch-mal`, `find-openings` e `ads` passaram a ignorar `catalogo-v1.ts`, como o `check-data`.
- Corte: `CATALOG_V2_FROM` = #203 (28/11/2026). O deploy precisa ir ao ar antes de o dia 203 começar para qualquer jogador. No Brasil, isso é até 27/11 às 23:59. Quem está num fuso à frente vê o dia 203 mais cedo: em Portugal, por exemplo, às 21:00 de Brasília. Recomendação: deploy até a tarde de 27/11. Se for depois, adiar o corte para um dia que ainda não começou e rodar `npm test` de novo.

## Corte provisório e conferência com o que está no ar (28/11)

- O #203 (28/11) começou no ar com o catálogo antigo, e o código local tinha `CATALOG_V2_FROM = 203`: o deploy trocaria os animes do #203 no meio do dia. **Provisório: `CATALOG_V2_FROM = 205` (30/11).** O valor final é o dia seguinte ao deploy (o dono vai dizer).
- `scripts/check-live.mjs` (no `npm test`) tira o `src/` do HEAD do git (o código no ar) para uma pasta temporária e compara, do dia 1 até `CATALOG_V2_FROM − 1` e até hoje, o sorteio dos 3 modos, a música do Opening e os posts do bot (horário, tipo, resposta, animes e imagem; a redação dos textos pode mudar). Ele falha se o corte cair num dia que já começou: com 203, acusa "desafio #203 mudou"; com 205, os dias 1 a 204 batem com o que está no ar.
- `dailyNumber()` no servidor lia a data no fuso da máquina depois de tirar as 3 h: na Vercel (UTC) estava certo, mas numa máquina em Brasília (o dev do dono) tirava 3 h duas vezes e, entre 00:00 e 03:00, dava o desafio de ontem. Agora a data é lida em UTC. O `check-live` confere: 00:11 de 28/11 em Brasília = #203; 23:59 de 27/11 = #202.

## QA (28/11)

Testado pelo bot de QA: na cópia do projeto (`npm test`, `check:data`, build) e no repositório só com o `check-live`, que lê o HEAD do git e grava só numa pasta temporária do sistema.

- **N1:** o `check-live` passa. Os dias 1 a 204 (os 3 modos, a música e os posts do bot) são iguais ao código no ar (74815d7). Às 00:11 de 28/11 em Brasília, o servidor dá #203. O `check-catalog` do `npm test` passa.
- **N2:**
  - `check:data` ok: 131 animes, 114 no Opening.
  - As 21 prévias de áudio dos animes novos respondem (200/206) no iTunes. Ninguém as ouviu, como a própria spec avisa.
  - Os 25 novos têm título, apelidos, 4 emojis, pistas, ano, estúdio, gênero, episódios, sinopse (que não entrega o título), aberturas, MAL e favoritos.
- **N3:** nenhum título ou apelido repetido entre os 131.
- **N4:** `tsc`, `npm test` e o build passam.
- **Corte:** `CATALOG_V2_FROM = 205` ainda está no futuro (hoje é #203). Do corte em diante, 19 dos novos entram nos primeiros 30 dias.
- **Antes do deploy:**
  - o dono define o corte final, que é o dia seguinte ao deploy;
  - rodar o `npm test` (com o `check-live`) de novo no dia do deploy;
  - o deploy precisa ir ao ar antes de o dia do corte começar em qualquer fuso.

Aprovada pelo QA em 28/11/2026.
