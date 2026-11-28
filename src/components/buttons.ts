// Variantes de botão reutilizáveis do projeto (as do cabeçalho ficam em header/buttons.ts).

/**
 * Botão lime que escurece no hover/foco: o lime-deep entra da esquerda para a direita (sweep-lime-deep, o mesmo sweep dos
 * outros botões do projeto) e o texto continua ink (15:1 no lime e 10:1 no lime-deep). Com movimento reduzido, a cor
 * troca sem animar (a regra global de prefers-reduced-motion em globals.css). Usado no "Mais" do Mais ou Menos e no
 * "Jogue agora" dos cartões de desafio. Junte com o formato do botão (altura, raio, padding) de quem usa.
 */
export const LIME_DARKEN = "bg-lime text-ink sweep-lime-deep";

/**
 * Botão roxo primário do projeto: grape com texto branco; no hover/foco o lime entra da esquerda para a direita e o texto
 * fica ink (o mesmo dos outros botões grape). Usado nos botões de desafiar dos cartões de modo jogado.
 */
export const GRAPE_PRIMARY = "bg-grape text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink";
