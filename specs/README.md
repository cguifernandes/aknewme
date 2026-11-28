# Specs (SDD: Spec-Driven Development)

Cada funcionalidade nova tem uma pasta aqui antes de virar código. A spec é a fonte da verdade: o código tem de bater com ela, e não o contrário.

## Fluxo de cada pedido do dono (27/11)

1. **Triagem (Bot builder / orquestrador):** decide se o pedido precisa de spec, de Produto e de UI/UX. Pedido pequeno (texto, cor, ajuste visual pontual) pode ir direto ao Dev com uma linha na spec existente.
2. **Produto (Fofinho)**, quando o pedido muda regra, fluxo, dados guardados, prioridade ou texto que promete algo ao jogador.
3. **UI/UX (Burrinho)**, quando o pedido cria ou muda tela, fluxo visual, estados ou componentes.
4. **Spec**: requisitos, UX, segurança e critérios de aceite em `specs/<funcionalidade>/`.
5. **Dev (Filho da puta)** implementa pela spec. Roda só `tsc` e `npm test` (e `check:data` se mexer no catálogo). Não roda build nem testa no navegador.
6. **QA** testa a spec inteira: build de produção, computador e celular, todos os critérios de aceite, todos os estados e segurança. Falhas voltam para o Dev; a spec só fecha quando o QA aprova.
7. **Spec finalizada**: o QA marca no fim do arquivo "Aprovada pelo QA em <data>".

## Arquivos de uma spec

- **Requisitos**: problema, escopo, regras e critérios de aceite.
- **UX**: telas, fluxos, estados (vazio, carregando, erro, sem rede), responsividade e acessibilidade.
- **Segurança**: ameaças, dados pessoais, segredos, limites de uso.
- **Tarefas e evidências**: o que o Dev fez e o que o QA testou.

## Regras

- Um critério de aceite sem teste do QA não está pronto.
- Mudou a regra? Atualize a spec antes do código.
- O que não está na spec é [suposição] até o dono confirmar.
- Nada é commitado nem publicado sem pedido explícito do dono.

## Idioma

- Todo o texto do site é em português; só as rotas ficam em inglês (`/login`, `/friends`, `/privacy`…).
- Specs em português.
