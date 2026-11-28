// Aplica as migrações de db/migrations no banco do DATABASE_URL (Neon), em ordem, cada uma uma vez só.
// Uso: npm run db:migrate            → banco do .env.local (o do build/produção, como o Next)
//      npm run db:migrate -- --dev   → banco do npm run dev (.env.development.local: o branch de teste)
// Nunca imprime a string de conexão.
// As migrações são idempotentes (IF NOT EXISTS): rodar de novo não quebra, mesmo sem a tabela de controle.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

const dev = process.argv.includes("--dev");
nextEnv.loadEnvConfig(process.cwd(), dev, { info() {}, error() {} });
console.log(`migrate: banco do ${dev ? "npm run dev (.env.development.local)" : ".env.local"}`);
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("migrate: DATABASE_URL não está definida (Vercel / .env.local). Nada foi feito.");
  process.exit(1);
}

const sql = neon(url);
const dir = join(process.cwd(), "db", "migrations");
/** Tira os comentários e divide o arquivo em comandos (as migrações não usam ";" dentro de funções). */
const statements = (text) =>
  text
    .replace(/^\s*--.*$/gm, "")
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);

await sql.query("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
const done = new Set((await sql.query("SELECT name FROM schema_migrations")).map((r) => r.name));

for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  if (done.has(file)) {
    console.log(`migrate: ${file} já aplicada`);
    continue;
  }
  const list = statements(readFileSync(join(dir, file), "utf8"));
  await sql.transaction([...list.map((s) => sql.query(s)), sql.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file])]);
  console.log(`migrate: ${file} aplicada (${list.length} comandos)`);
}
console.log("migrate: ok");
