# Padrão de roxo e ajustes do Mais ou Menos

Estado: **pedido do dono, aprovado (26/11)**.

## 1. Um roxo só para botões e pílulas sólidos

- O selo de dias seguidos, o botão Duelos e o botão do Menu estão com tons de roxo diferentes.
- Auditar o uso de `grape`, `grape-deep` e `grape-ink` (e qualquer roxo fora dos tokens) em botões, pílulas e selos sólidos do site inteiro.
- Regra: elementos sólidos de um roxo só usam **um** token (o de base dos botões do projeto). Tons diferentes só onde há motivo real: degradê, sombra/borda inferior de profundidade, texto sobre fundo claro, ou estado de hover/ativo.
- Entregar a tabela "onde estava → como ficou" e o motivo de cada exceção mantida.

## 2. Mais ou Menos: hover dos botões

- No jogo Mais ou Menos, o hover do botão "Mais" (e do "Menos", se for igual) deixa o fundo branco. Trocar por um hover coerente com o padrão do projeto (ex.: o sweep do projeto ou a cor do botão um pouco mais escura), com contraste ≥ 4.5:1.

## 3. Mais ou Menos: imagem no celular

- No celular, a imagem do anime nas cartas está pequena demais. Aumentar a largura/altura da imagem nas cartas em telas até 640 px, sem rolagem lateral e sem esconder os botões.

## Critérios de aceite

- V1. Selo, Duelos e Menu com o mesmo roxo; tabela da auditoria entregue.
- V2. Hover do Mais/Menos sem fundo branco.
- V3. Imagem maior no celular (375 px), cartas e botões visíveis sem rolar para o lado.
- V4. `tsc`, `npm test`, `npm run check:data`, `npm run build` passam.

## Evidências (26/11, sem commit e sem deploy)

Token base dos botões, pílulas e selos sólidos: **`grape`**. Ele já era o mais usado (ChallengeButton, "Menos", Entrar, cartões).

| Onde | Estava | Ficou |
|---|---|---|
| Cabeçalho: Duelos e Menu (`header/buttons.ts`) | `grape-deep` | `grape` (igual ao selo) |
| Home, celular: pílula "N dias seguidos" (`app/page.tsx`) | `grape-deep` | `grape` |
| Modo Emoji: pílula de pontos e botão "Pular rodada" (`EmojiGame.tsx`) | `grape-deep` | `grape` |
| Modo Pistas: número da pista ainda fechada (`CluesGame.tsx`) | `grape-deep` | `grape` |
| Barra de duelo: quadradinhos "?" sobre fundo ink (`DuelBar.tsx`) | `grape-deep` | `grape` |
| Fechar dos avisos (toast do @ e aviso do X), sobre fundo ink | `grape-ink`, hover `grape` | `grape`, hover `grape-deep` |
| Mais ou Menos: etiqueta da carta da esquerda (`HigherLowerGame.tsx`) | `grape-ink` | `grape` |

Exceções mantidas:

| Onde | Tom | Motivo |
|---|---|---|
| Painéis e faixas dentro de cartões `grape` (`DuelIntro` painel e formulário, `DuelPitch` faixa da regra e quadradinhos, `EndResult` caixa do passo a passo, número da pista aberta no `CluesGame`) | `grape-deep` / `grape-ink` | camada sobre fundo `grape`: a mesma cor sumiria |
| Item escolhido e hover na lista do `DuelsDialog`; hover dos links do `EndCard` | `grape-deep` | estado (ativo/hover) |
| Fundo das imagens (antes de carregar) no `EndAnimes`, `OpeningRescue`, `ModeCard` com resultado e no Mais ou Menos | `grape-ink` | superfície de imagem e cartão, não é botão |
| Painel interno `/plays` (`PlaysBotLog`, `PlaysBotStatus`) | `grape-ink` | camada sobre `grape`, tela interna |
| Barras do equalizador decorativo da home | `grape-deep` | decoração |
| `og.ts` (imagens de compartilhar) e `themeColor` | hex dos tokens | fora do CSS: são os valores dos tokens |

- **Mais ou Menos, hover:** o botão é o "Mais" (lime, `sweep-white`), que ficava com fundo branco. Agora é o `sweep-ink` do projeto, com o texto em lime (12,8:1); a bolinha da seta passa a lime para não sumir. O "Menos" já usava `sweep-ink` e ficou igual.
- **Mais ou Menos, imagem no celular:** passou de 80 px para 144 px de altura (até 640 px). Medido a 375 px: imagens com 144 px, botões com 138 px de largura, sem rolagem lateral.
- **Medido no Chrome:** selo, Duelos e Menu com `rgb(75, 43, 214)` a 1280 px. No celular o selo é só a bolinha lime, como antes.
- `tsc`, `npm test`, `npm run check`, `check:data` e o build passam.
- Prints em `OpenBot\Shared\aknewme-design\roxos-mais-ou-menos\`.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), Redis local só do QA. Sem prints. Medido em 1280 e 375.

- **V1:**
  - Em 1280, o selo, o Duelos e o Menu têm o mesmo roxo, `grape` rgb(75, 43, 214). Em 375, o Menu é `grape` e o selo é só o círculo lime.
  - Em `src`, só sobra uma cor fora dos tokens nos `.tsx`: o `themeColor` do `layout.tsx`, que já está entre as exceções da tabela.
- **V2:** o "Mais" tem o sweep `lime-deep` no hover, cobrindo 100%, com o texto em ink e sem fundo branco. É a regra mais nova (mais-ou-menos/01, seção 9).
- **V3:** no celular, a imagem das cartas tem 112 px de altura (o layout aprovado, mais-ou-menos/01, seção 6). As cartas e a faixa dos botões ficam à vista sem rolar para o lado.
- **V4:** `tsc`, `npm test`, `check:data` e o build passam.

Aprovada pelo QA em 28/11/2026.

- **Botão do cartão do modo igual sempre (dono, 28/11):** no `ModeCard`, o "Jogar"/"Ver resultado" é o mesmo em todos os estados: branco, com o lime entrando da esquerda no hover/foco e a seta deslizando. Saiu a variação de quem já jogou (fundo lime, sweep lime-deep e o check); o resultado fica só no topo do card ("Acertou…" / "Não foi dessa vez — era").
