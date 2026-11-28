# Botões das lojas com a marca (Amazon e Mercado Livre)

Estado: **feito (27/11)**, pedido do dono.

- No cartão de apoio (`SupportCard.tsx`, bloco "Ou compre pelas lojas"), os dois botões ganham a cor de cada marca, como os botões de Google e Discord do login. Sem sweep: no hover a própria cor só escurece um pouco.
- **Amazon:** fundo "squid ink" `--color-amazon` (#232f3e), texto branco (13,6:1), hover `--color-amazon-deep` (#131a22, 17,5:1). Logo com a letra na cor do texto e o sorriso em `--color-amazon-smile` (#ff9900).
- **Mercado Livre:** fundo amarelo `--color-meli` (#ffe600), texto azul da marca `--color-meli-ink` (#2d3277, 9:1), hover `--color-meli-deep` (#f5d800, 8:1). **Sem logo:** não há logo do Mercado Livre em fonte de licença livre (nem no simple-icons nem no Font Awesome Free), então o botão usa só a cor.
- **Logos:** `components/StoreLogos.tsx`. O simple-icons (CC0) não tem mais a Amazon, então o ícone "amazon" vem do Font Awesome Free 7.3.1 (licença CC BY 4.0, com a atribuição no arquivo), com o caminho dividido em letra e sorriso. Sem dependência nova.
- As cores são tokens em `globals.css`. O `SupportCard` aparece só em /support.
- Conferido no navegador (build de produção) em 1280 e 375: cores e contraste acima, logo de 18 px com a letra branca e o sorriso laranja, os dois botões do mesmo tamanho (220 px e 136 px × 44 px), o texto cabe, sem rolagem lateral; no hover, #131a22 e #f5d800, sem sweep. `tsc` e build passam.

## Logo do Mercado Livre (dono, 27/11, pedido 4696224f)

- O dono enviou o logo oficial (`ML_br_RGB_claim.svg`, 697 KB, exportado do Illustrator, sem scripts; marca registrada do Mercado Livre). Dele saiu só o **símbolo** (o aperto de mãos na elipse): os 6 caminhos do grupo do logo colorido, medidos no navegador, sem metadados do Illustrator, com `viewBox` justo. O componente `MercadoLivreLogo` em `StoreLogos.tsx` tem 4,9 KB (a origem está citada no comentário).
- Cores pelos tokens: `--color-meli-ink` virou o azul oficial do arquivo (#283277, Pantone Blue 072; o texto do botão fica a 9,1:1 no amarelo e a 8,1:1 no hover) e `--color-meli-symbol` (#ffd100, Pantone 109) é o amarelo do símbolo; as mãos são brancas.
- Conferido no navegador (build de produção) em 1280 e 375: símbolo de 26×18 px antes de "Mercado Livre", com o azul, o branco e o amarelo da marca; o texto cabe.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), Redis local só do QA. Sem prints. Medido em 1280 e 375.

- **Amazon:** fundo rgb(35, 47, 62) (#232f3e) com texto branco. No hover, rgb(19, 26, 34) (#131a22), sem sweep. Logo com 18 px de altura.
- **Mercado Livre:** fundo rgb(255, 230, 0) (#ffe600) com texto rgb(40, 50, 119) (#283277). No hover, rgb(245, 216, 0), sem sweep. Símbolo com 26×18 px.
- Os dois botões têm o mesmo tamanho: 220×44 em 1280 e 136×44 em 375. Sem rolagem lateral em `/support`.

Aprovada pelo QA em 28/11/2026.
