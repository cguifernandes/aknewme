// Verificação da lógica de estatísticas (sequência, % e distribuição).
// Uso: npm run check
import assert from "node:assert/strict";
import { computeStats, rank, standing } from "../src/lib/stats.ts";
import { levelOf, poolFor } from "../src/lib/difficulty.ts";
import { formatValue, isRight, medalFor, nextAnime, nextCategory, valueOf } from "../src/lib/higherLower.ts";

const e = (day, won, score) => ({ day, won, score });

// sequência: 3 vitórias seguidas até hoje; recorde conta a maior sequência
let s = computeStats("opening", [e(1, true, 2), e(2, true, 1), e(4, true, 3), e(5, true, 1), e(6, true, 6)], 6);
assert.equal(s.current, 3);
assert.equal(s.max, 3);
assert.equal(s.winPct, 100);

// derrota zera a sequência; buraco de dias recomeça em 1
s = computeStats("opening", [e(1, true, 1), e(2, false, null), e(3, true, 2)], 3);
assert.deepEqual([s.current, s.max, s.winPct], [1, 1, 67]);

// não jogou hoje ainda: a sequência de ontem continua valendo; anteontem não
assert.equal(computeStats("pistas", [e(9, true, 5)], 10).current, 1);
assert.equal(computeStats("pistas", [e(8, true, 5)], 10).current, 0);

// ordem do histórico não importa
assert.equal(computeStats("pistas", [e(3, true, 5), e(1, true, 4), e(2, true, 3)], 3).current, 3);

// distribuição: derrotas (score null) caem no "✗"
s = computeStats("pistas", [e(1, true, 5), e(2, false, null), e(3, true, 5)], 3);
assert.equal(s.dist.find((b) => b.label === "5").count, 2);
assert.equal(s.dist.find((b) => b.label === "✗").count, 1);

// vitórias e pontos: Opening pontua pela tentativa (1ª = 6), derrota = 0
s = computeStats("opening", [e(1, true, 1), e(2, false, null), e(3, true, 6)], 3);
assert.deepEqual([s.wins, s.points], [2, 7]);
assert.equal(computeStats("emoji", [e(1, true, 4), e(2, false, 2)], 2).points, 6); // no Emoji os pontos da derrota contam

// histórico vazio
assert.deepEqual(computeStats("emoji", [], 1), { ...computeStats("emoji", [], 1), played: 0, winPct: 0, current: 0, max: 0 });

// posição entre os jogadores do dia: Opening inverte (1ª tentativa = melhor nota), derrota = 0
assert.deepEqual([rank("opening", 1), rank("opening", 6), rank("opening", null), rank("emoji", 3)], [6, 1, 0, 3]);
const counts = { "emoji:r0": "2", "emoji:r3": "5", "emoji:r5": "3", "opening:r6": "50" };
assert.deepEqual(standing("emoji", counts, 5), { total: 10, better: 70, winPct: 80 });
assert.deepEqual(standing("emoji", counts, 0), { total: 10, better: 0, winPct: 80 });
assert.equal(standing("emoji", counts, 5, 11), null); // pouca gente
assert.equal(standing("pistas", counts, 5), null); // outro modo não entra na conta

// Mais ou Menos: comparação, sorteio sem empate e medalhas
const a = (title, episodes, year) => ({ title, episodes, year });
const [hxh, nar, op, same] = [a("HxH", "148", 2011), a("Naruto", "220", 2002), a("OP", "1100+", 1999), a("Igual", "148", 2011)];
assert.equal(valueOf(op, "episodes"), 1100); // "1100+" (em exibição) vale 1100
assert.deepEqual([isRight(hxh, nar, "episodes", "more"), isRight(hxh, nar, "episodes", "less")], [true, false]);
assert.deepEqual([isRight(hxh, nar, "year", "more"), isRight(hxh, nar, "year", "less")], [false, true]);
for (let i = 0; i < 30; i++) assert.equal(nextAnime([hxh, same, nar], hxh, "episodes", []).title, "Naruto"); // nunca empata nem repete o atual
assert.equal(nextAnime([hxh, nar, op], hxh, "year", ["Naruto"]).title, "OP"); // evita os vistos há pouco
assert.equal(nextAnime([hxh, nar], hxh, "year", ["Naruto"]).title, "Naruto"); // ...a não ser que só sobrem eles
// nota e popularidade (MyAnimeList): formato da carta, empate pelo valor mostrado e anime sem dado fora do sorteio
const m = (title, score, members) => ({ ...a(title, "12", 2000), mal: { id: 1, score, members } });
const [fma, sao, tog, sem] = [m("FMA", 9.11, 3754246), m("SAO", 7.23, 3346536), m("Toradora", 8.03, 3751000), a("Sem MAL", "12", 2000)];
assert.deepEqual([formatValue(9.1, "score"), formatValue(3754246, "members"), formatValue(874007, "members")], ["9,10", "3,8\u00a0mi", "870\u00a0mil"]);
assert.deepEqual([isRight(fma, sao, "score", "less"), isRight(sao, fma, "members", "more")], [true, true]);
for (let i = 0; i < 30; i++) assert.equal(nextAnime([fma, sao, tog, sem], fma, "members", []).title, "SAO"); // "3,8 mi" × "3,8 mi" seria empate na tela
assert.deepEqual([nextCategory("episodes", fma), nextCategory("year", fma), nextCategory("members", fma)], ["year", "score", "episodes"]);
assert.equal(nextCategory("year", sem), "episodes"); // sem dados do MAL: pula nota e popularidade

assert.deepEqual([medalFor(4), medalFor(5).name, medalFor(24).name, medalFor(80).name], [undefined, "Bronze", "Prata", "Lendário"]);

// dificuldade do dia: segunda fácil, sábado difícil; fatias por popularidade (sem dados do MAL = menos conhecido)
assert.deepEqual([0, 1, 2, 6].map(levelOf), ["normal", "easy", "normal", "hard"]);
const bank = [5, 80, 30, undefined, 60, 10, 90, 20].map((members, i) => ({ id: i, mal: members && { members } }));
const ids = (level) => poolFor(level, bank).map((a) => a.mal?.members ?? 0);
assert.deepEqual([ids("easy"), ids("normal"), ids("hard")], [[90, 80], [90, 80, 60, 30], [20, 10, 5, 0]]);

console.log("check-stats: ok");
