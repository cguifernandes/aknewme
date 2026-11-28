// Testes de pageSlots (src/lib/pagination.ts), os números da paginação de /friends. Run with: npm test
import assert from "node:assert/strict";
import { register } from "node:module";

register("./ts-alias-hooks.mjs", import.meta.url);
const { pageSlots } = await import("../src/lib/pagination.ts");
const s = (p, n, m) => pageSlots(p, n, m).join(" ");

// poucas páginas: todas
assert.equal(s(1, 1, 5), "1");
assert.equal(s(2, 3, 5), "1 2 3");
assert.equal(s(4, 7, 7), "1 2 3 4 5 6 7");
// computador (7 posições): perto do começo, no meio, perto do fim
assert.equal(s(1, 10, 7), "1 2 3 4 5 … 10");
assert.equal(s(4, 10, 7), "1 2 3 4 5 … 10");
assert.equal(s(5, 10, 7), "1 … 4 5 6 … 10");
assert.equal(s(7, 10, 7), "1 … 6 7 8 9 10");
assert.equal(s(10, 10, 7), "1 … 6 7 8 9 10");
// celular (5 posições)
assert.equal(s(1, 10, 5), "1 2 3 … 10");
assert.equal(s(5, 10, 5), "1 … 5 … 10");
assert.equal(s(9, 10, 5), "1 … 8 9 10");
// nunca passa do máximo, sempre tem a atual, a primeira e a última, sem número repetido
for (const max of [5, 7]) for (let n = 1; n <= 30; n++) for (let p = 1; p <= n; p++) {
  const out = pageSlots(p, n, max);
  const nums = out.filter((x) => x !== "…");
  assert.ok(out.length <= max, `${p}/${n} cabe em ${max}`);
  assert.ok(nums.includes(p) && nums[0] === 1 && nums.at(-1) === n, `${p}/${n} tem a atual e as pontas`);
  assert.equal(new Set(nums).size, nums.length);
  assert.deepEqual([...nums].sort((a, b) => a - b), nums);
}
console.log("check-pagination: ok");
