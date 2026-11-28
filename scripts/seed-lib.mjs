// Funções comuns de seed-friends.mjs e unseed-friends.mjs: trava no banco de teste e apaga só as contas falsas.
import { readFileSync } from "node:fs";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

/** Garante o banco do npm run dev (.env.development.local) e que ele não é o principal (.env.local). */
export function devDatabase() {
  if (!process.argv.includes("--dev")) {
    console.error("seed: use --dev (só roda no branch de teste do npm run dev). Nada foi feito.");
    process.exit(1);
  }
  const fromFile = (f) => {
    try {
      const line = readFileSync(f, "utf8").split(/\r?\n/).find((l) => /^\s*DATABASE_URL\s*=/.test(l));
      return line ? line.replace(/^\s*DATABASE_URL\s*=\s*/, "").trim().replace(/^["']|["']$/g, "") : null;
    } catch {
      return null;
    }
  };
  const dev = fromFile(".env.development.local");
  const main = fromFile(".env.local");
  if (!dev || dev === main) {
    console.error("seed: .env.development.local sem DATABASE_URL própria (igual à do .env.local ou ausente). Nada foi feito.");
    process.exit(1);
  }
  nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  if (process.env.DATABASE_URL !== dev) {
    console.error("seed: DATABASE_URL carregada não é a do branch de teste. Nada foi feito.");
    process.exit(1);
  }
  return neon(dev);
}

/** Apaga só as contas falsas (e, em cascata, amizades, pedidos, placares, salas e notificações delas). */
export async function dropSeed(sql) {
  const gone = await sql.query(
    `DELETE FROM users WHERE handle LIKE 'teste\\_%' AND id IN (SELECT user_id FROM accounts WHERE provider_account_id LIKE 'aknewme-seed-%')
     RETURNING id`,
  );
  return gone.length;
}
