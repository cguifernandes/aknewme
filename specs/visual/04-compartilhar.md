# Um só "Compartilhar resultado" no fim de jogo

Estado: **feito (27/11)**, pedido do dono (análise do Produto).

- Fim de jogo (`EndCard.tsx`), 3ª aba "Sua opinião e mais": saíram o cartão com "www.aknewme.com" + "Copiar link" e o botão "Copiar meu resultado (sem spoiler)".
- No lugar, um só botão **"Compartilhar resultado"** (ícone de compartilhar): leva o texto sem spoiler + o link do site, o mesmo que o `shareBody` já montava (com "Melhor que X%" e a sequência quando houver). No celular abre o compartilhar nativo; no computador copia e o botão vira "Copiado!" (com o check).
- **Onde ficou:** só na 3ª aba. Não havia outro "Compartilhar" do resultado nas outras abas. O "Compartilhar" que existe na tela de quem abriu um link de desafio é outro (o placar do duelo, "Copiar" e "Postar") e não mudou.
- Continuam: "Desafiar um amigo" (2ª aba), "Segue no X" e "Apoie o aknewme".
- Conferido no navegador (build de produção) em 1280 e 375: a 3ª aba tem só "Compartilhar resultado" (sem "www.aknewme.com", "Copiar link" ou "Copiar meu resultado"); o clique copia "aknewme #202 · Modo Pistas / quadradinhos / 👉 …/clues?d=202&utm_source=share", sem o nome do anime, e mostra "Copiado!"; sem rolagem lateral. O compartilhar nativo do celular não abre no navegador de teste (cai na cópia). `tsc`, `npm test` e build passam.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), Redis local só do QA. Sem prints. Medido em 1280 e 375.

- A 3ª aba tem só "Compartilhar resultado", sem "www.aknewme.com", "Copiar link" ou "Copiar meu resultado". "Apoie o aknewme" e "Segue no X" continuam.
- O clique copia "🔎 aknewme #203 · Modo Pistas / … / 🟩⬜⬜⬜⬜ / … / 👉 …/clues?d=203&utm_source=share", sem o nome do anime, e mostra "Copiado!". Sem rolagem lateral.
- O compartilhar nativo do celular não abre no navegador de teste.

Aprovada pelo QA em 28/11/2026.
