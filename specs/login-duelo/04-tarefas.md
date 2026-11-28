# Tarefas técnicas: login e duelo

Ordem obrigatória. Cada tarefa tem um critério de pronto verificável. Nenhuma tarefa de código começa antes de 01, 02 e 03 aprovados.

## Fase 0: decisões (dono)

- [x] D1. Estilo de login escolhido: `c-minimo`.
- [x] D2. P1 (4 jogadores por sala), P2 (só pelo handle) e P3 (`/privacy`, em inglês) confirmados pelo dono.
- [~] D3. `DATABASE_URL`: feita pelo dono (Vercel). Pendente: `AUTH_SECRET` e os quatro `AUTH_*` (Google e Discord), que o dono cria nos apps OAuth e coloca na Vercel e no `.env.local`.

## Fase 1: base de dados e sessão (sem tela)

- [x] T1. Dependências: `next-auth@beta` (Auth.js v5) e o driver do Neon. Sem adapter (decisão do dono em 26/11: o adapter gravaria tokens OAuth e e-mail, contra `03-seguranca.md`). Pronto quando `npm run build` passa. **(26/11, ver 05-evidencias.md)**
- [x] T2. Migração inicial com as tabelas: `users` (id, handle único, nome, foto, criado em), `accounts` (exigida pelo Auth.js), `friendships` (user_id, friend_id, status `pending`/`accepted`, pk composta), `duels` (id, modo, dia, dono, origem `web`), `duel_players` (duel_id, user_id, status, palpites, resultado, terminou em). Pronto quando a migração roda do zero e de novo sem erro. **(26/11: Neon + Postgres embutido, ver 05)**
- [~] T3. Configuração do Auth.js com Google e Discord, sessão em cookie, rota `/api/auth/*`. Pronto quando entrar e sair funcionam num teste manual com as duas contas. **Código pronto; teste manual espera os AUTH_*.**
- [x] T4. `GET /api/me` (sessão atual, handle, se existe). Pronto quando devolve 401 sem sessão e os dados com sessão. **(26/11: 401 sem sessão e dados com cookie de teste, ver 05)**

## Fase 2: handle e amigos (API)

- [x] T5. `POST /api/me/handle`: valida formato (regex), reserva, unicidade. Pronto quando CA2 (parte de handle) passa e handle em uso dá erro claro. **(26/11, ver 05)**
- [x] T5a. Troca de handle (R5a, R5b, CA9; opção b do dono, 26/11): migração `002_handle_changes.sql` (`handle_reservations`: handle, user_id, reservado até; `handle_changes`: uma linha por troca). Mesmo `POST /api/me/handle`: o antigo fica reservado para a mesma conta por 30 dias; 409 `held` se o novo estiver reservado para outra conta; 429 `too_many_changes` na 4ª troca em 30 dias. Limite e prazo só em `src/lib/handle.ts` (`MAX_HANDLE_CHANGES`, `HANDLE_HOLD_DAYS`). Tela de conta mostra o handle atual e a regra. Pronto quando CA9 passa contra o Neon. **(26/11, ver 05)**
- [x] T6. `POST /api/friends` (pedido por handle), `PATCH /api/friends/:id` (aceitar/recusar), `DELETE /api/friends/:id`, `GET /api/friends`. Pronto quando CA3 passa e a remoção é vista pelos dois lados. **(26/11, ver 05)**
- [x] T7. Limite de requisições nas rotas de T5 e T6. Pronto quando a 21ª chamada em um minuto volta 429. **(26/11, ver 05)**

## Fase 3: sala e placar (API)

- [x] T8. `POST /api/duels` (cria sala do desafio do dia, com até 3 convidados que são amigos aceitos; sala com 4 jogadores no total), `POST /api/duels/:id/join`, `GET /api/duels/:id` (sem jogadas de quem não terminou). Pronto quando CA4 passa e convidar não amigo dá erro. **(26/11, ver 05)**
- [x] T9. `POST /api/duels/:id/result` com palpites. O servidor recalcula com `isCorrectGuess` e o desafio do dia; rejeita divergência com 409. Pronto quando CA5 passa num teste que envia resultado forjado. **(26/11, ver 05)**
- [x] T10. Testes unitários do recálculo (casos: tudo certo, tudo errado, palpite fora da lista, dica usada). Pronto quando `npm test` (ou script equivalente) passa. **(26/11: `npm test`, 35 testes)**
- [x] T11. `DELETE /api/me`: apaga usuário e dependências. Pronto quando CA6 passa. **(26/11, ver 05)**

## Fase 4: telas (depois de D1)

- [x] T12. Tela de login no estilo escolhido, com "Continuar sem entrar". Pronto quando U1 e U2 passam em 375 px e em desktop. **(26/11: medido em 375 e 1280 px, ver 05)**
- [~] T13. Tela de handle no primeiro login (validação ao vivo, estados de erro). **Código pronto e APIs testadas; tela com sessão não vista (espera login real).**
- [~] T14. Painel de amigos (lista, adicionar, aceitar/recusar). Pronto quando CA3 passa na tela. **Código pronto e APIs testadas; tela com sessão não vista (espera login real).**
- [~] T15. Sala de duelo (criar, convidar, lista de jogadores, placar lado a lado). Pronto quando CA4 passa na tela. **Código pronto e APIs testadas; tela com sessão não vista (espera login real).**
- [~] T16. Página `/privacy`, com o texto em inglês. Pronto quando está no ar e linkada no rodapé. **Página pronta, ainda não publicada; o site não tem rodapé (decisão do dono).**

## Fase 5: fechamento

- [ ] T17. Revisão de segurança contra `03-seguranca.md` (checklist no fim do arquivo).
- [ ] T18. `npm run check:data` e `npm run build` passam. Nenhum `.ts/.tsx` passa de 500 linhas (CA8).
- [ ] T19. Preencher `05-evidencias.md` com a saída dos comandos e os critérios marcados.
- [ ] T20. Nada commitado: o commit só sai com pedido explícito do dono.
