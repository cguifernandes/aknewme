// Massa de dados de amigos para testar /friends no npm run dev (branch "teste-login" do Neon). NUNCA no banco principal.
// Cria contas falsas marcadas (username "teste_...", login falso "aknewme-seed-N") e, para a conta escolhida: ~30 amigos
// (sem placares), 12 pedidos recebidos, 5 enviados e algumas notificações. Sem salas: estão desligadas (13-escopo-lancamento.md).
// Roda de novo sem duplicar: apaga as falsas antes de criar (e, com elas, salas e placares de testes antigos). Apagar tudo: node scripts/unseed-friends.mjs --dev
//
// Uso: node scripts/seed-friends.mjs --dev [--for <username>]   (padrão: guiizitos)
// Não imprime a string de conexão.
import { devDatabase, dropSeed } from "./seed-lib.mjs";

const FIRST = ["Ana", "Bia", "Caio", "Duda", "Enzo", "Fê", "Gabi", "Hugo", "Isa", "João", "Kaique", "Lari", "Leo", "Malu", "Nico", "Olívia", "Pedro", "Rafa", "Sofia", "Theo", "Vini", "Yasmin", "Zeca", "Lívia", "Bruno", "Clara", "Davi", "Elisa", "Fábio", "Gui", "Helena", "Igor", "Júlia", "Kevin", "Luna", "Mateus", "Nina", "Otávio", "Paula", "Renan", "Sara", "Tomás", "Valen", "Wesley", "Ximena", "Yuri", "Zoe"];
const LAST = ["Souza", "Lima", "Otaku", "Santos", "Mendes", "Kun", "Chan", "Rocha", "Alves", "Senpai", "Costa", "Dias"];

{
  const sql = devDatabase();
  const forIdx = process.argv.indexOf("--for");
  const target = (forIdx > 0 ? process.argv[forIdx + 1] : "guiizitos")?.replace(/^@/, "").toLowerCase();

  const [me] = await sql.query("SELECT id FROM users WHERE handle = $1", [target]);
  if (!me) {
    console.error(`seed: não achei @${target} no banco de dev. Entre uma vez no npm run dev ou use --for <username>. Nada foi feito.`);
    process.exit(1);
  }
  const removed = await dropSeed(sql);

  // 47 contas falsas: 30 amigos, 12 pedidos recebidos, 5 enviados. Umas com a foto padrão (pública) do Discord, outras sem.
  const people = [];
  for (let i = 0; i < 47; i++) {
    const name = i % 7 === 3 ? null : `${FIRST[i % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`;
    const handle = `teste_${(FIRST[i % FIRST.length].normalize("NFD").replace(/[^a-zA-Z]/g, "").toLowerCase() + (i + 1)).slice(0, 14)}`;
    const image = i % 3 === 0 ? `https://cdn.discordapp.com/embed/avatars/${i % 6}.png` : null;
    const [u] = await sql.query(
      `WITH u AS (INSERT INTO users (name, image, handle) VALUES ($1, $2, $3) RETURNING id)
       INSERT INTO accounts (provider, provider_account_id, user_id) SELECT 'discord', $4, id FROM u RETURNING user_id AS id`,
      [name, image, handle, `aknewme-seed-${i + 1}`],
    );
    people.push({ id: u.id, handle });
  }
  const friends = people.slice(0, 30);
  const incoming = people.slice(30, 42);
  const outgoing = people.slice(42, 47);

  // amigos aceitos (as duas direções). Sem placares nem salas: as salas estão desligadas (13-escopo-lancamento.md)
  for (const f of friends) await sql.query("INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'accepted'), ($2, $1, 'accepted')", [me.id, f.id]);
  for (const p of incoming) await sql.query("INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'pending')", [p.id, me.id]);
  for (const p of outgoing) await sql.query("INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'pending')", [me.id, p.id]);

  // notificações: 4 pedidos recebidos e 1 aceite (não lidas) e 2 aceites antigos (lidas)
  for (const p of incoming.slice(0, 4)) await sql.query("INSERT INTO notifications (user_id, type, actor_id) VALUES ($1, 'friend_request', $2)", [me.id, p.id]);
  await sql.query("INSERT INTO notifications (user_id, type, actor_id) VALUES ($1, 'friend_accepted', $2)", [me.id, friends[9].id]);
  for (const f of friends.slice(10, 12)) await sql.query("INSERT INTO notifications (user_id, type, actor_id, read_at) VALUES ($1, 'friend_accepted', $2, now())", [me.id, f.id]);

  console.log(`seed: @${target} · ${removed} falsas antigas apagadas · ${people.length} contas falsas (teste_*) · ${friends.length} amigos · ${incoming.length} pedidos recebidos · ${outgoing.length} enviados · 7 notificações (5 não lidas) · sem salas`);
}
