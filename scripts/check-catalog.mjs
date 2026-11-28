// Congelamento do catálogo (specs/catalogo/01-novos-animes.md, "Problema técnico"). Uso: npm test
// Dias que já começaram nunca mudam de anime: com 10 animes falsos a mais no banco (no meio das épocas, como entra
// um anime de verdade), membros do MAL atualizados e uma abertura nova, todo dia de 1 até CATALOG_V2_FROM − 1 tem
// que dar o mesmo sorteio (3 modos, música do Opening, resgate) e os mesmos posts do bot. Do corte em diante os
// novos entram, e o bot não repete anime em 30 dias.
import assert from "node:assert/strict";
import { register } from "node:module";

register("./ts-alias-hooks.mjs", import.meta.url);
const { ANIMES } = await import("../src/data/animes/index.ts");
const { CATALOGO_V1 } = await import("../src/data/animes/catalogo-v1.ts");
const { buildCatalogs, CATALOG_V2_FROM } = await import("../src/lib/catalog.ts");
const { dailyAnimes, pickOpening, rescueChoices } = await import("../src/lib/game.ts");
const { dailyPosts, dailyPicks } = await import("../src/lib/xposts.ts");

let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log(`  ok ${name}`);
};

// Banco de teste: o de verdade com 10 falsos espalhados e mudanças que acontecem nos animes antigos
const FAKES = Array.from({ length: 10 }, (_, i) => ({
  ...ANIMES[i],
  title: `Anime Falso ${i + 1}`,
  aliases: [`falso ${i + 1}`],
  openings: [{ name: `Abertura Falsa ${i + 1}`, artist: "Ninguém", audioSrc: `/audio/falso-${i + 1}.mp3` }],
  mal: { id: 900000 + i, score: 8, members: i % 2 ? 9_000_000 : 1_000, image: "/falso.jpg" }, // no topo e no fim do ranking
}));
const changed = ANIMES.map((a, i) =>
  i % 7 === 0
    ? { ...a, mal: a.mal && { ...a.mal, members: a.mal.members * 3 }, openings: [...a.openings, { name: "Abertura Nova", artist: "X", audioSrc: "/audio/nova.mp3" }] }
    : a,
);
const bank = [...changed];
FAKES.forEach((f, i) => bank.splice(3 + i * 11, 0, f));
const real = buildCatalogs(ANIMES);
const test = buildCatalogs(bank);
const MODES = ["emoji", "opening", "pistas"];
const titles = (list) => list.map((a) => a.title);

/** Tudo o que um dia mostra, por título: os 3 modos, a música e o resgate do Opening. */
function draw(day, cats) {
  const op = dailyAnimes("opening", day, cats)[0];
  return {
    ...Object.fromEntries(MODES.map((m) => [m, titles(dailyAnimes(m, day, cats))])),
    song: pickOpening(op, day, cats).name,
    rescue: titles(rescueChoices(op, day, cats)),
  };
}

ok("catálogo congelado tem os 106 animes, sem repetir", () => {
  assert.equal(CATALOGO_V1.length, 106);
  assert.equal(new Set(CATALOGO_V1.map(([t]) => t)).size, 106);
  assert.equal(real.v1.animes.length, 106);
});

ok(`dias 1 a ${CATALOG_V2_FROM - 1}: mesmo sorteio nos 3 modos com 10 animes a mais`, () => {
  for (let d = 1; d < CATALOG_V2_FROM; d++) assert.deepEqual(draw(d, test), draw(d, real), `desafio #${d} mudou`);
});

ok(`dias 1 a ${CATALOG_V2_FROM - 1}: mesmos posts do bot com 10 animes a mais`, () => {
  for (let d = 1; d < CATALOG_V2_FROM; d++) assert.deepEqual(dailyPosts(d, test), dailyPosts(d, real), `posts do dia ${d} mudaram`);
});

ok("do corte em diante, os animes novos entram no sorteio", () => {
  const fake = new Set(titles(FAKES));
  const seen = new Set();
  for (let d = CATALOG_V2_FROM; d < CATALOG_V2_FROM + 365; d++) for (const m of MODES) for (const t of titles(dailyAnimes(m, d, test))) if (fake.has(t)) seen.add(t);
  assert.equal(seen.size, FAKES.length, "algum anime novo nunca foi sorteado em 1 ano");
});

ok("bot: todos os novos saem logo depois do corte e nenhum anime se repete em 30 dias", () => {
  const last = new Map();
  const first = new Map();
  // todos os que não estão no catálogo congelado: os 10 falsos e os animes novos de verdade
  const fake = new Set(titles(test.v2.animes).filter((t) => !CATALOGO_V1.some(([v1]) => v1 === t)));
  // metade entra na fila da manhã e metade na da tarde, um por dia (mais uns dias de folga para os que esperam spoiler)
  const limit = CATALOG_V2_FROM + Math.ceil(fake.size / 2) + 5;
  // 188: 1º dia dos posts (START em src/lib/xposts.ts); antes dele o bot não postava
  for (let d = Math.max(188, CATALOG_V2_FROM - 30); d < CATALOG_V2_FROM + 150; d++) {
    for (const t of dailyPicks(d, test)) {
      if (last.has(t)) assert.ok(d - last.get(t) >= 30, `${t} saiu nos dias ${last.get(t)} e ${d}`);
      if (!first.has(t)) first.set(t, d);
      last.set(t, d);
      if (d < CATALOG_V2_FROM) assert.ok(!fake.has(t), `${t} saiu antes do corte`);
    }
  }
  for (const t of fake) assert.ok(first.get(t) < limit, `${t} demorou para sair`);
});

console.log(`check-catalog: ${n} testes ok`);
