# Menos avisos na tela

Estado: **feito (27/11)**, pedido do dono.

## Aviso "Post novo no X" removido

- O `XPostAlert` (cartão flutuante chamando para um post do X) saiu de todas as telas: não estava convertendo.
- Saiu junto o que só existia para ele: `/api/xpost`; o card "Post do X na home" do `/plays` (escolher o post e o texto, server action `setPost`); as constantes `X_POST_URL`, `X_POST_KEY` e `X_POST_TEXT_KEY` de `src/lib/site.ts`; o clique `post` do `/api/played` e a coluna "Post" da tabela "Dia a dia" (e do `npm run plays`); o `id="ver-resultado"` do botão do fim de jogo (só o aviso usava).
- **Ficou:** o bot do X (`/api/xbot`, `lib/xposts.ts`, `lib/xbot.ts` e os cards do bot no `/plays`), o "Seguir no X" do menu e do fim de jogo, e a coluna "Seguir" do `/plays`. Os contadores antigos `click:post` continuam no Redis (histórico), só não aparecem mais.
- **Chaves do Redis `xpost` e `xpost:text`:** não foram apagadas ainda, porque o site no ar ainda lê essas chaves até o deploy. Depois do deploy, apagar com `DEL xpost xpost:text` no Redis de produção.
- Conferido no navegador (build de produção): home, modos, `/support` e `/login` sem o aviso, em 375 e 1280; `/api/xpost` responde 404; `/plays` sem o card. `tsc`, `npm test`, `check:data` e build passam.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), Redis local só do QA. Sem prints. Medido em 1280 e 375.

- Sem o aviso "Post novo no X" na home, nos modos, em `/login` e em `/support`.
- `/api/xpost` dá 404. O `/plays` não tem o card "Post do X na home" nem a coluna "Post"; os cards do bot continuam.
- Fica para depois do deploy: `DEL xpost xpost:text` no Redis de produção (o QA não toca nele).

Aprovada pelo QA em 28/11/2026.
