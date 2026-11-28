// Apaga só as contas falsas criadas por scripts/seed-friends.mjs (username "teste_..." com login "aknewme-seed-N"), no
// banco do npm run dev (branch "teste-login"). Em cascata saem as amizades, pedidos, placares, salas e notificações delas.
// A conta de verdade (ex.: @guiizitos) fica. Uso: node scripts/unseed-friends.mjs --dev
import { devDatabase, dropSeed } from "./seed-lib.mjs";

const sql = devDatabase();
console.log(`unseed: ${await dropSeed(sql)} contas falsas apagadas`);
