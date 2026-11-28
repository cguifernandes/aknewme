# Desafiar um amigo com conta, sem pedir apelido

Estado: **feito (27/11)**, pedido do dono.

- Fim de jogo, aba "Desafiar um amigo" (`ChallengeButton`, dentro do `DuelPitch`): o visual não muda.
- **Com conta:** o clique em "Desafiar um amigo" não pede o apelido. Usa o nome da conta (do `AccountProvider`) ou, sem nome, o @, com a mesma limpeza e o mesmo limite do apelido (`cleanNick`), e já gera o link do duelo: copia no computador e abre o compartilhar nativo no celular, como depois do apelido. Aparece a faixa "como Nome" com "Link copiado!". O lápis deixa trocar o nome só para esse envio; o nome da conta não é gravado como apelido do navegador (`aknewme.nick` de quem joga sem conta fica como estava).
- **Sem conta:** igual a antes (pede o apelido).
- Não muda: o duelo por link (`/duel`) e o placar no Redis (R15).
- Conferido no navegador (build de produção, contas de teste no teste-login, apagadas) em 1280 e 375: com nome, sem campo de apelido, a faixa mostra "como Guilherme Teste · Link copiado!" e a área de transferência tem "⚔️ Guilherme Teste te desafiou…" com o link `/duel?m=…`; só com @, usa o @; o apelido salvo antes continua o mesmo; deslogado, aparece o campo "Seu apelido" e nada é copiado. O menu de compartilhar nativo do celular não dá para abrir no navegador de teste (ele caiu na cópia, como no fluxo antigo). `tsc`, `npm test` e build passam.

## Só "Desafiar um amigo" no fim de jogo (dono, 27/11)

- O botão "Desafiar amigos" (criar sala) saiu do fim de jogo, com e sem conta. Fica só "Desafiar um amigo" (link). A sala com amigos começa pelo "Desafiar" de `/friends` ou por `/room/new`.
- Ficou "Voltar para a sala", só para quem já está numa sala deste modo hoje (veio de uma sala e jogou): sem ele, essa pessoa não teria como voltar à sala pelo fim de jogo. `account/FriendsRoomLink.tsx` virou `account/BackToRoomLink.tsx`.
- Conferido no navegador (build de produção, conta de teste no teste-login, apagada) em 1280 e 375: logado e deslogado, a aba de desafiar tem só "Desafiar um amigo"; logado numa sala, aparece também "Voltar para a sala". `tsc` e build passam.

## Rótulos do botão e cartões por modo (dono, 27/11)

- Cartões por modo (`ChallengeModes`, na janela Desafiar de Amigos e no "Chamar pro duelo"): saiu "Você acertou hoje"/"Você jogou hoje" do cartão de modo jogado; o de modo não jogado continua com "Ainda não jogou hoje" (explica por que leva a jogar).
- Botão de envio do `ChallengeButton` (vale também no fim de jogo, que usa o mesmo botão): no computador, que copia, "Copiar link" e, depois de já ter mandado, "Copiar de novo"; no celular com compartilhar nativo (toque + Web Share, a mesma regra do `shareOrCopy`: `sharesNatively` em `lib/share.ts`), "Compartilhar" e "Compartilhar de novo". "Link copiado!" continua e volta ao rótulo depois de ~2,5 s. Saíram "Enviar desafio" e "Enviar de novo".
- Conferido no navegador (build de produção, conta de teste no teste-login, apagada) em 1280 e 375, logado e deslogado: cartão sem "Você acertou hoje"; no computador "Copiar link" → "Link copiado!" → "Copiar de novo" (~2,1–2,4 s); no celular (toque e compartilhar nativo simulados) "Compartilhar" → abre o compartilhar → "Compartilhar de novo". `tsc` e build passam.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), branch `teste-login` e contas `qa_*` apagadas no fim (0 restantes). Sem prints. Medido em 1280 e 375, jogando o Pistas de verdade no navegador.

- **Com conta:**
  - "Desafiar um amigo" não pede apelido. Mostra a faixa "como <nome>" e "Link copiado!" no computador, e copia "⚔️ <nome> te desafiou no aknewme · Modo Pistas…" com `/duel?m=pistas`.
  - No celular (toque + compartilhar nativo simulado), abre o compartilhar e o rótulo vira "Compartilhar de novo". No computador, "Copiar de novo".
  - O `aknewme.nick` salvo antes continua o mesmo.
  - A partida vai para a conta como desafiante.
- **Sem conta:** pede "Seu apelido" e nada é copiado antes.
- **Só "Desafiar um amigo":** o fim de jogo não tem "Desafiar amigos" nem "Voltar para a sala", com ou sem conta.

Aprovada pelo QA em 28/11/2026.
