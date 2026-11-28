// Testes do recálculo do placar no servidor (specs/login-duelo, T10 e CA5). Uso: npm test
// Usa o catálogo de verdade e o sorteio de dias reais: as respostas vêm de dailyAnimes, como no servidor.
import assert from "node:assert/strict";
import { register } from "node:module";

register("./ts-alias-hooks.mjs", import.meta.url);
const { parseMoves, replay, sameResult, MAX_MOVES } = await import("../src/lib/replay.ts");
const { dailyAnimes, isCorrectGuess, rescueChoices, OPENING_ANIMES } = await import("../src/lib/game.ts");
const { ANIMES } = await import("../src/data/animes/index.ts");
const { RESCUE_SCORE } = await import("../src/lib/stats.ts");

const guess = (g) => ({ t: "guess", g });
/** Um anime do catálogo que não é nenhum dos `not` (palpite errado, mas válido). */
const other = (...not) => ANIMES.find((a) => !not.some((n) => isCorrectGuess(a.title, n))).title;
const check = (mode, day, moves) => replay(mode, day, parseMoves(mode, moves));
let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log(`  ok ${name}`);
};

for (const day of [150, 200, 214]) {
  console.log(`dia ${day}`);
  const rounds = dailyAnimes("emoji", day);
  const op = dailyAnimes("opening", day)[0];
  const cl = dailyAnimes("pistas", day)[0];

  // --- Emoji
  ok("emoji: tudo certo de primeira = 5 pontos, 5 verdes", () => {
    assert.deepEqual(check("emoji", day, rounds.map((a) => guess(a.title))), { won: true, score: 5, tiles: Array(5).fill("🟩") });
  });
  ok("emoji: tudo errado (3 erros por rodada) = 0 pontos, perdeu", () => {
    const moves = rounds.flatMap((a) => [1, 2, 3].map(() => guess(other(a))));
    assert.deepEqual(check("emoji", day, moves), { won: false, score: 0, tiles: Array(5).fill("🟥") });
  });
  ok("emoji: dica usada (primeira letra) não muda o placar; erro antes do acerto = amarelo; pulo = preto", () => {
    const moves = [{ t: "letter" }, guess(rounds[0].title), guess(other(rounds[1])), guess(rounds[1].title), { t: "skip" }, { t: "skip" }, { t: "letter" }, guess(rounds[4].title)];
    assert.deepEqual(check("emoji", day, moves), { won: true, score: 3, tiles: ["🟩", "🟨", "⬛", "⬛", "🟩"] });
  });
  ok("emoji: partida incompleta ou jogada depois do fim = inválida", () => {
    assert.equal(check("emoji", day, [guess(rounds[0].title)]), null);
    assert.equal(check("emoji", day, [...rounds.map((a) => guess(a.title)), { t: "skip" }]), null);
  });

  // --- Opening
  ok("opening: acerto de primeira = 1, verde", () => {
    assert.deepEqual(check("opening", day, [guess(op.title)]), { won: true, score: 1, tiles: ["🟩", "⬜", "⬜", "⬜", "⬜", "⬜"] });
  });
  ok("opening: 6 erros/pulos = perdeu", () => {
    const moves = [guess(other(op)), { t: "skip" }, guess(other(op)), { t: "skip" }, { t: "skip" }, guess(other(op))];
    assert.deepEqual(check("opening", day, moves), { won: false, score: null, tiles: ["🟥", "⬛", "🟥", "⬛", "⬛", "🟥"] });
  });
  ok("opening: dica usada (resgate) só depois de 4 tentativas e vale RESCUE_SCORE", () => {
    const four = [1, 2, 3, 4].map(() => ({ t: "skip" }));
    assert.equal(check("opening", day, [{ t: "rescue" }, guess(op.title)]), null);
    assert.deepEqual(check("opening", day, [...four, { t: "rescue" }, { t: "choose", g: op.title }]), {
      won: true,
      score: RESCUE_SCORE,
      tiles: ["⬛", "⬛", "⬛", "⬛", "🟨", "⬜"],
    });
    // voltou do resgate ao palpite e acertou: continua "com resgate"
    assert.equal(check("opening", day, [...four, { t: "rescue" }, guess(op.title)]).score, RESCUE_SCORE);
    const wrong = rescueChoices(op, day).find((a) => a !== op);
    assert.deepEqual(check("opening", day, [...four, { t: "rescue" }, { t: "choose", g: wrong.title }]).won, false);
    // alternativa que não estava entre as 4 = inválida
    const outside = OPENING_ANIMES.find((a) => !rescueChoices(op, day).includes(a));
    assert.equal(check("opening", day, [...four, { t: "rescue" }, { t: "choose", g: outside.title }]), null);
  });

  // --- Pistas
  ok("pistas: acerto com 1 pista = 5 pontos", () => {
    assert.deepEqual(check("pistas", day, [guess(cl.title)]), { won: true, score: 5, tiles: ["🟩", "⬜", "⬜", "⬜", "⬜"] });
  });
  ok("pistas: dica usada (revelar) e erro abrem pista; acerto na 3ª = 3 pontos", () => {
    assert.deepEqual(check("pistas", day, [{ t: "reveal" }, guess(other(cl)), guess(cl.title)]), { won: true, score: 3, tiles: ["🟪", "🟪", "🟩", "⬜", "⬜"] });
  });
  ok("pistas: tudo errado = perdeu com as 5 pistas abertas", () => {
    const moves = [1, 2, 3, 4, 5].map(() => guess(other(cl)));
    assert.deepEqual(check("pistas", day, moves), { won: false, score: null, tiles: ["🟪", "🟪", "🟪", "🟪", "🟥"] });
  });
}

console.log("validação das jogadas");
ok("palpite fora da lista do catálogo = recusado", () => {
  assert.equal(parseMoves("emoji", [guess("um anime que não existe")]), null);
});
ok("palpite com mais de 80 caracteres = recusado", () => {
  assert.equal(parseMoves("pistas", [guess("a".repeat(81))]), null);
});
ok("jogada de outro modo, sem tipo ou lista vazia/grande demais = recusada", () => {
  assert.equal(parseMoves("pistas", [{ t: "skip" }]), null);
  assert.equal(parseMoves("emoji", [{ x: 1 }]), null);
  assert.equal(parseMoves("emoji", []), null);
  assert.equal(parseMoves("emoji", Array(MAX_MOVES + 1).fill({ t: "letter" })), null);
  assert.equal(parseMoves("emoji", "guess"), null);
});
ok("apelido e caixa/acentos diferentes valem (mesma regra do isCorrectGuess)", () => {
  const a = dailyAnimes("pistas", 200)[0];
  const alias = a.aliases[0] ?? a.title;
  assert.equal(check("pistas", 200, [guess(alias.toUpperCase())]).won, true);
});
ok("resultado forjado não bate com o recálculo (CA5)", () => {
  const real = check("pistas", 200, [{ t: "reveal" }, { t: "reveal" }, guess(dailyAnimes("pistas", 200)[0].title)]);
  assert.equal(sameResult(real, { won: true, score: 3 }), true);
  assert.equal(sameResult(real, { won: true, score: 5 }), false);
  assert.equal(sameResult(real, { won: false, score: null }), false);
});

console.log(`check-replay: ${n} testes ok`);
