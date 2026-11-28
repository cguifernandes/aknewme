// Chamadas em paralelo que não podem passar duas vezes (specs/login-duelo/03-seguranca.md, falhas do QA de 28/11).
// Usa o banco do npm run dev (.env.development.local, o branch de teste); sem ele, avisa e pula. Cria contas de
// teste e apaga no fim. Uso: npm test
// 1. Troca de @ "uma vez para sempre": 3 trocas ao mesmo tempo → só 1 passa.
// 2. Escolha livre (@ provisório) + trocas ao mesmo tempo: no máximo a escolha e 1 troca.
// 3. Desafiante do duelo: duas contas gravando como "challenger" no mesmo id ao mesmo tempo → só 1.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createRequire, register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const req = createRequire(`${root}/package.json`);
(await import(pathToFileURL(req.resolve("@next/env")).href)).default.loadEnvConfig(root, true, { info() {}, error() {} });
if (!process.env.DATABASE_URL) {
  console.log("check-races: pulado (sem o banco do dev)");
  process.exit(0);
}
register("./ts-alias-hooks.mjs", import.meta.url);
const { rows } = await import("../src/lib/db.ts");
const { setHandle } = await import("../src/lib/handleChange.ts");
const { saveLinkDuel } = await import("../src/lib/linkDuels.ts");

const tag = randomBytes(3).toString("hex");
const ids = [];
async function user(handle, auto) {
  const [{ id }] = await rows("INSERT INTO users (name, handle, handle_auto) VALUES ($1, $2, $3) RETURNING id", [`Corrida ${tag}`, handle, auto]);
  ids.push(id);
  return id;
}
let n = 0;
const ok = async (name, fn) => {
  await fn();
  n++;
  console.log(`  ok ${name}`);
};

try {
  await ok("3 trocas de @ ao mesmo tempo: só 1 passa e a conta fica com 1 troca usada", async () => {
    const id = await user(`rc_${tag}_a`, false);
    const out = await Promise.all([1, 2, 3].map((i) => setHandle(id, `rc_${tag}_a`, `rc_${tag}_a${i}`)));
    const [u] = await rows("SELECT handle_changes_used AS used, (SELECT count(*)::int FROM handle_changes WHERE user_id = $1) AS logged FROM users WHERE id = $1", [id]);
    assert.equal(out.filter((o) => o.ok).length, 1, JSON.stringify(out));
    assert.equal(u.used, 1);
    assert.equal(u.logged, 1);
  });
  await ok("@ provisório + 3 mudanças ao mesmo tempo: no máximo a escolha livre e 1 troca", async () => {
    const id = await user(`rc_${tag}_b`, true);
    const out = await Promise.all([1, 2, 3].map((i) => setHandle(id, `rc_${tag}_b`, `rc_${tag}_b${i}`)));
    const [u] = await rows("SELECT handle_changes_used AS used FROM users WHERE id = $1", [id]);
    assert.ok(out.filter((o) => o.ok).length <= 2, JSON.stringify(out));
    assert.ok(u.used <= 1, `trocas usadas: ${u.used}`);
  });
  await ok("duas contas gravando como desafiante no mesmo duelo ao mesmo tempo: só 1", async () => {
    const [a, b] = [await user(`rc_${tag}_c`, false), await user(`rc_${tag}_d`, false)];
    const duelId = `r${tag}zzz`.slice(0, 10);
    const game = { duelId, role: "challenger", mode: "pistas", day: 1, player: null, nick: "Corrida", moves: [], result: { won: true, score: 5, tiles: ["🟩"] } };
    const out = await Promise.all([saveLinkDuel(a, game), saveLinkDuel(b, game)]);
    const list = await rows("SELECT user_id FROM link_duels WHERE duel_id = $1 AND role = 'challenger'", [duelId]);
    assert.equal(list.length, 1);
    assert.deepEqual([...out].sort(), ["saved", "taken"]);
    // depois: quem gravou vê "exists"; a outra conta continua recusada ("taken")
    const winner = list[0].user_id;
    const loser = winner === a ? b : a;
    assert.equal(await saveLinkDuel(winner, game), "exists");
    assert.equal(await saveLinkDuel(loser, game), "taken");
  });
} finally {
  if (ids.length) {
    await rows("DELETE FROM handle_reservations WHERE user_id = ANY($1::uuid[])", [ids]);
    await rows("DELETE FROM users WHERE id = ANY($1::uuid[])", [ids]);
  }
}
console.log(`check-races: ${n} testes ok`);
