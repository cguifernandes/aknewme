// Paginação por páginas (Pagination.tsx): quais números mostrar. Puro, testado em scripts/check-pagination.mjs.

/**
 * Os números à mostra para `page` de `pages`, em até `max` posições (as reticências contam como posição): sempre a
 * primeira e a última; perto das pontas, os vizinhos; no meio, a atual com os vizinhos que couberem.
 */
export function pageSlots(page: number, pages: number, max: number): (number | "…")[] {
  if (pages <= max) return Array.from({ length: pages }, (_, i) => i + 1);
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  if (page <= max - 3) return [...range(1, max - 2), "…", pages];
  if (page >= pages - (max - 4)) return [1, "…", ...range(pages - (max - 3), pages)];
  const side = Math.floor((max - 5) / 2);
  return [1, "…", ...range(page - side, page + side), "…", pages];
}
