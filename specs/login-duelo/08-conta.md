# Conta: cache da sessão, página da conta e animação de carregamento

Estado: **pedido do dono, aprovado (26/11)**. Textos em português; rotas em inglês.

## 1. Avatar sem demora ao recarregar (cache no cliente)

Problema: ao recarregar, o avatar demora porque o cabeçalho pede os dados da conta ao servidor toda vez.

- Um **contexto React** (`AccountProvider` no layout) guarda os dados públicos da conta: id, nome, @, URL da foto e se tem @.
- Na abertura da página, o contexto lê o **cache do navegador** (`localStorage`, só esses campos públicos, sem token) e mostra o avatar na hora.
- Em seguida, confere o servidor **uma vez** por carregamento (`/api/me`) e atualiza o cache se algo mudou. Sem novas chamadas a cada navegação entre páginas.
- Ao sair ou excluir a conta, o cache é apagado. Se `/api/me` responder 401, o cache é apagado e o cabeçalho volta ao estado sem conta.
- Ao trocar o @, o contexto e o cache são atualizados na hora.
- O contador de pedidos pendentes continua sendo lido ao abrir o painel.

## 2. Painel da conta (ajustes)

- O bloco do topo (foto, nome, @) é **clicável** e leva a `/account`. Embaixo dele, uma divisória de ponta a ponta.
- Foto do bloco do topo menor (≈ 44 px, em vez de 56 px).
- Sem @: no lugar do @, o texto "sem @ ainda" em `muted` (a escolha fica na página da conta).
- Sai o item "Meu @".
- Itens: Amigos (com contador), Salas de hoje, divisória e **Sair** com ícone de sair, em `danger`.

## 3. Página da conta (`/account`)

Com o visual das telas de conta (cabeçalho do site, coluna central):
- Cartão com foto, nome e @.
- **Seu @**: mostra o @ atual e o botão "Trocar" (ou "Escolher meu @", sem @), que abre a mesma edição de `/handle` (mesmo componente, com as regras de troca).
- **Sair da conta**: botão com ícone, em `danger`, sem confirmação.
- **Excluir conta**: botão em `danger` com confirmação (mesma confirmação que já existe).
- Link **Política de privacidade** (`/privacy`).
- Sem conta: redireciona para `/login?next=/account`.

## 4. Animação de carregamento (todas as telas)

- Trocar os textos "Carregando…" e os spinners das telas por uma animação única do projeto: o logo **"aknewme."** aparece primeiro só com o contorno do texto e vai sendo **preenchido com a cor do texto** da esquerda para a direita, em loop.
- Componente único (ex.: `Loading`), com `role="status"` e o texto "Carregando" só para leitor de tela.
- Com `prefers-reduced-motion`: logo preenchido, parado.
- Os spinners dentro de botões (enquanto envia) podem continuar pequenos; a animação nova é para áreas de carregamento de tela ou seção.

## Critérios de aceite

- C1. Recarregar com conta mostra o avatar na primeira pintura (sem esperar o servidor), e um único `/api/me` por carregamento.
- C2. Sair ou excluir limpa o cache; 401 do servidor também.
- C3. Painel: bloco do topo leva a `/account`; "Sair" vermelho com ícone; sem "Meu @".
- C4. `/account` tem trocar @, sair, excluir conta (com confirmação) e o link de privacidade.
- C5. Nenhuma tela mostra "Carregando…" em texto; todas usam a animação do logo.
- C6. `tsc`, `npm test`, `npm run check:data`, `npm run build` passam.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), branch `teste-login` e contas `qa_*` apagadas no fim (0 restantes). Sem prints. Medido em 1280 e 375. C3 e C5 seguem o que a 09-menu-perfil.md substituiu: o bloco do topo abre o Meu perfil, e o carregamento é spinner + "Carregando" com três pontos.

- **C1:**
  - O cache guarda só id, nome, @ e foto.
  - Com o `/api/me` atrasado 3 s, o Menu já mostra a conta em cerca de 1 s.
  - Há 1 `/api/me` por carregamento, e ir para `/friends` pelo Menu não faz outra chamada.
- **C2:**
  - Conta apagada no banco: no recarregar vem 401, o cache é limpo e o Menu volta a "Entrar".
  - Sair mostra o spinner e desativa o botão na hora. Depois limpa o cache, apaga o cookie (`/api/me` passa a dar 401) e volta sem conta.
  - Excluir: Esc cancela. Durante a exclusão, os dois botões ficam desativados. A conta some do banco, o cache é limpo e a home abre sem conta.
- **C3 (pela 09):** o bloco do perfil abre o Meu perfil; Sair fica no rodapé do Menu.
- **C4:**
  - `/account` tem Trocar (que abre o Meu perfil já editando), Sair da conta, Excluir conta (com a janela "Excluir sua conta?", sem salas e com a nota da sequência) e Política de privacidade. Sem rolagem lateral.
  - Sem conta, `/account` vai para `/login?next=/account`.
- **C5 (pela 09):** carregamento com spinner, "Carregando" e 3 pontos animados, em `role=status`. Com movimento reduzido, os pontos ficam parados e visíveis. Nenhum "Carregando…" nem texto próprio de tela.
- **C6:** `tsc`, `npm test`, `check:data` e o build passam.

Aprovada pelo QA em 28/11/2026.
