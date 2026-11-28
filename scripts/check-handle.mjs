// Filtro de @ ofensivo e regra do @ (specs/login-duelo/01-requisitos.md, R5b e R5f). Uso: npm test
// - casos que têm de ser bloqueados (português e inglês), também com troca de letras e com "_" no meio;
// - @ normais que NÃO podem ser bloqueados: nomes comuns, palavras que contêm um termo curto e todos os títulos e
//   apelidos do catálogo de animes (como virariam @).
import assert from "node:assert/strict";
import { register } from "node:module";

register("./ts-alias-hooks.mjs", import.meta.url);
const { isOffensive } = await import("../src/lib/handleFilter.ts");
const { handleProblem, MAX_HANDLE_CHANGES, HANDLE_HOLD_DAYS, HANDLE_TEXT } = await import("../src/lib/handle.ts");
const { toHandle } = await import("../src/lib/handleSuggest.ts");
const { ANIMES } = await import("../src/data/animes/index.ts");

let n = 0;
const ok = (name, fn) => {
  fn();
  n++;
  console.log(`  ok ${name}`);
};

ok("bloqueia palavrões, ofensas e discurso de ódio em português e inglês", () => {
  const blocked = ["caralho", "filho_da_puta", "puta", "merda", "porra_loka", "cuzao", "o_arrombado", "viado", "estuprador", "pedofilo", "nazista", "hitler_fan", "fuck", "motherfucker", "bitch", "nigger", "faggot", "whore", "asshole", "shit", "big_dick", "rape", "porn_hub", "kkk"];
  for (const h of blocked) assert.equal(isOffensive(h), true, `${h} devia ser bloqueado`);
});

ok("bloqueia com troca de letras (0 1 3 4 5 7) e com _ no meio", () => {
  const blocked = ["c4r4lh0", "p0rra", "m3rd4", "pu7a", "fuck3r", "b1tch", "sh1t", "n1gg3r", "h1tl3r", "f_u_c_k", "p_u_t_a", "c_a_r_a_l_h_o", "v14d0", "merda123", "99puta", "a55hole", "vi4dinh0", "bu_ce_ta"];
  for (const h of blocked) assert.equal(isOffensive(h), true, `${h} devia ser bloqueado`);
});

ok("não bloqueia nomes comuns nem palavras normais que contêm um termo curto", () => {
  const fine = [
    "guilherme", "gui_fernandes", "ana_clara", "joao123", "maria_eduarda", "pedro_h", "lucas", "bia", "leo", "rafa", "amanda", "gustavo", "matheus", "larissa", "bruno_otaku",
    "computador", "deputado", "enviado", "disputa", "reputacao", "cuba", "cubo", "curioso", "escudo", "picante", "pikachu", "analise", "anual", "passaro", "classic", "assassin", "bassist",
    "grape", "drape", "therapist", "scunthorpe", "peacock", "cockpit", "dickens", "essex", "sexta_feira", "cumulus", "document", "shiitake", "massashi", "nagasaki", "kakashi",
    "sasuke", "naruto_uzumaki", "luffy", "zoro", "goku", "otaku_br", "anime_fan", "aknewme_fan", "player_one", "xX_dark_Xx", "the_legend27", "senpai", "kawaii", "baka",
  ];
  for (const h of fine) assert.equal(isOffensive(h.toLowerCase()), false, `${h} não devia ser bloqueado`);
});

ok("nenhum título ou apelido do catálogo de animes é bloqueado", () => {
  const all = ANIMES.flatMap((a) => [a.title, ...a.aliases]).map(toHandle).filter(Boolean);
  assert.ok(all.length > 300);
  const hit = all.filter(isOffensive);
  assert.deepEqual(hit, [], `bloqueados do catálogo: ${hit.join(", ")}`);
});

ok("handleProblem: formato, reservados e ofensivos; texto da recusa", () => {
  assert.deepEqual([handleProblem("ab"), handleProblem("Com Espaço"), handleProblem("admin"), handleProblem("p0rra"), handleProblem("gui_fernandes")], ["invalid", "invalid", "reserved", "offensive", null]);
  assert.equal(HANDLE_TEXT.offensive, "Esse usuário não é permitido. Escolha outro.");
});

ok("regra do @ num lugar só: uma troca para sempre, @ antigo guardado 30 dias, textos da spec", () => {
  assert.deepEqual([MAX_HANDLE_CHANGES, HANDLE_HOLD_DAYS], [1, 30]);
  assert.equal(HANDLE_TEXT.free, "Escolha com calma: depois disso, você só pode trocar uma vez.");
  assert.equal(HANDLE_TEXT.once, "Você só pode trocar seu usuário uma vez.");
  assert.equal(HANDLE_TEXT.confirm("novo"), "Trocar para @novo? Não dá para mudar depois.");
});

console.log(`check-handle: ${n} testes ok`);
