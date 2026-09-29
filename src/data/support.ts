// ============================================================
// APOIO — card de apoio da página /support e links "Ler o mangá" do fim de jogo.
//
// Card de apoio: chave Pix e/ou link de doação (vazio = essa parte some)
// + botões Amazon e Mercado Livre (ALL_MANGAS, abaixo).
//
// Mangás: cada item liga ao anime de mesmo título em src/data/animes —
// quando ele é a resposta, o fim de jogo mostra "Ler o mangá".
//  - Amazon: preencha AMAZON_TAG com seu ID de associado e TODOS os links
//    da Amazon (buscas) viram de afiliado. Ou cole um link específico em `amazon`.
//  - Mercado Livre: cole seu link de afiliado em `mercadoLivre`
//    (gerado no portal de afiliados). Vazio = busca normal no Mercado Livre.
// Só links https:// são aceitos.
// ============================================================

export const DONATION = {
  /** Chave Pix (e-mail, telefone, CPF/CNPJ ou aleatória) — aparece com botão "Copiar" */
  pixKey: "e6ae0e6f-9d94-409d-96a6-82db0a22c55b",
  /** Link de apoio (Apoia.se, LivePix, Ko-fi...) */
  link: "",
  /** Texto do botão desse link */
  linkLabel: "Apoiar pelo Apoia.se",
};

/** Seu ID de associado da Amazon (ex.: "aknewme-20") */
export const AMAZON_TAG = "aknewme0b-20";

/**
 * Botões Amazon e Mercado Livre do card de apoio (link genérico da loja).
 * Vazio = busca por mangás na loja (na Amazon já sai com AMAZON_TAG).
 * Mercado Livre: gere no portal de afiliados o link de https://lista.mercadolivre.com.br/manga e cole aqui.
 */
export const ALL_MANGAS = {
  amazon: "",
  mercadoLivre: "https://meli.la/2zgERS6",
};

export type Manga = {
  /** Título igual ao do anime em src/data/animes */
  anime: string;
  /** Nome do mangá, quando é diferente do anime (usado na busca) */
  name?: string;
  /** Link de afiliado da Amazon (opcional: sem ele, usa a busca com AMAZON_TAG) */
  amazon?: string;
  /** Link de afiliado do Mercado Livre (opcional: sem ele, usa a busca) */
  mercadoLivre?: string;
};

/** Animes com link "Ler o mangá" no fim de jogo. */
export const MANGAS: Manga[] = [
  { anime: "One Piece" },
  { anime: "Jujutsu Kaisen" },
  { anime: "Demon Slayer", name: "Demon Slayer: Kimetsu no Yaiba" },
  { anime: "Chainsaw Man" },
  { anime: "Naruto" },
  { anime: "Attack on Titan", name: "Ataque dos Titãs" },
  { anime: "Dandadan" },
  { anime: "Frieren", name: "Frieren e a Jornada para o Além" },
  { anime: "Spy x Family" },
  { anime: "Solo Leveling" },
  { anime: "Blue Lock" },
  { anime: "My Hero Academia" },
  { anime: "Dragon Ball Z", name: "Dragon Ball" },
  { anime: "Death Note" },
  { anime: "Hunter x Hunter" },
  { anime: "Fullmetal Alchemist: Brotherhood", name: "Fullmetal Alchemist" },
  { anime: "Berserk" },
  { anime: "Vinland Saga" },
  { anime: "Haikyu!!" },
  { anime: "One Punch Man" },
  { anime: "Oshi no Ko" },
  { anime: "Tokyo Revengers" },
  { anime: "Bleach" },
  { anime: "Slam Dunk" },
];
