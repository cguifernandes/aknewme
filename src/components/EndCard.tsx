"use client";

import { faArrowRight, faCircleCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { outcome, readChallenge, sendDuelAnswer, type Challenge } from "@/lib/challenge";
import { closeOnBackdrop } from "@/lib/dialog";
import { PITCH, summarize, unbeatable } from "@/lib/endcard";
import { useDuelAnswers } from "@/lib/duelAnswers";
import { useFollowed } from "@/lib/follow";
import { dailyAnimes, dailyNumber, getDailyResult, getStreak, MODE_LABEL, MODE_PATH, playDay, resultAnimes, type GameMode } from "@/lib/game";
import { shareOrCopy } from "@/lib/share";
import { SITE_URL, X_FOLLOW_URL, X_HANDLE } from "@/lib/site";
import type { Standing } from "@/lib/stats";
import { mangaFor } from "@/lib/support";
import Carousel, { type Slide } from "./Carousel";
import ChallengeButton from "./ChallengeButton";
import CloseButton from "./CloseButton";
import DailyFeedback from "./DailyFeedback";
import DuelHelp from "./DuelHelp";
import DuelPitch from "./DuelPitch";
import DuelResult from "./DuelResult";
import EndAnimes from "./EndAnimes";
import EndResult from "./EndResult";
import EndStats from "./EndStats";
import NextDuel from "./NextDuel";
import { MODAL_TITLE } from "./modalText";
import { Icon, XLogo } from "./icons";
import { splitGrid } from "./ResultTiles";

type Props = {
  mode: GameMode;
  won: boolean;
  /** Resposta (omitida quando não faz sentido, ex.: vitória no Emoji, que são 5 rodadas). */
  answer?: string;
  /** Uma linha sobre a resposta (Opening: nome e artista da abertura) */
  detail?: string;
  /** Texto de compartilhar (desafio do dia), sem o link */
  share?: string;
  /** Só os quadradinhos */
  grid?: string;
  /** Nota do jogo (null = perdeu), para comparar com os outros jogadores do dia */
  score?: number | null;
  /** Opening: o palpite de cada tentativa */
  tries?: string[];
};

/** Contagem regressiva até a meia-noite local (próximo desafio). */
function useCountdown(): string {
  const [left, setLeft] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
      const pad = (n: number) => String(n).padStart(2, "0");
      setLeft(`${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

const MODES = Object.keys(MODE_LABEL) as GameMode[];
/** Uma linha sobre cada modo (botões "Os outros modos de hoje"). */
const MODE_HINT: Record<GameMode, string> = { emoji: "4 emojis, 1 anime", opening: "1 segundo da abertura", pistas: "Ano, estúdio, gênero..." };
/** Endereço do site como a pessoa digitaria ("www.aknewme.com"). */
const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const PRESS = "active:translate-y-0.5";
const PILL = "rounded-full px-3 py-1 text-xs font-bold";
/** Botão secundário, o padrão do projeto: fundo branco, borda clara e hover que preenche; sem sombra (essa é só do principal). */
const SECONDARY = `inline-flex items-center justify-center gap-2 rounded-full border-2 border-track bg-white px-3 py-2.5 text-sm font-bold text-ink sweep-track ${FOCUS}`;
/** Título de cada tela do carrossel; no computador o "Fechar" fica no canto de cima, daí a folga à direita. */
const TITLE = MODAL_TITLE;
/** Botão roxo do projeto (enche de lime no hover), sem sombra: na janela a sombra é só do "Desafiar um amigo". */
const PURPLE = `inline-flex items-center justify-center rounded-full bg-grape font-bold text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink ${FOCUS}`;
/** Cartão das telas do carrossel (o mesmo contorno dos cartões de estatísticas). */
const CARD = "rounded-2xl border-2 border-track p-3";
const CARD_TITLE = "font-display text-base font-extrabold text-ink";
const FOOT_LINK = `rounded text-xs font-semibold text-grape underline underline-offset-4 hover:text-grape-deep ${FOCUS}`;

/**
 * Janela de fim de jogo (<dialog> nativo: foco preso, Esc e clique fora fecham). Fechada, vira o botão
 * "Ver resultado" — o jogo por trás fica travado.
 * Esquerda (roxo): o resultado. Direita: um carrossel de três telas que troca sozinho — o resultado com as
 * imagens e as estatísticas do modo (ou, em página aberta por um link de desafio, os dois placares do duelo),
 * o convite para desafiar um amigo e, por último, a opinião sobre o desafio do dia com os links.
 */
export default function EndCard({ mode, won, answer, detail, share, grid, score, tries }: Props) {
  const [, follow] = useFollowed();
  const [standing, setStanding] = useState<Standing | null>(null);
  const [rival, setRival] = useState<Challenge | null>(null);
  const [streak, setStreak] = useState(0);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [open, setOpen] = useState(true);
  /** Tela do carrossel à mostra (o "?" do duelo só aparece na segunda) */
  const [tab, setTab] = useState(0);
  const ref = useRef<HTMLDialogElement>(null);
  const countdown = useCountdown();
  const day = playDay();
  const today = day === dailyNumber();
  const manga = mangaFor(answer);
  const { tiles, extra } = splitGrid(grid, won);
  // a arte e o passo a passo: no Emoji, as 5 rodadas do dia; nos outros, o anime da resposta
  const animes = mode === "emoji" ? dailyAnimes("emoji", day) : resultAnimes(mode, day, answer);
  const summary = summarize(mode, tiles, won);
  const pitch = PITCH[summary.tier];
  // Desafio que você mandou: quem abriu, quem está jogando e quem terminou (consulta o servidor a cada 10 s)
  const sent = useDuelAnswers(mode, day, { tiles, won });
  /** Adversário do duelo: quem te desafiou (link) ou, se foi você quem desafiou, o último que terminou */
  const foe: (Challenge & { player?: string }) | null = rival ?? (sent.done[0] ? { day, ...sent.done[0] } : null);
  const duel = foe && tiles.length ? outcome(mode, { tiles, won }, foe) : null;
  /** Alguém abriu o desafio que você mandou ou está jogando: o carrossel fica parado na aba de desafiar */
  const live = sent.live.length > 0;
  /** Página aberta pelo link de alguém: a janela é só o duelo, sem abas */
  const invited = !!(rival && duel);

  function show() {
    if (!ref.current?.open) ref.current?.showModal();
    ref.current?.focus(); // showModal focaria o "Fechar"; o foco fica na janela
    setOpen(true);
  }

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
    ref.current?.focus();
    const c = readChallenge();
    setRival(c);
    setStreak(getStreak());
    // aceitou um desafio e terminou: manda o placar para quem desafiou ver na janela dele
    if (c && tiles.length) sendDuelAnswer(c, { tiles, won });
  }, []);

  // Como a nota se compara com a de quem já jogou hoje (desafio do arquivo não entra na contagem).
  useEffect(() => {
    if (score === undefined || !today) return;
    fetch(`/api/played?mode=${mode}&day=${day}&score=${score ?? ""}`)
      .then((r) => r.json())
      .then(setStanding)
      .catch(() => {}); // sem rede: só não mostra a comparação
  }, [mode, score, day, today]);

  /** Texto de compartilhar: o duelo, ou o resultado + comparação e sequência; no fim, o link (com o dia, para a prévia do X). */
  function shareBody(): string {
    // desafio do arquivo: o link abre o mesmo dia para quem recebe
    const link = `👉 ${location.origin}${MODE_PATH[mode]}?${today ? `d=${day}` : `day=${day}`}&utm_source=${duel ? "duel" : "share"}`;
    if (foe && duel) {
      const theirs = summarize(mode, foe.tiles, foe.won);
      const verdict = { win: "Venci! 🏆", lose: "Perdi essa. Quero revanche.", tie: "Deu empate." }[duel];
      return `⚔️ Duelo no aknewme #${day} · Modo ${MODE_LABEL[mode]}\nEu ${summary.big} ${summary.unit} × ${theirs.big} ${theirs.unit} ${foe.nick}\n${verdict}\n${link}`;
    }
    const fire = streak >= 2 ? `🔥 ${streak} dias seguidos\n` : "";
    const top = standing && standing.better >= 50 ? `🏆 Melhor que ${standing.better}% dos jogadores\n` : "";
    return `${share}\n${top}${fire}${link}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {} // sem acesso à área de transferência: o endereço está escrito ao lado
  }

  /** Copia o placar do duelo (tela de quem foi desafiado): só copia, sem o menu de compartilhar do celular */
  async function copyDuel() {
    try {
      await navigator.clipboard.writeText(shareBody());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {} // sem acesso à área de transferência
  }

  async function shareResult() {
    if (await shareOrCopy(shareBody())) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const pills: { text: string; color: string }[] = [];
  if (standing) {
    if (standing.better > 0)
      pills.push({ text: `Melhor que ${standing.better}% de quem jogou hoje`, color: standing.better >= 50 ? "bg-lime text-ink" : "bg-sun text-ink" });
    else if (!won && standing.winPct < 50) pills.push({ text: `Só ${standing.winPct}% acertaram hoje. Não foi só você.`, color: "bg-blush text-ink" });
    else pills.push({ text: `${standing.winPct}% dos jogadores acertaram hoje`, color: "bg-track text-grape" });
  }

  const challenge = tiles.length > 0 && (
    <ChallengeButton mode={mode} won={won} tiles={tiles} label={rival ? "Desafiar" : duel ? "Desafiar de novo" : "Desafiar um amigo"} />
  );

  const pillRow = pills.length > 0 && (
    <p className="mb-3 flex flex-wrap items-center gap-2">
      {pills.map((p) => (
        <span key={p.text} className={`${PILL} ${p.color}`}>
          {p.text}
        </span>
      ))}
    </p>
  );

  /** Aba "Desafiar um amigo" */
  const pitchTab = 1;

  const slides: Slide[] = [
    {
      label: "Seu resultado",
      content: (
        <>
          {pillRow}
          {/* com duelo, o título da janela é o da aba do duelo */}
          <h2 id={duel ? undefined : "end-title"} className={TITLE}>
            {pitch.title}
          </h2>
          <div className="mt-3">
            <EndAnimes mode={mode} animes={animes} tiles={tiles} detail={detail} />
          </div>
          <div className="mt-3 empty:hidden">
            <EndStats mode={mode} />
          </div>
        </>
      ),
    },
    {
      label: "Desafiar um amigo",
      content: (_go, active) => (
        <DuelPitch
          active={active}
          mode={mode}
          day={day}
          tiles={tiles}
          won={won}
          title={!duel && unbeatable(mode, tiles) ? "Desafie alguém a empatar com você" : pitch.duel}
          stamp={duel}
          done={sent.done}
          live={sent.live}
        >
          {challenge}
        </DuelPitch>
      ),
    },
    {
      label: "Sua opinião e mais",
      content: (
        // no computador o "Fechar" da janela fica neste canto: a tela começa um pouco abaixo dele
        <div className="flex flex-1 flex-col">
          {/* opinião sobre o desafio (vai para o painel /plays); o arquivo não pergunta */}
          {today && <DailyFeedback mode={mode} />}

          <div className={`${CARD} ${today ? "mt-3" : ""}`}>
            <div className="flex items-center gap-2 rounded-full bg-track py-1 pr-1 pl-4">
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{SITE_HOST}</span>
              <button type="button" onClick={copyLink} className={`${PURPLE} shrink-0 px-3.5 py-1.5 text-xs`}>
                {linkCopied ? "Copiado!" : "Copiar link"}
              </button>
            </div>
            {share && (
              <button type="button" onClick={shareResult} className={`${SECONDARY} mt-2 w-full`}>
                {copied ? "Copiado!" : "Copiar meu resultado (sem spoiler)"}
              </button>
            )}
            <p aria-live="polite" className="sr-only">
              {copied ? "Resultado copiado" : linkCopied ? "Link copiado" : ""}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className={`${CARD} flex flex-col`}>
              <p className={CARD_TITLE}>Segue no X</p>
              <p className="mt-1 mb-2 text-xs text-muted">Enigma novo todo dia e o desafio do dia no @{X_HANDLE}.</p>
              <a href={X_FOLLOW_URL} target="_blank" rel="noopener noreferrer" onClick={follow} className={`${PURPLE} mt-auto w-full px-3 py-2.5 text-sm`}>
                Seguir @{X_HANDLE}
              </a>
            </div>
            <div className={`${CARD} flex flex-col`}>
              <p className={CARD_TITLE}>Apoie o aknewme</p>
              <p className="mt-1 mb-2 text-xs text-muted">Qualquer valor ajuda a pagar o servidor e a trazer mais animes.</p>
              <Link href="/support" className={`${PURPLE} mt-auto w-full px-3 py-2.5 text-sm`}>
                Apoiar o projeto
              </Link>
            </div>
          </div>

          <p className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1">
            <Link href="/" className={FOOT_LINK}>
              Outros modos
            </Link>
            <Link href="/archive" className={FOOT_LINK}>
              Desafios anteriores
            </Link>
            {/* momento em que a pessoa acabou de descobrir o anime: link do mangá */}
            {manga && (
              <a
                href={manga.amazon}
                target="_blank"
                rel="sponsored noopener noreferrer"
                aria-label={`Onde ler o mangá: ${manga.name} na Amazon (abre em nova aba)`}
                className={FOOT_LINK}
              >
                Onde ler o mangá
              </a>
            )}
          </p>
        </div>
      ),
    },
  ];

  // Quem foi desafiado (página aberta pelo link de alguém): 2 telas — o duelo e o que fazer depois
  const others = MODES.filter((m) => m !== mode);
  /** Modos já jogados hoje neste navegador (lido ao abrir a janela) */
  const [donePlays, setDonePlays] = useState<Partial<Record<GameMode, boolean>>>({});
  useEffect(() => setDonePlays(Object.fromEntries(MODES.map((m) => [m, !!getDailyResult(m)]))), []);
  const invitedSlides: Slide[] =
    invited && rival && duel
      ? [
          {
            label: "Resultado do duelo",
            content: (_go, active) => <DuelResult mode={mode} mine={{ tiles, won }} rival={rival} result={duel} animes={animes} active={active} tallyRow={false} />,
          },
          {
            label: "E agora?",
            content: (
              <div className="flex flex-1 flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <NextDuel mode={mode} />
                  <div className="flex flex-col rounded-2xl border-2 border-track p-4">
                    <p className="text-[11px] font-bold tracking-wider text-grape uppercase">Compartilhar</p>
                    <p className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-track px-3 py-2 text-sm font-bold text-ink">
                      <span className="truncate">
                        Você {summary.big} × {summarize(mode, rival.tiles, rival.won).big} {rival.nick}
                      </span>
                      <span className="shrink-0 text-xs text-grape">#{day}</span>
                    </p>
                    <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
                      <button type="button" onClick={copyDuel} className={SECONDARY}>
                        {copied ? "Copiado!" : "Copiar"} <Icon icon={copied ? faCircleCheck : faCopy} />
                      </button>
                      <a
                        href={`https://x.com/intent/post?text=${encodeURIComponent(shareBody())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-2 rounded-full bg-x px-3 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-85 ${FOCUS}`}
                      >
                        Postar <XLogo />
                      </a>
                    </div>
                    <p aria-live="polite" className="sr-only">
                      {copied ? "Placar copiado" : ""}
                    </p>
                  </div>
                </div>
                {/* outros modos do dia: dá para jogar (e desafiar) também; o que já foi jogado hoje aparece como feito */}
                <div className="rounded-2xl border-2 border-track p-3">
                  <p className="font-display text-base font-extrabold text-ink">Os outros modos de hoje</p>
                  <ul className="mt-2.5 grid grid-cols-2 gap-2">
                    {others.map((m) => (
                      <li key={m}>
                        <Link
                          href={MODE_PATH[m]}
                          className={`group flex items-center justify-between gap-2 rounded-xl bg-grape px-3 py-2.5 transition-colors hover:bg-grape-deep ${FOCUS}`}
                        >
                          <span className="min-w-0">
                            <span className="block font-display text-base leading-tight font-extrabold text-white">{MODE_LABEL[m]}</span>
                            <span className="block truncate text-[11px] text-lavender">{donePlays[m] ? "Já jogou hoje · ver resultado" : MODE_HINT[m]}</span>
                          </span>
                          <Icon
                            icon={donePlays[m] ? faCircleCheck : faArrowRight}
                            className="shrink-0 text-sm text-lime transition-transform group-hover:translate-x-0.5"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                {today && <DailyFeedback mode={mode} />}
              </div>
            ),
          },
        ]
      : [];

  return (
    <>
      <dialog
        ref={ref}
        aria-labelledby="end-title"
        tabIndex={-1}
        onClose={() => setOpen(false)}
        onClick={closeOnBackdrop}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(54rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-white text-ink shadow-pop-lg outline-none backdrop:bg-ink/60"
      >
        {/* o amigo terminou com a janela aberta: "Você venceu!" por cima, que some sozinho; o placar dele fica no cartão da aba de desafiar */}
        {sent.fresh && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-ink/55">
            <div
              onAnimationEnd={sent.clearFresh}
              style={{ animationDuration: "2.8s" }}
              className={`animate-celebrate rounded-3xl px-10 py-7 text-center shadow-pop-lg ${
                duel === "win" ? "bg-lime text-ink" : duel === "lose" ? "bg-blush text-ink" : "bg-sun text-ink"
              }`}
            >
              <p className="font-display text-5xl font-extrabold tracking-tight">{duel === "win" ? "Você venceu!" : duel === "lose" ? "Você perdeu" : "Empate!"}</p>
              <p className="mt-1 text-sm font-bold">{sent.fresh.nick} terminou o seu desafio</p>
            </div>
          </div>
        )}
        <div className="relative grid md:grid-cols-[21rem_1fr]">
          <CloseButton onClick={() => ref.current?.close()} className="absolute top-3 right-3 z-10" />
          {/* "?" do duelo: ao lado do "Fechar", só na tela de desafiar (no celular ele fica dentro da tela) */}
          {!invited && tab === pitchTab && <DuelHelp className="absolute top-3 right-13 z-10 max-md:hidden" />}

          <EndResult
            mode={mode}
            day={day}
            tiles={tiles}
            extra={extra}
            summary={summary}
            animes={animes}
            tries={tries}
            countdown={countdown}
            next={dailyNumber() + 1}
          />

          <div className="flex min-w-0 flex-col p-5 text-left sm:p-6 md:pt-14">
            <Carousel slides={invited ? invitedSlides : slides} onChange={setTab} hold={!invited && live ? pitchTab : undefined} />
          </div>
        </div>
      </dialog>

      {!open && (
        <button
          id="ver-resultado" // o XPostAlert se esconde quando encostaria neste botão
          type="button"
          onClick={show}
          className={`fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full bg-lime px-7 py-3.5 font-bold text-ink sweep-white ${PRESS} ${FOCUS}`}
        >
          Ver resultado
        </button>
      )}
    </>
  );
}
