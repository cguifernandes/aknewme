# Segurança: login e duelo

Estado: **revisão inicial**. Precisa de aprovação antes de qualquer código de servidor.

## Dados pessoais

- Guardar só: id interno, provedor e id do provedor (ex.: id do Discord), handle, nome de exibição, URL da foto e o **e-mail** com o indicador `email_verified`.
- **E-mail (decisão do dono, 26/11, 09-menu-perfil.md):** escopos Google `openid profile email` e Discord `identify email`. Fica em `users.email` e `users.email_verified` (migração `003_user_email.sql`), gravado e atualizado a cada login; se o provedor não mandar, fica o que já estava.
  - Para quê: mostrar mascarado ao próprio dono da conta (cartão Conta da janela Meu perfil; `/api/me` só devolve a versão mascarada, o completo não sai do servidor) e achar a conta em pedidos de suporte ou de exclusão.
  - Não aparece para outros jogadores, não vai para logs nem para o cookie da sessão, não é usado para marketing (isso pediria consentimento próprio). Contas não são juntadas por e-mail nesta versão.
  - Contas que entraram antes: `NULL` até o próximo login (a tela mostra "aparece no próximo login").
  - Antes do deploy: rodar `npm run db:migrate` no banco principal.
- Excluir conta apaga o registro (com o e-mail), as amizades e as participações em salas.
- Logs não recebem handle, nome, e-mail nem token. Só ids internos.

## Autenticação

- Auth.js (NextAuth v5) com provedores Google e Discord. Ele cuida do fluxo OAuth com `state` e PKCE.
- Sem adapter do Auth.js (decisão do dono, 26/11): sessão JWT no cookie; o app grava `users` e `accounts` só com os campos acima (sem tokens OAuth). Toda rota confere no banco se o usuário ainda existe, para conta excluída perder o acesso na hora.
- Sessão em cookie `httpOnly`, `secure` e `sameSite=lax`. Sem token no `localStorage`.
- `AUTH_SECRET` só no ambiente da Vercel. Nunca no repositório.
- Toda rota de escrita confere a sessão no servidor (não confia no cliente).

## Autorização

- Só o dono da sala convida. Só quem é amigo aceito pode ser convidado.
- Ver placar de uma sala: só quem está na sala.
- Aceitar ou recusar pedido: só o destinatário.

## Integridade do placar

- O servidor guarda os palpites enviados e recalcula o resultado com a mesma regra do jogo (`isCorrectGuess` e os dados do desafio do dia).
- Resultado pronto enviado pelo cliente é ignorado. Se não bater com o recálculo, a resposta é 409 e nada é gravado.
- Confirmado (dono, 26/11): cada palpite tem até 80 caracteres e precisa ser título ou apelido de um anime do catálogo; fora disso, 400 e nada é gravado.

## Abuso e limites de uso

- Limite de requisições por usuário e por IP nas rotas de amizade, criação de sala e envio de resultado (20 por minuto). Confirmado (dono, 26/11): contador no Redis que já existe (`KV_REDIS_URL`), sem serviço novo; sem Redis, a rota segue liberada (falha aberta).
- Limite de 4 jogadores por sala e de pedidos de amizade pendentes por conta (ex.: 50).
- Handle com validação no servidor (regex), não só no formulário. Lista de handles reservados (`admin`, `aknewme`, `suporte`).

## Banco (Neon)

- Usuário de aplicação com permissões mínimas (sem `CREATE ROLE`, sem acesso a outros bancos).
- String de conexão só em variável de ambiente. Conexão com SSL (`sslmode=require`).
- Consultas com parâmetros (nada de montar SQL com texto vindo do usuário).
- Plano grátis do Neon: 1 GB por projeto e 100 horas de computação por mês (fonte: [documentação de limites do Neon](https://neon.com/faqs/free-plan-limits-and-quotas) e [anúncio do plano grátis](https://neon.com/blog/neon-free-plan-1-gb-per-project), ambos em inglês). Confirmar na página oficial de planos antes de lançar.

## Segredos (nomes, sem valores)

| Variável | Onde | Para quê |
|---|---|---|
| `AUTH_SECRET` | Vercel | Assinar a sessão |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Vercel | Login com Google |
| `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET` | Vercel | Login com Discord |
| `DATABASE_URL` | Vercel | Conexão com o Neon (pooled, com SSL) |

Local: `.env.local` (ignorado pelo git). `.env.example` lista só os nomes.

## Privacidade e termos

- Página `/privacy` (em português; só a rota é em inglês) com o que é guardado, por quê, como excluir a conta e contato. Exigida pelo Google na aprovação do login.
- Discord: a tela de autorização mostra só o nome e a foto (escopo `identify`).

## Riscos aceitos

- Enquanto o duelo anônimo existir, o placar dele continua sem garantia de servidor (como hoje). Isso fica claro no código e não muda neste ciclo.
- Sem verificação de bot nos cadastros nesta fase. Se houver abuso, adicionar Turnstile (ou equivalente) em um ciclo próprio.

## Checklist antes de publicar

- [ ] Segredos só na Vercel, nada no git (`git status` limpo de `.env*`)
- [ ] Teste: alterar um resultado no navegador é rejeitado pelo servidor
- [ ] Teste: convidar quem não é amigo é recusado
- [ ] Teste: excluir conta remove os dados
- [ ] Página `/privacy` no ar, em português

## Correções das falhas do QA (28/11)

- **Cabeçalhos:** `next.config.ts` sem `X-Powered-By` (`poweredByHeader: false`) e, em todas as rotas, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (câmera, microfone, localização, pagamento, USB e browsing-topics desligados) e `Content-Security-Policy: frame-ancestors none` (aplicada). O resto da CSP está em **`Content-Security-Policy-Report-Only`**: `default-src self`; scripts do próprio site (+ `unsafe-inline` da hidratação do Next; `unsafe-eval` só no dev), Meta Pixel (`connect.facebook.net`) e Vercel Analytics (`va.vercel-scripts.com`); estilos do site + `unsafe-inline` + Google Fonts; fontes do site, `data:` e `fonts.gstatic.com`; imagens do site, `data:`, `blob:`, AniList (`s4.anilist.co`), MAL (`cdn.myanimelist.net`), avatares do Google (`lh3.googleusercontent.com`) e do Discord (`cdn.discordapp.com`) e o pixel (`www.facebook.com`); áudio do iTunes (`audio-ssl.itunes.apple.com`); conexões do site, do pixel e do Analytics (`vitals.vercel-insights.com`); sem frames nem `object`; `base-uri self`; `form-action` do site, `accounts.google.com` e `discord.com` (login). Vira CSP de verdade depois de o QA confirmar que nada aparece bloqueado no console.
- **Desafiante único:** `saveLinkDuel` recusa (`taken`, 409) gravar como desafiante um duelo que já tem desafiante de outra conta; o índice único parcial `link_duels_one_challenger` (migração 011) garante também em paralelo. O envio de convite já exige que o duelo tenha como desafiante quem envia (`no_duel`) e agora devolve 409 `taken` se o id for de outra pessoa.
- **Troca de @ em paralelo:** o contador `users.handle_changes_used` (migração 011, preenchido com o que já havia em `handle_changes`) é conferido e somado no mesmo UPDATE da linha do usuário, junto da reserva do @ antigo e do registro da troca, numa consulta só. A linha fica travada durante a gravação: a 2ª chamada espera e, conferindo a linha já gravada, não passa.
- **Testes:** `scripts/check-races.mjs` (no `npm test`, no banco do dev; sem ele, pula): 3 trocas ao mesmo tempo → 1; @ provisório + 3 mudanças → no máximo a escolha e 1 troca; 2 contas como desafiante do mesmo duelo → 1.
- **Migração no principal antes do deploy:** `npm run db:migrate` (aplica 003–011).

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia do projeto em `next start` na 3100), banco do branch `teste-login`, Redis local só do QA e contas `qa_*` apagadas no fim (0 restantes). Sem prints.

- **1ª rodada:** 51 checagens passaram e 3 falharam:
  - faltavam os cabeçalhos de segurança e saía `X-Powered-By`;
  - dava para gravar a partida como desafiante com o id do duelo de outra pessoa;
  - a troca de @ passava duas vezes com chamadas em paralelo.
- **Reteste depois da migração 011:**
  - **Cabeçalhos** (`nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, CSP `frame-ancestors 'none'` e a CSP Report-Only), sem `X-Powered-By`. Conferidos em `/`, `/emoji`, `/login`, `/friends`, `/api/me`, `/api/duel` e `/plays`.
  - **CSP Report-Only: nenhuma violação no navegador**, em 1280 e 375, com e sem conta, nestas páginas: `/`, `/emoji` e `/clues` (com palpite), `/opening` (o áudio do iTunes tocou, 206), `/higher-lower`, `/archive`, `/login`, `/support`, `/plays`, `/duel`, `/terms`, `/privacy`, `/friends`, `/account` e a janela Meu perfil. A coleta foi validada com uma violação feita de propósito, que foi registrada.
  - **Desafiante:** outra conta no id da Ana → 409 `taken`. Com 3 contas em paralelo no mesmo id, só 1 grava. Convite com o id de outra pessoa → 409. A resposta continua ligada à desafiante certa.
  - **Troca de @ em paralelo:** com 2 e com 3 chamadas, só 1 passa, e fica 1 linha em `handle_changes` (`handle_changes_used` = 1). O @ provisório com 3 trocas em paralelo também grava só 1 troca.
  - A bateria inteira da API rodou de novo no build novo, sem regressão.
- **Não testado aqui:**
  - o cookie `Secure`, que só existe em HTTPS;
  - o login real com Google e Discord (os callbacks só aceitam aknewme.com) e o `form-action` da CSP;
  - o Meta Pixel e o Vercel Analytics, que não carregam fora da Vercel sem o id do pixel.

  Isso fica para conferir no ar antes de a CSP passar a valer.
- **Observação:** `npm audit` mostra 1 alta no `postcss` que vem dentro do `next` (só roda no build; a correção pede o next 16).

Aprovada pelo QA em 28/11/2026.
