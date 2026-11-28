# Login opcional e duelo com amigos

Estado: **rascunho para aprovação do dono**.

## Problema

O duelo é anônimo. A identidade é um código guardado no navegador mais um apelido digitado. Por isso:
- Não dá para convidar um amigo específico (só por link).
- Não há lista de amigos nem histórico entre aparelhos.
- O placar é aceito como vier do navegador (o próprio código do duelo marca isso como ponto aberto).

## Objetivo

Login opcional que dá identidade estável ao jogador, para: adicionar amigos, convidar para uma sala e jogar com vários amigos ao mesmo tempo, com placar verificado no servidor.

## Fora do escopo agora

- Jogar o desafio diário sem login continua igual. Login nunca é obrigatório para o jogo solo.
- Duelo por link anônimo continua funcionando como hoje.
- Tráfego pago e salas no Discord (ideia futura do dono): o modelo de sala deve aceitar uma origem `web` ou `discord` no futuro, mas nada disso é implementado agora.
- Pagamento, planos e recursos pagos.

## Requisitos

**Login**
- R1. Entrar com Google ou com Discord. Sem senha própria.
- R2. Login opcional: qualquer tela que não seja duelo com amigos funciona sem conta.
- R3. Sair da conta. Sair não apaga o histórico.
- R4. Excluir a conta e os dados (direito previsto na LGPD). Um clique com confirmação.
- R5. O jogador escolhe um **identificador** (handle) único, de 3 a 20 caracteres: letras minúsculas, números e `_`. É com ele que os amigos se encontram.
- R5a. Trocar o handle é permitido (decisão do dono, 26/11, opção b). O handle antigo fica **reservado para a mesma conta por 30 dias**: outra pessoa não consegue pegá-lo nesse período, e depois ele fica livre. Amizades, salas e placares são ligados à conta, não ao handle, então nada disso muda na troca.
- R5b. **Uma troca de @ por conta, para sempre** (decisão do dono, 27/11; substitui o limite de 3 a cada 30 dias). O @ criado automaticamente no login é **provisório**: a primeira escolha feita pela pessoa (saindo do @ automático, ou de nenhum @) é livre e não conta. Depois dela, a pessoa tem **uma** troca; depois da troca, o @ fica fixo e só o suporte muda. O @ antigo continua reservado para a mesma conta por 30 dias.
- R5c. A regra aparece antes de salvar, no campo de edição: "Você só pode trocar seu @ uma vez." (na escolha livre: "Escolha com calma: depois disso, você só pode trocar uma vez."). Ao salvar a troca, confirmação curta "Trocar para @novo? Não dá para mudar depois." (dono, 27/11), numa caixa com a mesma largura do campo do @ acima dela. Depois da troca, o botão "Editar" não aparece e não há selo "@ definitivo" (dono, 27/11): só o @.
- R5d. Termos (`/terms`), seção sobre o nome de usuário: "Você escolhe seu @ ao entrar e pode trocá-lo uma única vez. Depois disso, mudanças só pelo suporte (contato@aknewme.com), com confirmação de que a conta é sua. Podemos remover um @ ofensivo ou que se passe por outra pessoa."
- R5f. **Filtro de @ ofensivo** (dono, 27/11): o servidor recusa @ com termos ofensivos (palavrões, ofensas e discurso de ódio em português e inglês), também com troca de letras comuns (`0→o`, `1→i/l`, `3→e`, `4→a`, `5→s`, `7→t`, `@→a`) e com `_` no meio. Vale para o @ automático (se o nome do Google/Discord gerar um @ ofensivo, cai no passo 2), para a escolha e para a troca. Mensagem: "Esse @ não é permitido. Escolha outro." A lista fica num arquivo só, fácil de atualizar, com testes; para evitar bloqueio de palavras normais que contêm um termo curto, termos curtos só bloqueiam quando são o @ inteiro ou uma parte separada por `_`. O filtro também vale para as sugestões de @ livres (nunca sugerir @ ofensivo).
- R5e. Suporte (processo, sem tela): troca só depois de o pedido vir da própria conta (mesmo login Google/Discord) e com registro do caso; quem trocou por engano pode voltar ao @ antigo enquanto ele estiver reservado (30 dias), sem contar como troca.

**Amigos**
- R6. Adicionar amigo pelo handle. O outro aceita ou recusa.
- R7. Lista de amigos com quem está jogando o desafio de hoje.
- R8. Remover amigo. A remoção é imediata e dos dois lados.

**Duelo com amigos**
- R9. Criar uma sala para o desafio do dia (mesmo modo, mesmo dia) e convidar amigos da lista.
- R10. Até 4 jogadores por sala: o dono e até 3 amigos (limite de tamanho, para não virar operação pesada).
- R11. Quem entra na sala vê quem já entrou e quem já terminou. As jogadas dos outros só aparecem depois que o próprio jogador terminar ("sem espiar", igual ao duelo atual).
- R12. O placar é gravado no servidor, ligado à conta. O servidor recalcula o resultado a partir dos palpites enviados e não aceita o resultado pronto do cliente.
- R13. Quem já jogou o desafio não joga de novo na mesma sala (o placar fica).
- R14. Sala expira junto com o desafio do dia (sem placar eterno).

**Compatibilidade**
- R15. O duelo por link anônimo e o placar do Redis continuam funcionando durante a migração.
- R16. Nenhuma página atual muda de comportamento para quem não entra.

## Critérios de aceite

- CA1. Sem login: o jogo diário inteiro funciona como hoje (teste manual nos 4 modos).
- CA2. Entrar com Google e com Discord cria uma conta com @ (automático, quando possível, ou escolhido no passo 2), e sair mantém os dados.
- CA3. Adicionar amigo por handle inexistente mostra erro claro; por handle válido, o pedido aparece para o outro.
- CA4. Sala com 3 contas: cada uma vê os outros entrarem; ninguém vê jogadas de quem não terminou.
- CA5. Enviar um resultado inventado (fora do servidor) não é gravado como vitória: o servidor recalcula e rejeita a diferença.
- CA6. Excluir conta remove usuário, amizades e participações em até 24h (ou na hora, se possível).
- CA7. `npm run check:data` e `npm run build` passam.
- CA8. Nenhum arquivo `.ts/.tsx` passa de 500 linhas.
- CA9. Trocar o @: as amizades e as salas continuam; o @ antigo não é aceito por outra conta em até 30 dias; a primeira escolha (saindo do @ automático) é livre; depois, uma troca; a 2ª troca é recusada, para sempre.

## Perguntas em aberto (suposições marcadas)

- P1. Resolvido: 4 jogadores por sala (dono + 3 amigos).
- P2. Resolvido (dono, 26/11): amigo se adiciona só pelo handle, sem busca pública por nome.
- P3. Resolvido: página de privacidade na rota `/privacy`, com o texto em português.

## Idioma

- **Todos os textos do site são em português do Brasil** (decisão final do dono, 26/11; regra no `CLAUDE.md`): interface de todas as telas, títulos de página, metadados (`lang="pt-BR"`, OG `pt_BR`, JSON-LD `pt-BR`), datas e números no formato brasileiro, mensagens de erro e textos de acessibilidade (`aria-label`, `title`, `alt`).
- **Só as rotas ficam em inglês**: `/login`, `/handle`, `/friends`, `/room`, `/terms`, `/privacy`, `/archive`, `/support`, `/clues` etc. Não se troca nenhuma rota (o consentimento do Google usa `/terms` e `/privacy`).
- Identificadores internos (por exemplo, o modo `pistas`, as chaves do `localStorage` e do Redis, os códigos de erro das APIs) não mudam: são dados, não texto de tela.
- Esta spec e as demais em `specs/` são em português.
