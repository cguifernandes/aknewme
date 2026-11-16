"use client";

import { faQuestion, faXmark } from "@fortawesome/free-solid-svg-icons";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { closeOnBackdrop } from "@/lib/dialog";
import { Icon } from "./icons";

type Guide = { title: string; steps?: string[]; about: string[] };

/** Texto de cada página. Fica no HTML mesmo com a janela fechada: é o que o Google lê da página. */
const GUIDES: Record<string, Guide> = {
  "/": {
    title: "Como funciona o aknewme",
    about: [
      "O aknewme é um jogo diário de adivinhar animes, no estilo do Wordle e do Termo. Todo dia, à meia-noite, saem três desafios novos, iguais para todo mundo: descobrir o anime pelos emojis, reconhecer a abertura (opening) em poucos segundos ou deduzir o título a partir de pistas como ano de estreia, estúdio e gênero.",
      "Dá para jogar de graça no celular ou no computador, sem cadastro. Seu resultado, sua sequência de dias e suas estatísticas ficam salvos no navegador, e no fim de cada modo você pode compartilhar o placar com os amigos.",
    ],
  },
  "/emoji": {
    title: "Como jogar o quiz de anime por emojis",
    steps: [
      "Todo dia, à meia-noite, sai um desafio novo com 5 animes, o mesmo para todo mundo.",
      "Em cada rodada aparecem 4 emojis que resumem um anime. Digite o nome dele: a lista sugere títulos enquanto você escreve.",
      "Você tem 3 vidas em cada rodada. Cada palpite errado custa uma vida e libera uma dica: o gênero no 1º erro, o ano e o estúdio no 2º. Depois disso, você pode ver a primeira letra do nome.",
      "Cada dica ganha a cor do chute que a abriu, e fica assim: verde se ele bate com a dica, amarelo se chega perto e vermelho se não tem nada a ver.",
      "Não faz ideia? Pule a rodada: você vê a resposta e segue para o próximo anime, sem ponto.",
      "Cada anime acertado vale 1 ponto, até 5. Se as vidas da rodada acabarem, aquele anime fica sem ponto e o jogo segue para o próximo.",
      "No fim, compartilhe seu resultado com os amigos e volte amanhã para manter a sequência de dias.",
    ],
    about: [
      "O Modo Emoji é um jogo de adivinhar anime pelos emojis: cada combinação esconde personagens, objetos e momentos marcantes de um anime famoso, de clássicos a lançamentos recentes.",
    ],
  },
  "/opening": {
    title: "Como jogar o quiz de openings de anime",
    steps: [
      "Todo dia, à meia-noite, sai uma abertura nova, a mesma para todo mundo.",
      "Aperte o play e ouça só 1 segundo da opening. Reconheceu? Digite o nome do anime.",
      "Errou ou pulou? O trecho aumenta: 1, 2, 4, 7, 11 e 16 segundos.",
      "São 6 tentativas no total. Quanto menos segundos você precisar, melhor o resultado.",
      "No fim aparecem o nome da música e o artista, e você pode compartilhar quantos segundos levou.",
    ],
    about: [
      'O Modo Opening é um quiz de música de anime: teste se você reconhece as aberturas mais famosas só pelos primeiros segundos, como num desafio de "adivinhe a música".',
    ],
  },
  "/clues": {
    title: "Como jogar o quiz de anime por pistas",
    steps: [
      "Todo dia, à meia-noite, sai um anime novo para descobrir, o mesmo para todo mundo.",
      "Você começa com a primeira pista, o ano de estreia. As próximas são estúdio, gênero, número de episódios e sinopse.",
      "Errou o palpite? A próxima pista abre sozinha e o jogo compara seu chute com o anime do dia: se ele é mais antigo ou mais recente, se é do mesmo estúdio, se tem gênero em comum e se tem mais ou menos episódios. Você também pode revelar uma pista quando quiser.",
      "Acertar com 1 pista vale 5 pontos. Cada pista a mais custa 1 ponto, até 1 ponto com as 5 abertas.",
      "Se errar com todas as pistas abertas, o desafio acaba e a resposta é revelada.",
    ],
    about: [
      "O Modo Pistas é um jogo de dedução para quem conhece os detalhes: estúdio de animação, ano de lançamento e quantidade de episódios bastam para os fãs mais atentos acertarem com poucas pistas.",
    ],
  },
  "/higher-lower": {
    title: "Como jogar o Mais ou Menos",
    steps: [
      "À esquerda fica um anime com o número dele à mostra: episódios, ano de estreia, nota ou popularidade.",
      "À direita aparece outro anime. Chute se o número dele é maior ou menor: mais episódios, estreia depois, nota mais alta, mais popular.",
      "A nota (de 0 a 10) e a popularidade (número de membros) vêm do MyAnimeList, o maior catálogo de animes da internet.",
      "Acertou? O anime da direita passa para a esquerda e chega um novo. A categoria troca a cada rodada.",
      "Acertos seguidos rendem medalhas: Bronze com 5, Prata com 10, Ouro com 25 e Lendário com 50.",
      "Errou, a sequência zera. Seu recorde fica salvo: jogue de novo quantas vezes quiser.",
    ],
    about: [
      'O Mais ou Menos é o modo infinito do aknewme, no estilo "higher or lower": não tem limite por dia nem hora para acabar. É para testar se você sabe qual anime é mais longo, qual chegou primeiro, qual tem a melhor nota e qual é mais popular, de clássicos a lançamentos recentes. Nota e popularidade são dados do MyAnimeList.',
    ],
  },
};

/** Botão "?" do cabeçalho + janela "Como jogar" da página atual (<dialog> nativo: foco preso, Esc fecha). */
export default function HowToPlay() {
  const ref = useRef<HTMLDialogElement>(null);
  const guide = GUIDES[usePathname()];
  if (!guide) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        aria-label="Como jogar"
        title="Como jogar"
        className="flex size-10 items-center justify-center rounded-full bg-grape-deep text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
      >
        <Icon icon={faQuestion} className="text-base" />
      </button>

      <dialog
        ref={ref}
        aria-labelledby="howto-title"
        onClick={closeOnBackdrop}
        className="m-auto max-h-[90dvh] w-[min(34rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-white p-6 text-ink shadow-pop-lg backdrop:bg-ink/60 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="howto-title" className="text-balance font-display text-3xl leading-tight font-extrabold">
            {guide.title}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Fechar"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-grape transition hover:bg-track focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape"
          >
            <Icon icon={faXmark} className="text-lg" />
          </button>
        </div>

        {guide.steps && (
          <ol className="mt-5 space-y-3">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex gap-3 rounded-2xl bg-track px-4 py-3 text-[15px] leading-relaxed">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-grape font-display text-sm font-extrabold text-white"
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        )}
        <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-muted">
          {guide.about.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </dialog>
    </>
  );
}
