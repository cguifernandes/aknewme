# Evidências: cabeçalho (26/11/2026)

Spec: `01-cabecalho.md`. Nada foi commitado nem publicado.

## O que mudou

| Arquivo | Mudança |
|---|---|
| `src/components/SiteHeader.tsx` | Novo cabeçalho: logo · [home: sequência · Duelos] · Entrar · Menu. As janelas (Como jogar, Estatísticas) ficam montadas aqui e abrem pelo Menu. `z-50`, para o Menu aberto ficar acima do aviso do X (`XPostAlert`, `z-40`). |
| `src/components/header/SiteMenu.tsx` (novo) | Botão Menu (`ink`, ícone de três linhas + "Menu", 40 px) e o painel: Duelos (só no celular, na home), Como jogar, Estatísticas, Desafios anteriores (fora do `/archive`), Apoiar o projeto, Seguir no X (`@aknewmee`, nova aba) e, no rodapé, Termos e Privacidade. Usa `role="menu"`, `aria-haspopup="menu"` e `aria-expanded`. Setas ↑/↓, Home e End andam pelos itens; Esc fecha e devolve o foco ao botão; clique fora fecha; escolher um item fecha. |
| `src/components/header/StreakBadge.tsx` (novo) | Sequência (só na home, com valor maior que zero): círculo `lime` com o número e, quando o desafio de hoje foi jogado, um check `lime` sobre `ink` no canto. No computador, ao lado: "dia(s) seguido(s)" e "hoje já foi" / "jogue hoje", sobre `track`. No celular, só o círculo. Sem chama. |
| `src/components/HowToPlay.tsx`, `src/components/StatsDialog.tsx` | Mesma janela de antes, sem o botão redondo; abrem por `ref.open()`. "Como jogar" em página sem texto próprio usa o da home. |
| `src/components/DuelsDialog.tsx` | O botão virou o texto "Duelos" com o número de duelos novos (`blush`). A mesma janela abre pelo item do Menu no celular. |
| `src/components/account/AccountButton.tsx` | Texto "Entrar" (ou "Amigos" com conta) num botão `lime` de 40 px, no lugar do ícone. |

## Testes (Chrome headless pelo DevTools Protocol, no `npm run dev` da porta 3000)

```
H1: 375 px sem estouro
  ok 1 /: página 375px, cabeçalho 327/327px, último botão termina em 351px [aknewme. | Sequência: 3 dias  | Amigos | Menu]
  ok 2 /archive: página 375px, cabeçalho 327/327px, último botão termina em 351px [aknewme. | Amigos | Menu]
  ok 3 /friends: página 375px, cabeçalho 327/327px, último botão termina em 351px [aknewme. | Amigos | Menu]
  ok 4 /emoji: página 375px, cabeçalho 327/327px, último botão termina em 351px [aknewme. | Amigos | Menu]
H3: Menu
  ok 5 Enter no botão abre; aria-expanded=true; foco vai ao 1º item
  ok 6 setas ↓, End e a volta do fim para o começo andam pelos itens
  ok 7 Esc fecha e devolve o foco ao botão Menu
  ok 8 clique fora fecha
  ok 9 Como jogar: o menu fecha, a janela de sempre abre, e ao fechar o foco volta ao Menu
  ok 10 Estatísticas abre a janela de sempre a partir do Menu
  ok 11 links: Desafios anteriores, Apoiar o projeto, Seguir no X (nova aba), Termos, Privacidade
  ok 12 H2: ordem em 1280 px = aknewme. → Sequência → Meus duelos → Amigos → Menu
  ok 13 celular: "Duelos" dentro do Menu abre a janela de duelos (duels-title)
  ok 14 /archive: sem "Desafios anteriores" nem sequência/Duelos [Como jogar, Estatísticas, Apoiar o projeto, Seguir no X@aknewmee, Termos, Privacidade]
header-a11y: 14 verificações ok
```

Notas sobre o teste:
- No `/friends`, as respostas de `/api/me`, `/api/friends` e `/api/duels` foram simuladas no navegador de teste, porque sem sessão a página vai para o login. Por isso aparece "Amigos". Sem conta, o botão mostra "Entrar" (prints).
- A sequência de 3 dias e o resultado de hoje foram gravados só no `localStorage` do perfil de teste, marcado como interno (fora das métricas).

Verificações:
- `npx tsc --noEmit`: sem erros.
- `npm test`: `check-replay: 35 testes ok`.
- `npm run check:data`: `check-data: ok`.
- `npm run build`: `▲ Next.js 15.5.29`, `✓ Generating static pages (32/32)`. Rodado numa cópia temporária, já apagada, para não sobrescrever a `.next` do `npm run dev` do dono.
- Sem hex nos arquivos do cabeçalho. A única animação é a `animate-pop` do painel, que entra uma vez em 0,3 s e que a regra global de `prefers-reduced-motion` desliga.
- Maior arquivo mexido: `DuelsDialog.tsx`, com 298 linhas.

## Diferenças em relação à spec

- **Botão Menu no celular:** abaixo de 400 px de largura, mostra só o ícone (o nome fica no `aria-label`). Com o texto "Menu", o cabeçalho da home com a sequência passaria de 375 px por ~12 px.
- **Check da sequência:** aparece só quando o desafio de hoje foi jogado, junto com "hoje já foi". Sem jogo hoje, fica só o número e "jogue hoje".
- **Badge de Duelos:** mostra o número de duelos novos. Antes era uma bolinha que aparecia sempre; sem duelo novo, agora não há badge.
- **Sequência duplicada no celular:** a home tem, no corpo, uma pílula "N dias seguidos" que antes existia porque a sequência não cabia no cabeçalho do celular. Agora ela aparece duas vezes. Não mexi, porque está fora do cabeçalho.
