// Um estilo só para os botões do cabeçalho (specs/cabecalho/02-sequencia.md, seções 4 e 5): mesma altura (40 px), forma
// de pílula, tipografia e animação de hover do projeto (sweep-*), no roxo base dos botões (grape, o mesmo do selo da sequência;
// specs/visual/01-roxos-e-mais-ou-menos.md). O "Entrar" deixou de
// ser botão do cabeçalho: é o primeiro item do Menu, com destaque (seção 5).

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const BASE = `flex h-10 shrink-0 items-center justify-center gap-2 rounded-full text-sm font-bold whitespace-nowrap active:translate-y-0.5 ${FOCUS}`;

/** Duelos: pílula escura com texto. */
export const HEADER_BTN = `${BASE} px-4 bg-grape text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink`;
/** Menu: o mesmo botão escuro, só com o ícone (círculo de 40 px). */
export const HEADER_ICON_BTN = `${BASE} size-10 bg-grape text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink`;
