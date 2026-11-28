// Filtro de @ ofensivo (specs/login-duelo/01-requisitos.md, R5f): palavrões, ofensas e discurso de ódio em português e
// inglês. Vale para o @ automático do login, a escolha, a troca e as sugestões (handleProblem em handle.ts usa isto).
// Função pura, testada por scripts/check-handle.mjs (casos bloqueados, com troca de letras, e uma lista de @ normais,
// inclusive os títulos do catálogo, que NÃO podem ser bloqueados). Para atualizar, mexa só nas duas listas abaixo e
// rode `npm test`.
//
// ANYWHERE: o termo bloqueia em qualquer lugar do @ (ignorando os "_").
// WHOLE: termo curto ou que aparece dentro de palavras normais ("puta" em "computador", "rape" em "grape", "cu" em
// "cuba"): só bloqueia quando é o @ inteiro ou uma parte separada por "_" (com ou sem números nas pontas).

const ANYWHERE = [
  // português
  "caralho", "buceta", "boceta", "cuzao", "cuzinho", "arrombad", "filhodaputa", "filhadaputa", "prostituta", "punhet", "xoxota", "xereca",
  "piroca", "viadinho", "bichona", "sapatao", "traveco", "crioulo", "retardad", "mongoloide", "estupr", "pedofil", "nazis", "putaria",
  "putinha", "puteiro", "babaca", "desgracad", "fodase", "fodid", "fudid", "foder", "fuder", "siririca", "boquete", "macumbeir", "vadia",
  "vagabunda", "merdinha", "escrot",
  // inglês
  "fuck", "bullshit", "shitty", "bitch", "pussy", "asshole", "nigger", "nigga", "faggot", "retard", "whore", "slut", "nazi", "hitler",
  "porn", "vagina", "tranny", "pedophile", "molest", "bastard", "wanker", "dildo", "handjob", "blowjob", "jizz",
];

const WHOLE = [
  // português
  "puta", "puto", "porra", "merda", "bosta", "cu", "viado", "bicha", "foda", "penis", "pica", "anal", "anus", "fdp", "pqp", "vsf", "vtnc", "tnc",
  // inglês
  "shit", "cunt", "dick", "cock", "ass", "fag", "rape", "rapist", "kkk", "sex", "cum", "chink", "spic", "kike", "pedo", "twat",
];

/** Troca de letras comum: 0→o, 3→e, 4→a, 5→s, 7→t, @→a. O "1" vale por "i" e por "l" (as duas leituras são testadas). */
const LEET: Record<string, string> = { "0": "o", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a" };
const unleet = (s: string, one: "i" | "l") => s.replace(/[03457@]/g, (c) => LEET[c]).replace(/1/g, one);
const plain = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** O @ tem termo ofensivo? */
export function isOffensive(handle: string): boolean {
  const h = plain(handle);
  for (const one of ["i", "l"] as const) {
    const text = unleet(h, one);
    const joined = text.replace(/_/g, "");
    if (ANYWHERE.some((t) => joined.includes(t))) return true;
    // partes separadas por "_": como estão, com as letras trocadas, e sem os números das pontas ("merda123")
    const parts = [joined, ...text.split("_"), ...h.split("_").map((p) => p.replace(/^\d+|\d+$/g, ""))].filter(Boolean);
    if (parts.some((p) => WHOLE.includes(p))) return true;
  }
  return false;
}
