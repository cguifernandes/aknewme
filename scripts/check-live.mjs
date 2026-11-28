// O que já está no ar não pode mudar (specs/catalogo/01-novos-animes.md). Uso: npm test
// 1. Compara, para todo dia de 1 até CATALOG_V2_FROM − 1 (e até hoje, se hoje já passou do corte), o sorteio do código local com o do código no ar (o HEAD do
//    git): os 3 modos, a música do Opening e os posts do bot do X (horário, tipo, resposta, animes e imagem; a redação
//    dos textos pode mudar de propósito). Pega um corte (CATALOG_V2_FROM) num dia que já
//    começou no ar, como o #203 em 28/11. Sem git (ou fora do repositório), avisa e pula.
// 2. dailyNumber() no servidor conta a meia-noite de Brasília qualquer que seja o fuso da máquina (Vercel em UTC, o
//    dev do dono em Brasília): às 00:11 de 28/11 em Brasília é o #203.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

process.env.TZ = "America/Sao_Paulo"; // como o dev do dono (o teste do dailyNumber precisa de um fuso que não seja UTC)
register("./ts-alias-hooks.mjs", import.meta.url);
const root = fileURLToPath(new URL("..", import.meta.url));
const { CATALOG_V2_FROM } = await import("../src/lib/catalog.ts");
const game = await import("../src/lib/game.ts");
const { dailyPosts } = await import("../src/lib/xposts.ts");

let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log(`  ok ${name}`);
};

// ---- 2. dailyNumber no fuso de Brasília ----
ok("dailyNumber (servidor) às 00:11 de 28/11 em Brasília = #203, com a máquina em Brasília", () => {
  const real = Date.now;
  try {
    Date.now = () => Date.UTC(2026, 10, 28, 3, 11); // 00:11 de Brasília
    assert.equal(game.dailyNumber(), 203);
    Date.now = () => Date.UTC(2026, 10, 28, 2, 59); // 23:59 de 27/11 em Brasília
    assert.equal(game.dailyNumber(), 202);
  } finally {
    Date.now = real;
  }
});

// ---- 1. dias antes do corte iguais ao código no ar ----
const MODES = ["emoji", "opening", "pistas"];
const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
let head = null;
try {
  head = git(["rev-parse", "--short", "HEAD"]);
} catch {}
if (!head) {
  console.log("  (pulado: sem git, não dá para comparar com o código no ar)");
} else {
  const dir = join(tmpdir(), `aknewme-head-${head}`);
  if (!existsSync(join(dir, "src", "lib", "game.ts"))) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(join(dir, "scripts"), { recursive: true });
    // os arquivos de src/ como estão no HEAD, lidos do git de uma vez (sem tar: no Windows o tar do PATH varia)
    const files = git(["ls-tree", "-r", "--name-only", "HEAD", "src"]).split("\n").filter(Boolean);
    const batch = execFileSync("git", ["cat-file", "--batch"], { cwd: root, input: files.map((f) => `HEAD:${f}`).join("\n") + "\n", maxBuffer: 256 * 1024 * 1024 });
    let at = 0;
    for (const f of files) {
      const nl = batch.indexOf(10, at);
      const size = Number(batch.subarray(at, nl).toString().split(" ")[2]);
      const body = batch.subarray(nl + 1, nl + 1 + size);
      at = nl + 1 + size + 1;
      mkdirSync(dirname(join(dir, f)), { recursive: true });
      writeFileSync(join(dir, f), body);
    }
  }
  copyFileSync(join(root, "scripts", "ts-alias-hooks.mjs"), join(dir, "scripts", "ts-alias-hooks.mjs"));
  const job = join(dir, "scripts", "draw.mjs");
  writeFileSync(
    job,
    `import { register } from "node:module";
register("./ts-alias-hooks.mjs", import.meta.url);
const game = await import("../src/lib/game.ts");
const { dailyPosts } = await import("../src/lib/xposts.ts");
const last = Number(process.argv[2]);
const out = [];
for (let d = 1; d <= last; d++) {
  const pick = (m) => game.dailyAnimes(m, d).map((a) => a.title);
  const op = game.dailyAnimes("opening", d)[0];
  out.push({ emoji: pick("emoji"), opening: pick("opening"), pistas: pick("pistas"), song: game.pickOpening(op, d * 31 + 11).name, posts: dailyPosts(d).map((p) => ({ slot: p.slot, kind: p.kind, answer: p.answer ?? null, keep: p.keep ?? null, image: p.image ?? null })) });
}
process.stdout.write(JSON.stringify(out));
`,
  );
  // até o dia anterior ao corte E até hoje: um corte num dia que já começou no ar (ex.: 203 com o #203 rodando) muda hoje
  const today = game.dailyNumber();
  const last = Math.max(CATALOG_V2_FROM - 1, today);
  // no ar, pickOpening recebe a semente (dia × 31 + 11, como o OpeningGame); no local, o dia
  const live = JSON.parse(
    execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", job, String(last)], { cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }),
  );
  ok(`dias 1 a ${last} (até o corte e até hoje, #${today}): mesmo sorteio (3 modos e música) e mesmos posts do bot que o código no ar (${head})`, () => {
    for (let d = 1; d <= last; d++) {
      const op = game.dailyAnimes("opening", d)[0];
      const local = {
        ...Object.fromEntries(MODES.map((m) => [m, game.dailyAnimes(m, d).map((a) => a.title)])),
        song: game.pickOpening(op, d).name,
        // o que define o post de cada dia (horário, tipo, resposta, animes, imagem); a redação pode mudar de propósito
        posts: dailyPosts(d).map((p) => ({ slot: p.slot, kind: p.kind, answer: p.answer ?? null, keep: p.keep ?? null, image: p.image ?? null })),
      };
      assert.deepEqual(local, live[d - 1], `desafio #${d} mudou em relação ao que está no ar (corte CATALOG_V2_FROM = ${CATALOG_V2_FROM}, hoje #${today}): o corte tem de ser um dia que ainda não começou`);
    }
  });
}

console.log(`check-live: ${n} testes ok`);
