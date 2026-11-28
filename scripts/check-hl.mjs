// Mais ou Menos: ficha na carta, pergunta de favoritos, rodadas temáticas e "errou, perdeu"
// (specs/mais-ou-menos/01-ficha-favoritos-temas.md, M1 a M5). Uso: npm test
import assert from "node:assert/strict";
import { register } from "node:module";

register("./ts-alias-hooks.mjs", import.meta.url);
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const hl = await import("../src/lib/higherLower.ts");
const { ANIMES } = await import("../src/data/animes/index.ts");
const { ANILIST_UPDATED } = await import("../src/data/animes/anilist.ts");

let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log(`  ok ${name}`);
};
const a = (title, extra = {}) => ({ title, aliases: [], episodes: "12", year: 2014, studio: "Madhouse", genre: "Ação / Aventura / Comédia", synopsis: "", ...extra });
/** O banco do jogo: só animes com imagem (como o POOL de HigherLowerGame.tsx). */
const POOL = ANIMES.filter((x) => x.mal?.image);

ok("M1 ficha: gênero, estúdio, ano e episódios; o dado da rodada não aparece", () => {
  const x = a("X");
  assert.deepEqual(hl.cardFacts(x, "score").map((f) => f.key), ["genre", "studio", "year", "episodes"]);
  assert.deepEqual(hl.cardFacts(x, "score").map((f) => f.text), ["Ação · Aventura", "Madhouse", "2014", "12 eps."]);
  assert.ok(!hl.cardFacts(x, "episodes").some((f) => f.key === "episodes")); // rodada de episódios: sem os episódios
  assert.ok(!hl.cardFacts(x, "year").some((f) => f.key === "year")); // rodada de ano: sem o ano
  assert.equal(hl.cardFacts(a("Y", { episodes: "1100+" }), "year").at(-1).text, "1100+ eps.");
  // no banco de verdade, nenhuma ficha entrega o valor da rodada
  for (const x of POOL) {
    assert.ok(!hl.cardFacts(x, "year").some((f) => f.text.includes(String(x.year))), `${x.title}: ano na ficha`);
    assert.ok(hl.cardFacts(x, "members").length === 4, `${x.title}: ficha incompleta`);
  }
});

ok("M3 favoritos: fonte na pergunta, valor do AniList e formato abreviado", () => {
  assert.ok(hl.CATEGORY.favourites.question.includes("AniList"));
  assert.ok(hl.CATEGORY.favourites.unit.includes("AniList"));
  const [x, y] = [a("X", { favourites: 51234 }), a("Y", { favourites: 870 })];
  assert.equal(hl.valueOf(x, "favourites"), 51234);
  assert.equal(hl.formatValue(51234, "favourites"), "51 mil");
  assert.deepEqual([hl.isRight(x, y, "favourites", "less"), hl.isRight(x, y, "favourites", "more")], [true, false]);
  // textos do modo (seção 9): ano "Depois de" = mais recente = o palpite "more"
  const old = a("Velho", { year: 2000 });
  const novo = a("Novo", { year: 2019 });
  assert.deepEqual(hl.guessLabels("year", novo), { more: "Depois de 2019", less: "Antes de 2019" });
  assert.equal(hl.guessQuestion("year", novo, old), "Velho estreou antes ou depois de 2019?");
  assert.deepEqual([hl.isRight(novo, old, "year", "less"), hl.isRight(old, novo, "year", "more")], [true, true]); // 2000 é antes de 2019; 2019 é depois de 2000
  assert.equal(hl.guessQuestion("episodes", novo, old), "Velho tem mais ou menos episódios que Novo?");
  assert.deepEqual(hl.guessLabels("score", novo), { more: "Nota maior", less: "Nota menor" });
  assert.ok(Number.isNaN(hl.valueOf(a("Z"), "favourites")));
});

ok("M3 favoritos só liga com cobertura de 90%; sem o número, o anime fica fora só dessa pergunta", () => {
  const withFav = Array.from({ length: 9 }, (_, i) => a(`F${i}`, { favourites: 100 + i }));
  const without = a("Sem", {});
  assert.ok(hl.categoriesFor([...withFav, without]).includes("favourites")); // 90%
  assert.ok(!hl.categoriesFor([...withFav.slice(0, 8), without]).includes("favourites")); // 89%: desligada
  assert.deepEqual(hl.categoriesFor([without]), ["episodes", "year", "score", "members"]);
  for (let i = 0; i < 40; i++) assert.notEqual(hl.nextAnime([...withFav, without], withFav[0], "favourites", []).title, "Sem");
  // rodízio: depois de popularidade vem favoritos, se ligada; senão volta para episódios
  const m = a("M", { mal: { id: 1, score: 8, members: 10 }, favourites: 5 });
  assert.equal(hl.nextCategory("members", m, hl.CATEGORIES), "favourites");
  assert.equal(hl.nextCategory("members", m, ["episodes", "year", "score", "members"]), "episodes");
  assert.equal(hl.nextCategory("favourites", m, hl.CATEGORIES), "episodes");
});

ok(`M3 no banco de verdade: favoritos em ${POOL.filter((x) => x.favourites).length} de ${POOL.length} animes, coletados em ${ANILIST_UPDATED}`, () => {
  assert.ok(hl.coverage(POOL, "favourites") >= hl.FAVOURITES_MIN_COVERAGE);
  assert.ok(hl.categoriesFor(POOL).includes("favourites"));
  assert.match(ANILIST_UPDATED, /^\d{4}-\d{2}-\d{2}$/);
});

ok("M4 temas: Todos, Anos 2010 e Ação, cada um com pelo menos 25 animes com imagem", () => {
  assert.deepEqual(hl.THEMES.map((t) => t.label), ["Todos os animes", "Anos 2010", "Ação"]);
  const sizes = Object.fromEntries(hl.THEMES.map((t) => [t.label, hl.themePool(POOL, t.id).length]));
  console.log(`     ${JSON.stringify(sizes)}`);
  for (const t of hl.THEMES) assert.ok(hl.themePool(POOL, t.id).length >= hl.THEME_MIN, `${t.label} tem menos de ${hl.THEME_MIN}`);
  assert.ok(hl.themePool(POOL, "2010s").every((x) => x.year >= 2010 && x.year <= 2019));
  assert.ok(hl.themePool(POOL, "action").every((x) => x.genre.includes("Ação")));
  assert.equal(hl.themeOf("não existe").id, "all");
  // em cada tema, toda categoria ligada tem rodada possível para qualquer anime da esquerda
  for (const t of hl.THEMES) {
    const pool = hl.themePool(POOL, t.id);
    for (const cat of hl.categoriesFor(pool)) for (const left of pool) if (!Number.isNaN(hl.valueOf(left, cat))) assert.ok(hl.nextAnime(pool, left, cat, []), `${t.label}/${cat}/${left.title}`);
  }
});

ok("M4 recorde separado por tema (o de Todos não se mistura)", () => {
  hl.saveHL({ best: 12, recent: [true] });
  hl.saveHL({ best: 3, recent: [false] }, "2010s");
  assert.deepEqual([hl.loadHL().best, hl.loadHL("all").best, hl.loadHL("2010s").best, hl.loadHL("action").best], [12, 12, 3, 0]);
  assert.equal(store.has("aknewme.hl"), true); // "Todos" continua na chave antiga: quem já jogava mantém o recorde
  hl.saveTheme("action");
  assert.equal(hl.loadTheme(), "action");
  store.set("aknewme.hl.theme", "lixo");
  assert.equal(hl.loadTheme(), "all");
});

ok("M5 errou, perdeu: empate nunca é sorteado e palpite errado é errado nas 5 categorias", () => {
  const [x, y] = [a("X", { episodes: "24", year: 2010, favourites: 10, mal: { id: 1, score: 7, members: 100 } }), a("Y", { episodes: "12", year: 2000, favourites: 5, mal: { id: 2, score: 6, members: 50 } })];
  for (const cat of hl.CATEGORIES) assert.deepEqual([hl.isRight(x, y, cat, "more"), hl.isRight(x, y, cat, "less")], [false, true], cat);
});

console.log(`check-hl: ${n} testes ok`);
