# Evidências: login e duelo

Specs usadas: 01 a 04 de 26/11/2026, com as decisões do dono do mesmo dia (sem adapter do Auth.js, limite no Redis que já existe, palpite de até 80 caracteres validado contra o catálogo, sala de 4 jogadores, estilo `c-minimo`, páginas novas em inglês, `/privacy`).
Nada foi commitado, publicado nem enviado à Vercel.

## Antes de começar

- `npm run build`: passou (sem mudanças, 22 páginas).

## Variáveis de ambiente (só os nomes, sem valores)

Conferido com `@next/env` (o mesmo carregamento do Next), imprimindo só "definida"/"FALTA":

| Variável | Local (`.env.local`) |
|---|---|
| `DATABASE_URL` | definida |
| `KV_REDIS_URL` | definida |
| `AUTH_SECRET` | FALTA |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | FALTA |
| `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET` | FALTA |

Sem `AUTH_SECRET`, todas as rotas de conta respondem 503 (`unavailable`) e o resto do site segue igual.

## Fase 1: base de dados e sessão

| Tarefa | Arquivos | Estado |
|---|---|---|
| T1 | `package.json` (`next-auth@5.0.0-beta.32`, `@neondatabase/serverless@1.2.1`, scripts `db:migrate` e `test`), `.env.example` (só nomes) | Pronto: build passa |
| T2 | `db/migrations/001_init.sql`, `scripts/migrate.mjs` | Pronto: roda do zero e de novo sem erro, no Neon e num Postgres embutido |
| T3 | `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/users.ts` | Código pronto. **Teste manual bloqueado**: faltam `AUTH_SECRET` e os quatro `AUTH_*` |
| T4 | `src/app/api/me/route.ts`, `src/lib/session.ts`, `src/lib/db.ts` | Código pronto. 401 sem sessão e dados com sessão: ver "Testes de API" |

Decisões técnicas:
- Sessão JWT com só o id interno (`uid`); nome, foto e e-mail não vão para o cookie. Google com escopo `openid profile`, Discord com `identify`.
- `accounts` guarda só provedor, id do provedor e usuário (sem tokens). Foto aceita só HTTPS de `lh3.googleusercontent.com` e `cdn.discordapp.com`.
- `requireUser` confere a sessão e o usuário no banco em toda rota; escrita com `Origin` de outro host volta 403.
- Logs do Auth.js e das rotas levam só o tipo ou código do erro.

Migração no Neon (`npm run db:migrate`):

```
migrate: 001_init.sql aplicada (9 comandos)
migrate: ok
```

De novo:

```
migrate: 001_init.sql já aplicada
migrate: ok
```

Tabelas no Neon depois: `accounts, duel_players, duels, friendships, schema_migrations, users`.

Do zero e de novo, sem a tabela de controle, num Postgres embutido (PGlite, fora do projeto), mais restrições e cascata:

```
rodada 1: 9 comandos ok
rodada 2: 9 comandos ok
restrições e cascata ok
```

`npm run check:data`:

```
check-data: 106 animes · 96 no Modo Opening
check-data: ok
```

`npm run build`: passou; rotas novas `ƒ /api/auth/[...nextauth]` e `ƒ /api/me`.

Aviso: `npm audit` aponta 3 vulnerabilidades (1 crítica) no `next@15.5.26` e no `postcss` que já estavam no projeto, não nas libs novas. Atualizar o Next fica para uma tarefa própria, com aprovação.

## Fases 2 e 3: handle, amigos, sala e placar (API)

### Revisão de `03-seguranca.md` antes do código: o que falta na spec

O que está marcado com ✓ já foi tratado no código. Os outros itens precisam de decisão do dono.

1. ✓ **CSRF nas rotas próprias**: a spec só fala do Auth.js. Escrita com `Origin` de outro host volta 403, e o corpo precisa ser JSON.
2. **O recálculo prova coerência, não honestidade**: a resposta do dia é calculável no navegador (`dailyAnimes` roda no cliente). Quem souber ler o código manda jogadas perfeitas. Vale registrar como risco aceito.
3. ✓ **Sessão JWT não se revoga sozinha**: conta excluída perderia o acesso só quando o JWT vencesse. Toda rota confere o usuário no banco. A duração da sessão (30 dias) não está na spec.
4. **Dono da sala exclui a conta**: a cascata apaga a sala dele e o placar dos amigos nela. A spec não diz se é isso que se quer.
5. **Fuso horário**: a sala usa o dia de Brasília, como o resto do servidor. Quem joga fora do Brasil perto da meia-noite pode estar em outro desafio e receber 409 `mismatch`.
6. **"Jogou hoje" (R7)**: o servidor só sabe das partidas em sala, porque o jogo solo fica no navegador. Hoje "jogou hoje" é "terminou uma sala hoje". [suposição]
7. **Limpeza das salas vencidas (R14)**: sem cron. As salas de antes de ontem são apagadas quando alguém cria uma sala nova, e a API responde 410 para sala de outro dia.
8. **IP do limite**: vem do `x-forwarded-for`, que a Vercel sobrescreve. Fora da Vercel dá para falsificar o IP (o limite por usuário continua valendo).
9. **Troca de handle**: a spec não diz se pode trocar. Hoje pode, a qualquer hora, e o handle antigo fica livre para outra pessoa. A lista de reservados tem só os 3 da spec.
10. **Pedido depois de recusa**: sem espera. Dá para pedir de novo logo depois de uma recusa, limitado por 20/min e 50 pendentes.
11. **Handle descobrível**: CA3 pede erro claro para handle inexistente, então dá para testar se um handle existe. O limite de 20/min atenua.
12. **Cabeçalhos de segurança e CSP** das páginas novas: não especificados.
13. **Usuário do banco com permissão mínima**: a migração precisa criar tabelas. Com um só `DATABASE_URL`, o app usa o mesmo papel da migração. Seria preciso um papel só para migrar. Não conferi as permissões do papel atual.
14. **Fotos dos provedores**: carregar a foto do Google ou do Discord expõe o IP de quem vê a lista ao provedor. Só HTTPS desses dois hosts é aceito.
15. **Contato da `/privacy`**: a spec pede "contato", mas não diz qual. Usei o perfil público do X do site. [suposição]

### Tarefas

| Tarefa | Arquivos | Estado |
|---|---|---|
| T5 | `src/app/api/me/handle/route.ts`, `src/lib/handle.ts` | Pronto e testado |
| T6 | `src/app/api/friends/route.ts`, `src/app/api/friends/[id]/route.ts`, `src/lib/friends.ts` | Pronto e testado |
| T7 | `src/lib/ratelimit.ts` (grupos `handle`, `handle-check`, `friends`, `duels`, `result`, `account`) | Pronto e testado |
| T8 | `src/app/api/duels/route.ts`, `src/app/api/duels/[id]/route.ts`, `src/app/api/duels/[id]/join/route.ts`, `src/lib/duels.ts` | Pronto e testado |
| T9 | `src/app/api/duels/[id]/result/route.ts`, `src/lib/replay.ts`; `src/lib/moves.ts` + uma linha por jogada em `EmojiGame`, `OpeningGame` e `CluesGame`; `rescueChoices` em `src/lib/game.ts` (o mesmo sorteio do resgate no jogo e no servidor) | Pronto e testado |
| T10 | `scripts/check-replay.mjs`, `scripts/ts-alias-hooks.mjs`, `npm test` | Pronto: 35 testes |
| T11 | `DELETE` em `src/app/api/me/route.ts` | Pronto e testado |

Além da spec, por necessidade da UX: `GET /api/duels` (convites e salas de hoje, para o convidado achar o convite) e `GET /api/me/handle?h=` (verificação ao vivo do handle).

### `npm test` (T10)

Dias 150, 200 e 214, com o catálogo e o sorteio reais:

```
dia 200
  ok emoji: tudo certo de primeira = 5 pontos, 5 verdes
  ok emoji: tudo errado (3 erros por rodada) = 0 pontos, perdeu
  ok emoji: dica usada (primeira letra) não muda o placar; erro antes do acerto = amarelo; pulo = preto
  ok emoji: partida incompleta ou jogada depois do fim = inválida
  ok opening: acerto de primeira = 1, verde
  ok opening: 6 erros/pulos = perdeu
  ok opening: dica usada (resgate) só depois de 4 tentativas e vale RESCUE_SCORE
  ok pistas: acerto com 1 pista = 5 pontos
  ok pistas: dica usada (revelar) e erro abrem pista; acerto na 3ª = 3 pontos
  ok pistas: tudo errado = perdeu com as 5 pistas abertas
validação das jogadas
  ok palpite fora da lista do catálogo = recusado
  ok palpite com mais de 80 caracteres = recusado
  ok jogada de outro modo, sem tipo ou lista vazia/grande demais = recusada
  ok apelido e caixa/acentos diferentes valem (mesma regra do isCorrectGuess)
  ok resultado forjado não bate com o recálculo (CA5)
check-replay: 35 testes ok
```

### Teste de ponta a ponta das APIs (Neon de verdade)

Como foi feito: `next start` local, com um `AUTH_SECRET` descartável que só existiu naquele processo (não foi para o `.env.local` nem para a Vercel). Cookies de sessão gerados para 5 contas de teste criadas direto no Neon, apagadas no fim. Isso testa as rotas e o banco, mas não o login com Google ou Discord (T3).

```
T4 /api/me
  ok 401 sem sessão; com sessão devolve id, handle (null), nome e foto, sem e-mail
T5 handle
  ok formato, reservado, em uso (409 taken) e gravado; verificação ao vivo
Segurança
  ok Origin de outro site = 403; corpo sem JSON = 400; cookie assinado com outro segredo = 401
T6 amigos (CA3)
  ok handle inexistente = 404 claro; pedido aparece para o outro; só o destinatário aceita; aceito dos dois lados
  ok recusar apaga o pedido
T8 sala (CA4)
  ok convidar quem não é amigo = 403; mais de 3 convidados = 400; sala criada
  ok convite aparece para o convidado; quem está fora = 404; cada um vê quem entrou
T9 placar (CA5)
  ok resultado forjado (5 pontos com 3 pistas) = 409 e nada gravado
  ok palpite fora do catálogo ou com mais de 80 caracteres = 400
  ok resultado certo gravado; jogar de novo na mesma sala = 409 (R13)
  ok sem espiar: B vê que A terminou, mas não o placar
  ok depois de terminar, B vê o placar de A; convidado que jogou direto entra e grava
R14 expirada
  ok sala de ontem = 410
T6 remover (R8)
  ok remoção vista pelos dois lados na hora
T7 limite
  ok 21ª chamada no minuto = 429
T11 excluir conta (CA6)
  ok usuário, login, amizades e participações apagados na hora; o cookie antigo deixa de valer
api-test: 16 verificações ok
limpeza: contas de teste restantes = 0
```

Neon depois do teste: `{"u":0,"a":0,"f":0,"d":0,"p":0}`, todas as tabelas vazias.

R15: `src/app/api/duel/route.ts` e `src/lib/challenge.ts` sem mudança (`git diff` vazio). `src/lib/xposts.ts` e `src/app/api/xbot` não foram tocados; as mudanças neles já existiam antes.

`npm run check:data`: `check-data: ok`. `npm run build`: passou (`✓ Compiled successfully`), com as rotas novas `/api/me/handle`, `/api/friends`, `/api/friends/[id]`, `/api/duels`, `/api/duels/[id]`, `/api/duels/[id]/join` e `/api/duels/[id]/result`.

## Fase 4: telas (estilo C, em inglês)

| Tarefa | Arquivos | Estado |
|---|---|---|
| T12 | `src/app/login/page.tsx`, `src/components/account/LoginCard.tsx`, `ui.tsx`; animações `reveal`, `ping-lime` e `shine-lime` em `globals.css` (só tokens) | Pronto. U1 e U2 medidos em 375 px e 1280 px |
| T13 | `src/app/handle/page.tsx`, `src/components/account/HandleForm.tsx` | Código pronto. Tela com sessão não vista (precisa de login real) |
| T14 | `src/app/friends/page.tsx`, `FriendsPanel.tsx`, `AccountActions.tsx` (sair, excluir conta com confirmação, trocar handle) | Código pronto; APIs testadas. Tela com sessão não vista |
| T15 | `src/app/room/new/page.tsx`, `src/app/room/[id]/page.tsx`, `NewRoom.tsx`, `RoomView.tsx`; entradas `AccountButton.tsx` (cabeçalho) e `FriendsRoomLink.tsx` (fim de jogo, em português: "Desafiar amigos" / "Voltar para a sala") | Código pronto; APIs testadas. Tela com sessão não vista |
| T16 | `src/app/privacy/page.tsx` | Página pronta (200 em 375 px, sem rolagem lateral). **Link no rodapé pendente**: o site não tem rodapé, e a home é feita para caber em 100vh. Hoje a `/privacy` está ligada pela tela de login e pela de amigos. Falta o dono decidir onde fica |

Verificado no navegador (build local, `next start`):
- `/login` em 375×667: os três botões têm 50 px de altura e terminam em 621 px, sem rolar (U1). "Continue without signing in" tem o mesmo tamanho dos botões de login (U2). Sem rolagem lateral. Em 1280×800, terminam em 645 px.
- Sem sessão, `/friends` e `/room/<id>` levam a `/login?next=...`, e "Continue without signing in" volta para o `next`.
- Provedor sem variáveis: o botão fica desativado, com "Signing in isn't available yet." (antes, o clique levava a uma página de erro do Google, "invalid_client").
- Redirecionamento do OAuth: Google `scope=openid profile`, Discord `scope=identify`, PKCE S256 e `state` nos dois. Cookies `authjs.*` com HttpOnly.
- Modo Pistas jogado no navegador (marcado como interno, sem contar nas métricas): as jogadas gravadas foram `reveal, guess Speed Racer, guess JoJo's Bizarre Adventure`. O navegador deu 3 pontos `🟪🟪🟩⬜⬜`, e o `replay` do servidor com as mesmas jogadas dá o mesmo resultado. No fim de jogo apareceram "Desafiar amigos" (→ `/login?next=/room/new?mode=pistas`) e o "Desafiar um amigo" anônimo de antes (R15).
- Cabeçalho em 375 px: na home, o botão de conta fica escondido (não cabe com os outros 4); o excesso de 1 px no cabeçalho da home já existia. Nas páginas de jogo, "Entrar" deixa o cabeçalho tão cheio quanto o da home (1 px de excesso, com o logo encostado no primeiro botão).

Não verificado:
- Login de verdade com Google e Discord (T3, CA2): faltam `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_DISCORD_ID` e `AUTH_DISCORD_SECRET`.
- Telas com sessão (handle, amigos, criar sala, sala e placar lado a lado) no navegador: só as APIs por trás delas foram testadas.
- CA1 completo (os 4 modos jogados sem login): só o Modo Pistas foi jogado, e as rotas `/`, `/emoji` e `/clues` respondem 200. Nos jogos, a mudança é uma linha por jogada que grava no `localStorage`.
- Leitor de tela real e `prefers-reduced-motion` ligado.

Texto a revisar: o protótipo C promete "History on any device", mas só os placares das salas ficam no servidor. O histórico do jogo solo continua no navegador.

`npm run check:data`: `check-data: ok`. `npm test`: `check-replay: 35 testes ok`. `npm run build`: passou, `✓ Generating static pages (31/31)`, com `/login`, `/handle`, `/friends`, `/privacy`, `/room/new` e `/room/[id]`. Maior arquivo: `src/components/EndCard.tsx` com 451 linhas (CA8).

## 26/11, pedido do dono: páginas legais, texto do login, Next, domínio, variáveis

**1. Páginas legais (inglês).**
- Cabeçalho próprio em `src/components/legal/Legal.tsx`: logo que leva ao jogo (`/`) e links Privacy/Terms com `aria-current`.
- `/privacy` reescrita.
- `/terms` nova (`src/app/terms/page.tsx`).
- Contato nas duas: `mailto:contato@aknewme.com` (`CONTACT_EMAIL` em `src/lib/site.ts`). O link do X saiu.
- A `/privacy` cobre a `03-seguranca.md`: dados guardados (id, provedor + id, nome, foto, handle, amigos, salas); sem e-mail e sem tokens; exclusão da conta; provedores (Google, Discord, Neon, Vercel).
- Acrescentado na `/privacy`, para ficar fiel ao site: o contador do limite (id e IP em hash, 1 minuto, Redis); o que fica no navegador; a analítica que já existia (contador anônimo, Vercel Web Analytics, Meta Pixel quando ligado).
- O texto dos Termos é um rascunho para o dono revisar, não um parecer jurídico. Não inclui lei aplicável nem foro.
- Verificado em 375 px: sem rolagem lateral nem cabeçalho estourado, links e `mailto` certos.

**2. Texto do login.**
- "History on any device" virou "Duel history on any device" em `LoginCard.tsx`, `02-ux.md` e no protótipo `estilos/c-minimo.html`.
- A tela de login também ganhou o link Terms, ao lado de Privacy policy.

**3. Next.js 15.5.26 → 15.5.29.**
- A 15.5.29 corrige as 7 falhas do Next, incluindo a crítica GHSA-2464-fhr4-w9xw, corrigida a partir da 15.5.28 (fonte: GitHub Advisory Database).
- `npm audit fix` atualizou também o `postcss` e o `source-map-js` do projeto.
- Restante no `npm audit`: o `postcss` 8.4.31 embutido no próprio Next (high), que só sai com o Next 16 (`npm audit fix --force`, mudança de versão principal). Não foi feito.
- Saídas:
  - `npx tsc --noEmit`: sem erros.
  - `npm test`: `check-replay: 35 testes ok`.
  - `npm run check:data`: `check-data: ok`.
  - `npm run build`: `▲ Next.js 15.5.29`, `✓ Generating static pages (32/32)`.

**4. Domínio.** O site é servido em `https://www.aknewme.com`. O apex redireciona para o www:

```
https://aknewme.com          308 -> https://www.aknewme.com/
https://www.aknewme.com      200
http://aknewme.com           308 -> https://aknewme.com/
http://www.aknewme.com       308 -> https://www.aknewme.com/
canonical: https://www.aknewme.com
```

- URLs de retorno a cadastrar:
  - `https://www.aknewme.com/api/auth/callback/google`
  - `https://www.aknewme.com/api/auth/callback/discord`
- O Auth.js monta o `redirect_uri` com o host que atendeu a requisição, e esse host é sempre o www depois do 308.
- Na tela de consentimento do Google, a página inicial, a política (`https://www.aknewme.com/privacy`) e os termos (`https://www.aknewme.com/terms`) devem usar o www.
- O domínio autorizado é `aknewme.com`, que cobre o www.
- Os callbacks não foram mudados.

**5. Variáveis no `.env.local`** (só os nomes): `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET` e `DATABASE_URL` existem, todas com valor.

## T5a: troca de handle (R5a, R5b, CA9), 26/11

O que mudou:
- `db/migrations/002_handle_changes.sql`: duas tabelas novas.
  - `handle_reservations`: handle (chave), user_id, `reserved_until`; apagada junto com a conta.
  - `handle_changes`: uma linha por troca. Serve para contar as trocas em 30 dias e é apagada depois disso.
- `src/lib/handle.ts`: `MAX_HANDLE_CHANGES = 3` (suposição da R5b) e `HANDLE_HOLD_DAYS = 30`, num lugar só, mais o texto da regra.
- `src/lib/handleChange.ts`: escolha ou troca numa transação.
  - A 1ª escolha não conta como troca.
  - Na troca, o handle antigo fica reservado para a mesma conta.
  - Quem volta para um handle que estava reservado para si mesmo encerra essa reserva; a volta conta como troca.
  - Reservas vencidas são limpas na troca seguinte.
- `src/app/api/me/handle/route.ts`: o mesmo caminho da T5.
  - Novos erros: 409 `held` e 429 `too_many_changes` (com `nextChangeAt`).
  - O `GET` sem `h` devolve `changesLeft`.
  - A verificação ao vivo responde `held` para handle reservado.
- Telas:
  - `AccountActions.tsx` mostra o handle atual, a regra dos 30 dias e quantas trocas restam; sem trocas, o botão fica desativado.
  - `HandleForm.tsx` mostra a regra no modo de troca e as mensagens de `held` e `too_many_changes`.
- `/privacy`: cita o handle reservado e o registro de trocas por 30 dias.
- Amizades, salas e placares são ligados ao `user_id`: nada muda na troca.

Migração:
- Postgres embutido, do zero e de novo: `001` e `002` ok nas duas rodadas, mais a reserva única por handle e a cascata na exclusão.
- Neon: `002_handle_changes.sql aplicada (4 comandos)`; rodada de novo, `já aplicada`.
- Tabelas no Neon: `accounts, duel_players, duels, friendships, handle_changes, handle_reservations, schema_migrations, users`.

Testes de API contra o Neon (`next start` local, `AUTH_SECRET` descartável só no processo, contas de teste apagadas no fim):

```
  ok 1 1ª escolha de handle não conta como troca nem cria reserva
  ok 2 troca ok: handle novo gravado, antigo reservado para a mesma conta por 30 dias
  ok 3 handle antigo recusado para outra conta (409 held) e não leva mais à conta antiga
  ok 4 amizade e sala continuam depois da troca, já com o handle novo
  ok 5 mesma conta pode voltar ao handle antigo (a reserva dele acaba; conta como troca)
  ok 6 4ª troca em 30 dias = 429 too_many_changes, com a data da próxima troca; handle não muda
  ok 7 passados os 30 dias, o handle antigo fica livre para outra conta
  ok 8 amizade e sala intactas depois das trocas das duas contas
  ok 9 excluir a conta apaga as reservas e o registro de trocas
handle-test: 9 verificações ok
limpeza: contas de teste restantes = 0
```

Regressão: o teste anterior das APIs continua com `api-test: 16 verificações ok`.

Verificações:
- `npx tsc --noEmit`: sem erros.
- `npm test`: `check-replay: 35 testes ok`.
- `npm run check:data`: `check-data: ok`.
- `npm run build`: `▲ Next.js 15.5.29`, `✓ Generating static pages (32/32)`.

Não verificado: as telas de conta e de handle com sessão de verdade no navegador (só as APIs por trás delas).

## Tela de login no layout `d-login-v2` (26/11)

O que mudou:
- `src/app/login/page.tsx`: tela cheia, sem o cabeçalho do site; o logo do painel leva ao jogo. A leitura dos provedores configurados não mudou.
- `src/components/account/LoginCard.tsx`, no layout do protótipo:
  - **Painel da marca:** grape sólido, título, 3 benefícios com números em lime e "アニメ" com opacidade de 0,07.
  - **Login:** "Sign in", Google em branco com borda e o G nas 4 cores, Discord em `discord` com o logo branco. Botões de 52 px e texto de 16 px.
  - **Linha legal:** links para `/terms` e `/privacy`, e "Continue without signing in" volta para o `next`.
  - **No celular (até 800 px):** o painel vira um cabeçalho curto e o login fica embaixo.
  - **Mantido:** botão desativado com a mensagem atual quando falta a variável do provedor, o erro `?error=` e o spinner sem duplo clique.
- `src/components/account/ProviderLogos.tsx`: os logos SVG do protótipo, pintados pelos tokens.
- `globals.css`: tokens novos para as cores das marcas: `discord`, `discord-deep`, `google-line`, `google-ink`, `google-hover`, `google-red`, `google-blue`, `google-yellow`, `google-green`, além de `on-grape`. Nenhum hex nos componentes.
- **Contraste:** `on-grape` sobre `grape` dá 5,8:1; branco sobre `discord`, 4,6:1.
- **Movimento:** sem animação contínua, só transição de cor no hover.

Comparação com o protótipo: `npm run dev` na porta 3001 (a 3000 era o dev do dono). Prints com o Chrome headless emulando a tela de verdade pelo DevTools Protocol. A `--window-size` do headless não serve abaixo de ~500 px, porque monta a página mais larga e só corta o print.

| Tela | Google (topo–base) | Discord | "Continue without signing in" | Último benefício |
|---|---|---|---|---|
| App 375×667 | 516–568 | 580–632 | 723 (abaixo da dobra) | 327–355 |
| Protótipo 375×667 | 516–568 | 580–632 | 723 (abaixo da dobra) | 326–354 |
| App 1280×800 | 322–374 | 386–438 | 528 | 700–728 |
| Protótipo 1280×800 | 322–374 | 386–438 | 529 | 700–728 |

Diferenças que ficaram:
1. No desktop, o painel tem 1265 px de largura útil em vez de 1280, porque o site reserva o espaço da barra de rolagem (`scrollbar-gutter: stable`, regra global). O painel fica 8 px mais estreito.
2. O selo "N" do Next só aparece no `npm run dev`.
3. Em 375×667, "Continue without signing in" fica abaixo da dobra, como no protótipo. Os 3 benefícios e os 2 botões aparecem sem rolar (U1). A U2, que pede "tão visível quanto", fica a critério do dono, porque o protótipo usa um link.

Durante o ajuste, igualei a altura de linha do logo e do "Sign in" à do protótipo (antes ficavam 16 px mais baixos) e o `space-between` do painel no celular.

Verificações:
- `npx tsc --noEmit`: sem erros.
- `npm test`: `check-replay: 35 testes ok`.
- `npm run check:data`: `check-data: ok`.
- `npm run build`: `▲ Next.js 15.5.29`, `✓ Generating static pages (32/32)`, `/login 4.34 kB`. Rodado numa cópia temporária do projeto (sem `.env*`, já apagada), para não sobrescrever a `.next` do `next dev` do dono.

Não verificado:
- O estado de provedor desativado na tela nova: o `.env.local` tem as duas variáveis. A lógica é a mesma de antes.
- O clique no login com as contas reais.

## 06-usuario: @ automático, passo 2 no login e "handle" → "@" (26/11)

O que mudou:
- `src/lib/handleSuggest.ts` (novo): `toHandle` (converte o nome), `freeHandles`, `alternatives` (até 3 @ livres) e `autoHandle`.
  - O `autoHandle` dá o @ no 1º login só se ele for válido, livre e não reservado.
  - Não grava em `handle_changes`, então não conta como troca.
- `src/auth.ts`: no login, chama `autoHandle` (Discord: `username`; Google: nome da conta). A sessão leva só a marca `autoHandle`, para a tela mostrar o aviso.
- `GET /api/me` agora devolve `autoHandle`. `GET /api/me/handle` aceita `?suggest=1` e, quando o @ não está livre, devolve `alternatives`.
- `src/components/account/HandleStep.tsx` (novo): o "Escolha seu @" dos prints. Tem:
  - indicador de passo, campo com @ e contador;
  - selo "livre ✓" / "já tem dono" e as sugestões;
  - prévia "Assim te veem nos duelos";
  - botão lime "Salvar meu @", a regra real de troca e "Fazer depois".
- `LoginCard.tsx`: volta do OAuth em `/login?done=1`. Com @, segue para `next` e mostra o toast se o @ foi automático; sem @, o passo 2 entra deslizando no lugar dos botões.
- `/handle` usa o mesmo componente: "Trocar seu @", ou "Escolha seu @" para quem ainda não tem.
- Toast: `SignInToast.tsx` no layout raiz, no mesmo visual do aviso do X.
- Menu com conta: item "Meu @nome", que leva a `/handle?edit=1`.
- "handle" saiu da interface: 18 textos trocados por "@" ou "nome de usuário" (amigos, conta, regra de troca, privacidade, termos), mais o título de `/handle` e o 1º benefício do login. A tela antiga de handle foi refeita.

Testes:
- U1 a U4 contra o branch `teste-login` (o banco do `npm run dev`), com contas de teste apagadas no fim:

```
  ok 1 conversão: minúsculas, sem acento, espaço/ponto/hífen → _, 3 a 20, só a-z 0-9 _
  ok 2 U1 Discord: username livre vira o @ (@t7e7787_disc) direto
  ok 3 U2 Google: "Zé Téste 7e7787" vira @ze_teste_7e7787 direto
  ok 4 U4: nenhuma linha em handle_changes; trocas na janela = 0
  ok 5 U3: @ze_teste_7e7787 já tem dono → nada salvo; sugestões livres: @ze_teste_7e778_ @ze_teste_7e778749 @ze_teste_7e778_anime
  ok 6 @ reservado (admin) não é dado; conta que já tem @ não muda no login seguinte
limpeza: contas de teste restantes = 0
```

- U3 na tela e o toast (U1/U2), com as respostas da conta simuladas no navegador de teste, em 375 e 1280 px:
  - passo 2 com "já tem dono" e as 3 sugestões;
  - "livre ✓" com "Salvar meu @" ativo;
  - vazio com "Salvar meu @" desativado;
  - toast "Seu @ é @gui_fernandes. Dá para trocar quando quiser no menu." depois de ir para a home;
  - sem cabeçalho nem menu no passo 2.
- U5: a busca por "handle" em texto de interface não acha nada.
- U6:
  - 375 px sem rolagem lateral;
  - "Salvar meu @" com 52 px, sugestões e "Fazer depois" com 44 px;
  - foco visível em campo e botões;
  - erros com `role="alert"`.
- U7:
  - `tsc` ok;
  - `npm test` ok (replay 35 + streak);
  - `npm run check` ok;
  - `check:data` ok;
  - `build` ok (32/32).

Não verificado: o login real com Google e Discord. A troca de código OAuth não dá para automatizar sem as contas.

## 07-perfil: avatar e painel da conta no cabeçalho (26/11)

O que mudou:
- `src/components/header/AccountMenu.tsx` (novo): com conta, o cabeçalho mostra um avatar de 40 px (foto do Google/Discord já guardada; sem foto, iniciais em lime).
  - O avatar abre o painel da conta com: foto de 56 px, nome em `font-display`, o @ em grape (ou o link "Escolher meu @"), "Meu @", "Amigos" (com os pedidos pendentes), "Salas de hoje" (`/friends#salas-de-hoje`), divisória de ponta a ponta e "Sair".
  - Lê a conta em `/api/me` e os pedidos em `/api/friends` só ao abrir. Nenhum dado novo é guardado.
- `src/components/header/useMenu.ts` (novo): o comportamento e os estilos comuns do Menu e do painel da conta (Esc, clique fora, foco de volta, setas, `aria-expanded`, `animate-menu-in`, cascata). O `SiteMenu` passou a usá-lo, sem mudar o comportamento.
- `ProfileAvatar` em `account/ui.tsx`: foto ou iniciais em lime. É usado também no cartão "Assim te veem nos duelos".
- `SiteHeader`: com conta, "Amigos" e "Meu @nome" saem do Menu e entra o avatar. Sem conta, continua o "Entrar" no Menu.
- `FriendsPanel`: a seção de salas ganhou a âncora `#salas-de-hoje`.

Teste: build da cópia rodando com `next start`, `AUTH_SECRET` descartável e o banco do branch `teste-login`. Foram 2 contas de teste (com e sem foto) e um pedido pendente, todos apagados no fim.

```
  ok 1 A3 sem conta: sem avatar; o 1º item do Menu continua "Entrar"
  ok 2 1280px com foto: A1 avatar com a foto; menu sem Amigos/Meu @; A2 painel (nome, @, Meu @, Amigos com 1 pendente, Salas de hoje, Sair), fecha com Esc (foco volta ao avatar) e clique fora; A4 sem rolagem lateral (painel 905–1177 de 1280)
  ok 3 375px com foto: (o mesmo) A4 sem rolagem lateral (painel 33–305 de 375)
  ok 4 A1 sem foto: avatar com as iniciais "BR" em lime; painel sem contador quando não há pedido
limpeza: contas de teste restantes = 0
```

A5:
- `tsc` ok;
- `npm test` ok (replay 35 + streak);
- `npm run check` ok;
- `check:data` ok;
- `build` ok (32/32).

Não verificado:
- "Sair" com uma sessão real: o botão chama o `signOut` do Auth.js e volta para a página atual.
- A foto de uma conta Google real: o teste usou um avatar público do Discord.

## 08-conta: cache da conta, página /account e animação de carregamento (26/11)

O que mudou:
- `src/lib/account.ts`: o cache guarda os campos públicos (id, nome, @, URL da foto). `rememberAccount` junta os campos; `null` apaga (Sair, Excluir, 401). `loadMe()` faz um único `/api/me` por carregamento, compartilhado pelas telas e pelo cabeçalho; trocar o @ atualiza o cache e a resposta já carregada.
- `src/components/account/AccountProvider.tsx` (novo, no layout raiz): lê o cache antes da 1ª pintura (`useLayoutEffect`) e confere `/api/me` uma vez. O `useAccount()` serve ao cabeçalho, ao `useAccountEntry` e ao `AccountMenu`.
- `header/AccountMenu.tsx`:
  - o bloco do topo (foto de 44 px, nome, @ ou "sem @ ainda") leva a `/account`, com divisória;
  - sai "Meu @";
  - ficam Amigos (com contador) e Salas de hoje;
  - "Sair" em `danger` com ícone.
- `/account` (novo): `app/account/page.tsx` + `account/AccountPage.tsx`, com perfil, "Seu @" (Trocar/Escolher abre o `HandleStep`), "Sair da conta" (danger, ícone), "Excluir conta" (com a confirmação) e o link da privacidade. Sem conta, vai para `/login?next=/account`.
- `account/AccountActions.tsx`: dividido em `SignOutButton` e `DeleteAccount`, usados pela `/account` e pela seção Conta do `/friends`.
- `components/Loading.tsx` (novo) e `--animate-logo-fill` em `globals.css`: logo em contorno preenchido em loop, `role="status"`, parado com movimento reduzido. Substituiu os carregamentos de `/friends`, `/handle`, `/room/new`, `/room/[id]` (inclusive "Conferindo sua partida"), do login ("Entrando") e da `/account`.

Testes: build da cópia com `next start`, `AUTH_SECRET` descartável e o branch `teste-login`. Foram 7 contas de teste, 2 salas e 1 pedido pendente, apagados no fim (0 restantes).

```
  ok 1 C1: com o servidor atrasado 3 s, o avatar (com foto) já está no cabeçalho em 1,2 s; um único /api/me por carregamento (na home e no /friends, onde a tela e o cabeçalho dividem a mesma resposta)
  ok 2 C3: painel com bloco do topo → /account, Amigos (1 pendente), Salas de hoje e "Sair" em danger com ícone; sem "Meu @"; 2 divisórias
  ok 3 C4: /account com o @, Trocar (abre o mesmo HandleStep, "Trocar seu @"), Sair da conta com ícone, Excluir conta com a confirmação e o link de privacidade
  ok 4 C2: resposta 401 apaga o cache e o cabeçalho volta ao estado sem conta; "Sair" apaga o cache (a exclusão usa a mesma limpeza)
  ok 5 C5: /friends, /account, /handle, /room/new e /room/[id] sem "Carregando…" em texto durante o carregamento
  ok 6 prints: 15 telas/estados em 1280 e 375 px salvos
```

C6:
- `tsc` ok;
- `npm test` ok (replay 35 + streak);
- `npm run check` ok;
- `check:data` ok;
- `build` ok (33/33, com `/account`).

Pacote para o redesenho: `C:\Users\cguifernandes\OpenBot\Shared\aknewme-design\`, com 30 prints e um `LEIAME.md` que lista tela, rota, componente e os estados que não aparecem nos prints.

Não verificado:
- A exclusão de conta pela tela: a confirmação foi aberta e cancelada; a exclusão em si já tinha sido testada pela API.
- O login real pelo OAuth.
