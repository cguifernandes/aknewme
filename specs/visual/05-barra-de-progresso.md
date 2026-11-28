# Barra de progresso ao navegar

Estado: **feito (27/11)**, pedido do dono.

- Componente próprio `components/NavProgress.tsx`, no `layout.tsx` (sem dependência nova). Uma barra fina no topo da tela: 3 px, `bg-lime` com brilho leve (sombra lime), acima de tudo (`z-[100]`), sem pegar cliques.
- **Quando aparece:** clique em link interno para outra página (Link do Next ou `<a>`; não conta nova aba, Ctrl/Cmd/Shift/Alt, download, âncora na mesma página nem outro site) e navegações pelo código que chamam `navigateStart()` antes de `router.push/replace` (login → próxima página, Arquivo → jogo do dia).
- **Atraso de 150 ms:** navegação mais rápida que isso (ex.: página já pré-carregada) não mostra a barra.
- **Enquanto carrega:** começa em 12% e avança cada vez mais devagar até perto de 90%. Quando a página nova aparece (troca de rota), completa a 100% e some (300 ms). Se a página nunca trocar (erro, navegação cancelada), some sozinha em 12 s.
- **Movimento reduzido** (`prefers-reduced-motion`): a barra aparece inteira e parada enquanto carrega, sem transição.
- Não substitui o Loading das áreas (cada tela continua com o seu).
- Detalhe técnico: o clique é ouvido na fase de captura, porque o Link do Next cancela o clique (`preventDefault`) antes de ele chegar ao document na fase normal.
- Conferido no navegador (build de produção, 1280, navegação atrasada de propósito em 2,5 s): parada, escondida (3 px, opacidade 0); home → Modo Emoji, Menu → Entrar (/login) e /friends → home (logo): apagada aos 80 ms, acesa e avançando aos ~500 ms, apagada quando a página nova aparece; página já pré-carregada: não acende em nenhum momento; movimento reduzido: inteira (largura da tela) e sem transição. `tsc`, `npm test` e build passam.

## QA (28/11)

Testado pelo bot de QA: build de produção (cópia em `next start` na 3100), Redis local só do QA. Sem prints. Medido em 1280 e 375.

Navegação da home para o Emoji, com a resposta da página atrasada 3,5 s de propósito:

- Aos 80 ms a barra está escondida. Aos 600 ms está acesa, com 242 px; aos 2 s, com 633 px. Some quando a página troca.
- Página já pré-carregada: a barra não acende.
- Movimento reduzido: a barra fica inteira (1265 px) e parada enquanto carrega.

Aprovada pelo QA em 28/11/2026.
