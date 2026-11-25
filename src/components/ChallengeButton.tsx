"use client";

import { faCircleCheck, faPen } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useId, useRef, useState } from "react";
import { challengeLink, cleanNick, DUEL_SENT_EVENT, hasSentDuel, loadNick, saveNick, sentDuelId } from "@/lib/challenge";
import { challengeLine } from "@/lib/endcard";
import { MODE_LABEL, playDay, type GameMode } from "@/lib/game";
import { imageFile, shareWithImage } from "@/lib/share";
import { Icon } from "./icons";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";
const PRESS = "active:translate-y-0.5";

/**
 * Botão "Desafiar um amigo": pede o apelido (fica guardado no navegador) e manda o convite do duelo.
 * No celular abre o menu de compartilhar com a imagem do placar (/api/card, sem as jogadas) e o link;
 * no computador copia o texto com o link.
 */
export default function ChallengeButton({ mode, won, tiles, label }: { mode: GameMode; won: boolean; tiles: string[]; label: string }) {
  const [step, setStep] = useState<"button" | "form" | "sending">("button");
  /** Nunca mandou um desafio: o botão leva o selo "Novo" (o duelo é recurso novo do site) */
  const [isNew, setIsNew] = useState(false);
  const [nick, setNick] = useState("");
  const [copied, setCopied] = useState(false);
  const file = useRef<Promise<File | null> | null>(null);
  const day = playDay();
  const nickId = useId(); // o botão aparece em mais de uma tela do carrossel

  /** Já tem apelido salvo: mostra o nome com "editar", em vez do campo */
  const [editing, setEditing] = useState(true);

  /** Começa a gerar a imagem do convite antes do envio: o menu do iPhone não espera muito depois do toque */
  function loadImage() {
    const q = new URLSearchParams({ mode, day: String(day), g: tiles.join(""), won: won ? "1" : "0", hide: "1" });
    file.current ??= imageFile(`/api/card?${q}`, `aknewme-${day}-${mode}.png`).catch(() => null);
  }

  useEffect(() => {
    setIsNew(!hasSentDuel());
    const saved = loadNick();
    setNick(saved);
    setEditing(!saved);
    if (saved) loadImage(); // com apelido salvo o botão já envia: a imagem precisa estar pronta
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao montar
  }, []);

  /** Apelido salvo: envia na hora (e mostra a faixa com o nome, para trocar). Sem apelido: abre o campo. */
  function openForm() {
    loadImage();
    setStep("form");
    if (!editing && cleanNick(nick)) void send();
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const name = cleanNick(nick);
    if (!name) return;
    saveNick(name);
    setStep("sending");
    const link = challengeLink(mode, { day, nick: name, tiles, won, id: sentDuelId(mode, day) ?? undefined });
    const text = `⚔️ ${name} te desafiou no aknewme · Modo ${MODE_LABEL[mode]}\n${challengeLine(mode, tiles, won, day)} Consegue bater?\n👉 ${link}`;
    const didCopy = await shareWithImage(await file.current, text);
    window.dispatchEvent(new Event(DUEL_SENT_EVENT)); // a janela já começa a perguntar se alguém abriu
    setStep("form");
    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  if (step === "button")
    return (
      <button
        type="button"
        onClick={openForm}
        className={`flex w-full items-center justify-center gap-2 rounded-full bg-lime py-3 font-bold text-ink sweep-ink not-disabled:hover:text-white not-disabled:focus-visible:text-white ${PRESS} ${FOCUS}`}
      >
        {label}
        {isNew && <span className="rounded-full bg-grape px-2 py-0.5 text-[10px] leading-none font-extrabold tracking-wide text-white uppercase">Novo</span>}
      </button>
    );

  // mesma faixa do "Copiar link" do fim de jogo: campo dentro da pílula lilás e botão roxo pequeno
  return (
    <form onSubmit={send} className="flex items-center gap-2 rounded-full bg-track py-1 pr-1 pl-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-grape">
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
          onClick={() => setEditing(true)}
          aria-label={`Desafiar como ${nick}. Editar apelido`}
          className="group/nick flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-muted outline-none"
        >
          <span className="truncate">
            como <strong className="font-bold text-ink">{nick}</strong>
          </span>
          <Icon icon={faPen} className="shrink-0 text-[11px] text-grape group-hover/nick:text-grape-deep" />
        </button>
      )}
      <button
        type="submit"
        disabled={!cleanNick(nick) || step === "sending"}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-grape px-3.5 py-1.5 text-xs font-bold text-white sweep-lime not-disabled:hover:text-ink not-disabled:focus-visible:text-ink disabled:opacity-60 ${FOCUS}`}
      >
        {step === "sending" ? "Preparando..." : copied ? "Link copiado!" : editing ? "Enviar desafio" : "Enviar de novo"}
        {copied && <Icon icon={faCircleCheck} />}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Desafio copiado" : ""}
      </span>
    </form>
  );
}
