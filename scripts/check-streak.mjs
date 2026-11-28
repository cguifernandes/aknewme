// Tests for the played-days list behind the "Your streak" panel (specs/cabecalho/02-sequencia.md). Run with: npm test
import assert from "node:assert/strict";
import { register } from "node:module";

process.env.TZ = "America/Sao_Paulo"; // o fuso de quem joga (a sequência conta pelo dia local)

register("./ts-alias-hooks.mjs", import.meta.url);
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const s = await import("../src/lib/streak.ts");

assert.equal(s.longestRun([1, 2, 3, 5, 6]), 3);
// Migration: history days plus the current 4-day streak ending on day 200; nothing is lost and no day repeats
const first = s.loadPlayed({ historyDays: [150, 151, 199], streak: 4, streakLastDay: 200 });
assert.deepEqual(first.days, [150, 151, 197, 198, 199, 200]);
assert.equal(first.best, 4);
// A new played day keeps the old ones and raises the best streak
s.markPlayed(201, 5);
const after = s.loadPlayed({ historyDays: [], streak: 5, streakLastDay: 201 });
assert.deepEqual(after.days, [150, 151, 197, 198, 199, 200, 201]);
assert.equal(after.best, 5);
// Week is Monday to Sunday: challenge #201 is Thursday, Nov 26, 2026
assert.deepEqual(s.weekDays(201, Date.UTC(2026, 4, 10)), [198, 199, 200, 201, 202, 203, 204]);
// Countdown to midnight in Brasília: 11 PM BRT on Nov 26 = 2 AM UTC on Nov 27, so 1 hour left
assert.equal(s.msToBrasiliaMidnight(Date.UTC(2026, 10, 27, 2, 0, 0)), 3_600_000);

// Selo da sequência sumindo depois das 21:00 (09-menu-perfil.md, terceira rodada): às 21:30 de Brasília de 26/11 já é
// 27/11 em UTC. Quem jogou em 25/11 ainda tem a sequência até a meia-noite local; com a data em UTC ela zerava.
const night = new Date("2026-11-27T00:30:00Z"); // 26/11, 21:30 em Brasília
assert.equal(s.localDate(night), "2026-11-26");
assert.equal(s.localDate(night, -1), "2026-11-25");
assert.equal(s.streakAlive("2026-11-25", night), true); // jogou ontem (dia local): vale
assert.equal(s.streakAlive("2026-11-27", night), true); // gravado em UTC pelo código antigo, um dia à frente: vale
assert.equal(s.streakAlive("2026-11-24", night), false); // perdeu um dia: zera
assert.equal(night.toISOString().slice(0, 10), "2026-11-27"); // em UTC já é 27/11: o "ontem" antigo era 26/11, e 25/11 zerava

// E-mail da conta (09-menu-perfil.md, terceira rodada): limpo ao gravar, só mascarado na tela
const { cleanEmail, maskEmail } = await import("../src/lib/email.ts");
assert.equal(cleanEmail("  Gui.Teste@Gmail.com "), "gui.teste@gmail.com");
assert.equal(cleanEmail("sem-arroba"), null);
assert.equal(cleanEmail(undefined), null);
assert.equal(maskEmail("guilherme@gmail.com"), "g••••@gmail.com");
assert.equal(maskEmail("a@b.co"), "a••••@b.co");
assert.equal(maskEmail(null), null);
console.log("check-streak: ok");
