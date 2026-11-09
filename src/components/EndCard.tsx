"use client";

import {
  faAnglesRight,
  faCheck,
  faCircleCheck,
  faHeartCrack,
  faCopy,
  faTrophy,
  faXmark,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { closeOnBackdrop } from "@/lib/dialog";
import { useFollowed } from "@/lib/follow";
import { dailyNumber, getStreak, MODE_PATH, playDay, type GameMode } from "@/lib/game";
import { shareOrCopy } from "@/lib/share";
import { X_FOLLOW_URL, X_HANDLE } from "@/lib/site";
import type { Standing } from "@/lib/stats";
import { mangaFor } from "@/lib/support";
import { Icon, XLogo } from "./icons";
import StatsPanel from "./StatsPanel";

type Props = {
  mode: GameMode;
  won: boolean;
  /** Resposta a revelar (omitida quando não faz sentido, ex.: vitória multi-rodada). */
  answer?: string;
  /** Uma linha: fica junto da resposta, ou sozinha abaixo do título */
  detail?: string;
  /** Texto de compartilhar (desafio do dia), sem o link */
  share?: string;
  /** Só os quadradinhos, mostrados como prévia */
  grid?: string;
  /** Nota do jogo (null = perdeu), para comparar com os outros jogadores do dia */
  score?: number | null;
};

/** Contagem regressiva até a meia-noite local (próximo desafio). */
function useCountdown(): string {
  const [left, setLeft] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const s = Math.max(
        0,
        Math.floor((midnight.getTime() - now.getTime()) / 1000),
      );
      const pad = (n: number) => String(n).padStart(2, "0");
      setLeft(
        `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const BTN = `block w-full rounded-full py-3.5 font-bold ${FOCUS}`;
const PRESS = "shadow-pop active:translate-y-0.5 active:shadow-none";
const BTN_PRIMARY = `${BTN} ${PRESS} bg-lime text-ink sweep-white`;
const ROW = "flex items-center justify-between gap-3 rounded-2xl bg-track px-4 py-3 text-left";
const ROW_BTN = `shrink-0 rounded-full px-5 py-3 text-sm font-bold ${FOCUS}`;
const FOOT_LINK = `rounded text-xs font-semibold text-grape underline underline-offset-4 hover:text-grape-deep ${FOCUS}`;

/** Quadradinho do compartilhamento → bloco colorido do card (⬜ e desconhecidos viram tracejado). */
const TILE: Record<string, { bg: string; icon?: IconDefinition }> = {
  "🟩": { bg: "bg-lime", icon: faCheck },
  "🟨": { bg: "bg-sun", icon: faCheck },
  "🟥": { bg: "bg-blush", icon: faXmark },
  "⬛": { bg: "bg-lavender", icon: faAnglesRight },
  "🟪": { bg: "bg-lavender" },
};

/**
 * Janela de fim de jogo (<dialog> nativo: foco preso, Esc e clique fora fecham).
 * Fechada, vira o botão "Ver resultado" — o jogo por trás fica travado.
 */
export default function EndCard({
  mode,
  won,
  answer,
  detail,
  share,
  grid,
  score,
}: Props) {
  const [followed, follow] = useFollowed();
  const [standing, setStanding] = useState<Standing | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const primaryRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const countdown = useCountdown();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(true);
  const manga = mangaFor(answer);
  // 1ª linha do grid = quadradinhos; o resto (corações do Modo Emoji) segue como emoji
  const [squares = "", ...rest] = (grid ?? "").split("\n");
  const tiles = Array.from(squares);
  const extra = rest.join("\n");
  const tried = tiles.filter((t) => t !== "⬜").length;

  function show() {
    if (!ref.current?.open) ref.current?.showModal();
    primaryRef.current?.focus(); // showModal focaria o "Fechar"; o certo é a ação principal
    setOpen(true);
  }

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
    primaryRef.current?.focus();
  }, []);

  // Como a nota se compara com a de quem já jogou hoje (desafio do arquivo não entra na contagem).
  useEffect(() => {
    if (score === undefined || playDay() !== dailyNumber()) return;
    fetch(`/api/played?mode=${mode}&day=${dailyNumber()}&score=${score ?? ""}`)
      .then((r) => r.json())
      .then(setStanding)
      .catch(() => {}); // sem rede: só não mostra a comparação
  }, [mode, score]);

  /** Texto final: resultado + comparação e streak (ganchos) + link com nº do dia (prévia do X muda por dia) e origem. */
  function fullText(source: string) {
    const streak = getStreak();
    const fire = streak >= 2 ? `🔥 ${streak} dias seguidos\n` : "";
    const top = standing && standing.better >= 50 ? `🏆 Melhor que ${standing.better}% dos jogadores\n` : "";
    // desafio do arquivo: o link abre o mesmo dia para quem recebe
    const day = playDay() === dailyNumber() ? `d=${dailyNumber()}` : `day=${playDay()}`;
    return `${share}\n${top}${fire}👉 ${location.origin}${MODE_PATH[mode]}?${day}&utm_source=${source}`;
  }

  async function shareResult() {
    if (await shareOrCopy(fullText("share"))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      <dialog
        ref={ref}
        aria-labelledby="end-title"
        onClose={() => setOpen(false)}
        onClick={closeOnBackdrop}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(27rem,calc(100%-2rem))] overflow-y-auto rounded-3xl bg-white text-ink shadow-pop-lg backdrop:bg-ink/60"
      >
        <div className="p-4 text-center sm:p-5">
          <div
            className={`relative rounded-2xl px-5 py-6 ${won ? "bg-lime/40" : "bg-blush/30"}`}
          >
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Fechar"
              className={`absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-white text-grape transition hover:bg-track ${FOCUS}`}
            >
              <Icon icon={faXmark} className="text-lg" />
            </button>

            <p
              className={`mx-auto flex size-12 items-center justify-center rounded-full bg-white text-xl ${won ? "text-grape" : "text-danger"}`}
            >
              <Icon icon={won ? faTrophy : faHeartCrack} />
            </p>
            <h2 id="end-title" className="mt-4 text-sm font-semibold">
              {won
                ? mode === "opening" && tried
                  ? `Acertou na ${tried}ª tentativa!`
                  : "Acertou!"
                : answer
                  ? "Não foi dessa vez — a resposta era"
                  : "Não foi dessa vez"}
            </h2>
            {(answer || detail) && (
              <p className="mt-1 font-display text-4xl leading-tight font-extrabold">
                {answer ?? detail}
              </p>
            )}
            {answer && detail && (
              <p className="mt-1.5 text-sm font-semibold text-muted">{detail}</p>
            )}
          </div>

          {/* prévia dos quadradinhos que vão no compartilhamento */}
          {grid && (
            <div className="mt-6" aria-hidden="true">
              <p className="flex flex-wrap justify-center gap-2">
                {tiles.map((t, i) => {
                  const tile = TILE[t];
                  return (
                    <span
                      key={i}
                      style={{ animationDelay: `${200 + i * 80}ms` }}
                      className={`flex size-9 animate-pop items-center justify-center rounded-lg text-sm text-ink ${tile ? tile.bg : "border-2 border-dashed border-lavender"}`}
                    >
                      {tile?.icon && <Icon icon={tile.icon} />}
                    </span>
                  );
                })}
              </p>
              {extra && (
                <p className="mt-2 text-lg tracking-wider">
                  {extra}
                </p>
              )}
              {mode === "opening" && !won && (
                <p className="mt-2 text-sm text-muted">
                  {tried} tentativas, nenhum acerto
                </p>
              )}
            </div>
          )}

          {standing && (
            <p className="mt-5 text-sm font-bold text-grape">
              {standing.better > 0
                ? `Você foi melhor que ${standing.better}% dos jogadores de hoje`
                : `${standing.winPct}% dos jogadores acertaram hoje`}
            </p>
          )}

          {share && (
            <>
              <button
                ref={primaryRef}
                type="button"
                onClick={shareResult}
                className={`${BTN_PRIMARY} mt-7 inline-flex items-center justify-center gap-2.5`}
              >
                {copied ? "Copiado!" : "Compartilhar resultado"} <Icon icon={copied ? faCircleCheck : faCopy} />
              </button>
              <p aria-live="polite" className="sr-only">
                {copied ? "Resultado copiado" : ""}
              </p>
            </>
          )}

          {/* só os números; o gráfico fica na janela de estatísticas da home */}
          <div className="mt-7">
            <StatsPanel mode={mode} />
          </div>

          <div className={`mt-7 ${ROW}`}>
            <p className="text-xs text-muted">
              Próximo desafio em
              <strong className="block font-display text-xl font-extrabold text-ink tabular-nums">
                {countdown}
              </strong>
            </p>
            <Link
              ref={share ? undefined : primaryRef}
              href="/"
              className={`${ROW_BTN} bg-grape text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink`}
            >
              Outros modos
            </Link>
          </div>

          {/* desafios anteriores: liberados para quem segue no X; para quem não segue, o convite diz isso com todas as letras */}
          {followed !== null && (
            <div className={`mt-3 ${ROW} bg-grape!`}>
              <p className="text-xs text-lavender">
                <strong className="block text-sm font-bold text-white">Desafios anteriores</strong>
                {followed ? "Jogue os dias que você perdeu" : "Siga no X para liberar todos"}
              </p>
              {followed ? (
                <Link href="/archive" className={`${ROW_BTN} bg-white text-ink sweep-lime`}>
                  Jogar
                </Link>
              ) : (
                <a
                  href={X_FOLLOW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={follow}
                  className={`${ROW_BTN} inline-flex items-center gap-2 bg-x text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink`}
                >
                  <XLogo /> Seguir
                </a>
              )}
            </div>
          )}

          <p className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1">
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
            <a href={X_FOLLOW_URL} target="_blank" rel="noopener noreferrer" onClick={follow} className={FOOT_LINK}>
              Seguir @{X_HANDLE} no X
            </a>
            <Link href="/support" className={FOOT_LINK}>
              Apoiar o aknewme
            </Link>
          </p>
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
