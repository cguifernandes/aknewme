import { ALL_MANGAS as ALL_MANGAS_LINKS, AMAZON_TAG, DONATION, MANGAS } from "@/data/support";

// Os links vêm de um arquivo editado à mão: só aceita https (nada de javascript: etc.).
const https = (url?: string) => (url && /^https:\/\/[^\s"'<>]+$/.test(url.trim()) ? url.trim() : undefined);

/** Busca na Amazon só na loja de Livros (mangás, não bonecos), com o seu ID de associado. */
function amazonSearch(term: string): string {
  const url = new URL("https://www.amazon.com.br/s");
  url.searchParams.set("k", term);
  url.searchParams.set("i", "stripbooks");
  if (AMAZON_TAG.trim()) url.searchParams.set("tag", AMAZON_TAG.trim());
  return url.toString();
}

export type MangaCard = {
  anime: string;
  name: string;
  amazon: string;
  mercadoLivre: string;
};

/** Mangás com os links finais (afiliado ou busca na loja), para o "Ler o mangá" do fim de jogo. */
export const MANGA_CARDS: MangaCard[] = MANGAS.map((m) => {
  const name = m.name ?? m.anime;
  const term = `${name} mangá`;
  // Mercado Livre busca pelo caminho: /one-piece-manga
  const slug = term.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    anime: m.anime,
    name,
    amazon: https(m.amazon) ?? amazonSearch(term),
    mercadoLivre: https(m.mercadoLivre) ?? `https://lista.mercadolivre.com.br/${slug}`,
  };
});

/** Botões Amazon e Mercado Livre do card de apoio (link genérico da loja). */
export const ALL_MANGAS = {
  amazon: https(ALL_MANGAS_LINKS.amazon) ?? amazonSearch("mangá"),
  mercadoLivre: https(ALL_MANGAS_LINKS.mercadoLivre) ?? "https://lista.mercadolivre.com.br/manga",
};

/** Links do mangá de um anime (fim de jogo), ou undefined se não está na lista. */
export function mangaFor(animeTitle?: string): MangaCard | undefined {
  return MANGA_CARDS.find((m) => m.anime === animeTitle);
}

/** Doação configurada? (vazio = card escondido no site publicado) */
export const PIX_KEY = DONATION.pixKey.trim();
export const DONATION_LINK = https(DONATION.link);
export const DONATION_LABEL = DONATION.linkLabel;
