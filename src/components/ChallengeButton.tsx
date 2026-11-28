"use client";

import { faCircleCheck, faPen } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useId, useRef, useState } from "react";
import {
  challengeLink,
  cleanNick,
  DUEL_SENT_EVENT,
  hasSentDuel,
  loadNick,
  saveNick,
  sentDuelId,
} from "@/lib/challenge";
import { challengeLine } from "@/lib/endcard";
import { MODE_LABEL, playDay, type GameMode } from "@/lib/game";
import { imageFile, sharesNatively, shareWithImage } from "@/lib/share";
import { useAccount } from "./account/AccountProvider";
import { saveDuelToAccount } from "@/lib/accountDuels";
import { GRAPE_PRIMARY, LIME_DARKEN } from "./buttons";
import { Icon } from "./icons";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const PRESS = "active:translate-y-0.5";

/**
 * Botão "Desafiar um amigo": pede o apelido (fica guardado no navegador) e manda o convite do duelo. Com conta, não pede:
 * usa o nome da conta (ou o @), com a mesma limpeza do apelido, e já manda (login-duelo/12-desafio-com-conta.md); o
 * lápis ainda deixa trocar o nome só para esse envio.
 * No celular abre o menu de compartilhar com a imagem do placar (/api/card, sem as jogadas) e o link;
 * no computador copia o texto com o link.
 */
/** Cor do botão inicial: lime (fim de jogo, Próximo duelo) ou o roxo primário (cartões de modo jogado: ChallengeModes) */
const TONE = {
  lime: LIME_DARKEN,
  grape: GRAPE_PRIMARY,
  /** lime que escurece (lime-deep da esquerda para a direita, texto ink): cartão "Próximo duelo" */
  limeDarken: LIME_DARKEN,
};

export default function ChallengeButton({
  mode,
  won,
  tiles,
  label,
  tone = "lime",
}: {
  mode: GameMode;
  won: boolean;
  tiles: string[];
  label: string;
  tone?: keyof typeof TONE;
}) {
  const [step, setStep] = useState<"button" | "form" | "sending">("button");
  /** Nunca mandou um desafio: o botão leva o selo "Novo" (o duelo é recurso novo do site) */
  const [isNew, setIsNew] = useState(false);
  const [nick, setNick] = useState("");
  const [copied, setCopied] = useState(false);
  /** Já mandou nesta janela: o rótulo vira "Copiar de novo" / "Compartilhar de novo" */
  const [sentOnce, setSentOnce] = useState(false);
  /** Celular com compartilhar nativo: "Compartilhar"; computador (copia): "Copiar link" (lido depois de montar) */
  const [native, setNative] = useState(false);
  useEffect(() => setNative(sharesNatively()), []);
  const file = useRef<Promise<File | null> | null>(null);
  const day = playDay();
  const nickId = useId(); // o botão aparece em mais de uma tela do carrossel

  /** Já tem apelido salvo: mostra o nome com "editar", em vez do campo */
  const [editing, setEditing] = useState(true);
  const me = useAccount();
  /** Com conta: o nome dela (ou o @) no lugar do apelido; "" sem conta */
  const accountNick = me ? cleanNick(me.name ?? me.handle ?? "") : "";
  /** Mandando com o nome da conta: não grava como apelido do navegador (o de quem joga sem conta fica como estava) */
  const [asAccount, setAsAccount] = useState(false);

  /** Começa a gerar a imagem do convite antes do envio: o menu do iPhone não espera muito depois do toque */
  function loadImage() {
    const q = new URLSearchParams({
      mode,
      day: String(day),
      g: tiles.join(""),
      won: won ? "1" : "0",
      hide: "1",
    });
    file.current ??= imageFile(
      `/api/card?${q}`,
      `aknewme-${day}-${mode}.png`,
    ).catch(() => null);
  }

  useEffect(() => {
    setIsNew(!hasSentDuel());
    const saved = loadNick();
    setNick(saved);
    setEditing(!saved);
    if (saved) loadImage(); // com apelido salvo o botão já envia: a imagem precisa estar pronta
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao montar
  }, []);

  // com conta o botão envia direto: a imagem precisa estar pronta antes do toque
  useEffect(() => {
    if (accountNick) loadImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- quando a conta aparece
  }, [accountNick]);

  // "Link copiado!" volta para o botão normal depois de 2,5 s; o timer é do efeito (cada cópia nova recomeça, e nada fica
  // pendurado se a janela fechar)
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(t);
  }, [copied]);

  /** Apelido salvo: envia na hora (e mostra a faixa com o nome, para trocar). Sem apelido: abre o campo. */
  function openForm() {
    loadImage();
    setStep("form");
    if (accountNick) {
      // com conta: sem pedir apelido, manda já com o nome da conta
      setAsAccount(true);
      setNick(accountNick);
      setEditing(false);
      return void send(undefined, accountNick, true);
    }
    if (!editing && cleanNick(nick)) void send();
  }

  async function send(
    e?: React.FormEvent,
    as?: string,
    fromAccount = asAccount,
  ) {
    e?.preventDefault();
    const name = cleanNick(as ?? nick);
    if (!name) return;
    if (!fromAccount) saveNick(name);
    setStep("sending");
    const link = challengeLink(mode, {
      day,
      nick: name,
      tiles,
      won,
      id: sentDuelId(mode, day) ?? undefined,
    });
    const text = `⚔️ ${name} te desafiou no aknewme · Modo ${MODE_LABEL[mode]}\n${challengeLine(mode, tiles, won, day)} Consegue bater?\n👉 ${link}`;
    const didCopy = await shareWithImage(await file.current, text);
    window.dispatchEvent(new Event(DUEL_SENT_EVENT)); // a janela já começa a perguntar se alguém abriu
    // logado: o desafio também vai para a conta, com as jogadas (o servidor confere o placar; se não bater, não salva)
    if (me)
      void saveDuelToAccount(
        "challenger",
        mode,
        day,
        sentDuelId(mode, day, false),
        name,
      );
    setStep("form");
    setSentOnce(true);
    if (didCopy) {
      setCopied(false); // copiar de novo antes de sumir reinicia os 2,5 s
      requestAnimationFrame(() => setCopied(true));
    }
  }

  if (step === "button")
    return (
      <button
        type="button"
        onClick={openForm}
        className={`flex w-full items-center justify-center gap-2 rounded-full py-3 font-bold ${TONE[tone]} ${PRESS} ${FOCUS}`}
      >
        {label}
        {isNew && (
          <span className="rounded-full bg-grape px-2 py-0.5 text-[10px] leading-none font-extrabold tracking-wide text-white uppercase">
            Novo
          </span>
        )}
      </button>
    );

  // mesma faixa do "Copiar link" do fim de jogo: campo dentro da pílula lilás e botão roxo pequeno
  return (
    <form
      onSubmit={send}
      className="flex items-center gap-2 rounded-full bg-track py-1 pr-1 pl-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-grape"
    >
      {editing ? (
        <>
          <label className="sr-only" htmlFor={nickId}>
            Seu apelido
          </label>
          <input
            id={nickId}
            autoFocus
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            maxLength={20}
            placeholder="Seu apelido"
            autoComplete="nickname"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-ink outline-none placeholder:font-semibold placeholder:text-muted"
          />
        </>
      ) : (
        // apelido salvo: aparece pronto, com o lápis para trocar
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setAsAccount(false); // trocou o nome: o que digitar vira o apelido salvo, como sem conta
          }}
          aria-label={`Desafiar como ${nick}. Editar apelido`}
          className="group/nick flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-muted outline-none"
        >
          <span className="truncate">
            como <strong className="font-bold text-ink">{nick}</strong>
          </span>
          <Icon
            icon={faPen}
            className="shrink-0 text-[11px] text-grape group-hover/nick:text-grape-deep"
          />
        </button>
      )}
      <button
        type="submit"
        disabled={!cleanNick(nick) || step === "sending"}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-grape px-3.5 py-1.5 text-xs font-bold text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink disabled:opacity-60 ${FOCUS}`}
      >
        {step === "sending"
          ? "Preparando..."
          : copied
            ? "Link copiado!"
            : native
              ? sentOnce
                ? "Compartilhar de novo"
                : "Compartilhar"
              : sentOnce
                ? "Copiar de novo"
                : "Copiar link"}
        {copied && <Icon icon={faCircleCheck} />}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Desafio copiado" : ""}
      </span>
    </form>
  );
}
