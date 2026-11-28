"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, MODE_NAME, setActiveRoom } from "@/lib/account";
import Loading from "../Loading";
import { rank } from "@/lib/challenge";
import { dailyNumber, getDailyResult, MODE_PATH, type GameMode } from "@/lib/game";
import { loadMoves } from "@/lib/moves";
import { RESCUE_SCORE } from "@/lib/stats";
import { Alert, Avatar, BTN_PRIMARY, BTN_SECONDARY, Eyebrow, LINK, Spinner, Stage, Sub, Title } from "./ui";
import { useReadOnArrival } from "./Notifications";
import type { NotificationItem } from "@/lib/notify";

type Result = { won: boolean; score: number | null; tiles: string[] };
type Player = { id: string; handle: string | null; image: string | null; status: "invited" | "joined" | "declined" | "finished"; result: Result | null };
type View = { id: string; mode: GameMode; day: number; ownerId: string; max: number; me: { id: string; status: Player["status"] }; players: Player[] };
type Problem = "not_found" | "expired" | "offline" | "server";

const POLL_MS = 5000;
const STATUS: Record<Player["status"], string> = { invited: "Convidado", joined: "Jogando", declined: "Recusou", finished: "Terminou" };
const SUBMIT_ERROR: Record<string, string> = {
  mismatch: "Seu resultado não bateu com a conferência do servidor, então não foi salvo.",
  invalid_moves: "Não deu para conferir esta partida, então ela não foi salva.",
  already_played: "Você já tem um placar nesta sala.",
  full: "Esta sala está cheia.",
  expired: "Esta sala expirou junto com o desafio dela.",
  rate_limited: "Muitas tentativas. Espere um minuto e tente de novo.",
  offline: "Sem conexão. Sua partida está salva: tente de novo.",
};

function scoreLabel(mode: GameMode, r: Result): string {
  if (mode === "emoji") return `${r.score ?? 0}/5`;
  if (!r.won) return "Errou";
  if (mode === "opening") return r.score === RESCUE_SCORE ? "Com resgate" : `${r.score}ª tentativa`;
  return `${r.score} pts`;
}

/** Sala de duelo (T15): quem entrou, quem terminou, e o placar lado a lado depois que você termina (sem espiar). */
export default function RoomView({ id }: { id: string }) {
  // convite e placar desta sala contam como lidos ao abrir a sala (11-notificacoes.md)
  useReadOnArrival(useCallback((n: NotificationItem) => n.room?.id === id, [id]));
  const router = useRouter();
  const [view, setView] = useState<View | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [local, setLocal] = useState<"none" | "unverifiable" | "other_day" | "ready">("none");
  const tried = useRef(false);

  const load = useCallback(async () => {
    const r = await api<View>(`/api/duels/${id}`);
    if (r.ok) {
      setView(r.data);
      setProblem(null);
      if (r.data.me.status !== "declined") setActiveRoom(r.data.mode, r.data.day, r.data.id);
      return r.data;
    }
    if (r.status === 401) router.replace(`/login?next=${encodeURIComponent(`/room/${id}`)}`);
    else setProblem(r.status === 404 ? "not_found" : r.status === 410 ? "expired" : r.status === 0 ? "offline" : "server");
    return null;
  }, [id, router]);

  const submit = useCallback(async (v: View) => {
    const mine = getDailyResult(v.mode);
    const moves = loadMoves(v.mode, v.day);
    if (!mine || mine.day !== v.day) return setLocal(dailyNumber() === v.day ? "none" : "other_day");
    if (!moves) return setLocal("unverifiable");
    setLocal("ready");
    setBusy(true);
    setSubmitError("");
    const r = await api(`/api/duels/${v.id}/result`, "POST", { moves, claimed: { won: mine.won, score: mine.score ?? null } });
    setBusy(false);
    if (!r.ok) setSubmitError(SUBMIT_ERROR[r.status === 429 ? "rate_limited" : r.status === 0 ? "offline" : r.error] ?? SUBMIT_ERROR.offline);
    await load();
  }, [load]);

  // Abre a sala, manda o placar se você já jogou o desafio de hoje, e segue atualizando enquanto falta alguém
  useEffect(() => {
    let stop = false;
    load().then((v) => {
      // convidado ainda decide (Join/Decline): o placar só vai depois de entrar
      if (v && !tried.current && v.me.status === "joined") {
        tried.current = true;
        const mine = getDailyResult(v.mode);
        if (mine && mine.day === v.day) submit(v);
        else setLocal(dailyNumber() === v.day ? "none" : "other_day");
      }
    });
    const t = setInterval(() => {
      if (!stop && document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [load, submit]);

  async function answer(join: boolean) {
    setBusy(true);
    const r = await api(`/api/duels/${id}/join`, "POST", join ? {} : { decline: true });
    setBusy(false);
    if (!r.ok) setSubmitError(SUBMIT_ERROR[r.status === 0 ? "offline" : r.error] ?? SUBMIT_ERROR.offline);
    const v = await load();
    if (v && join && v.me.status === "joined" && getDailyResult(v.mode)?.day === v.day) submit(v);
  }

  if (problem && !view) {
    const text =
      problem === "not_found"
        ? "Esta sala não existe, ou você não foi convidado para ela."
        : problem === "expired"
          ? "Esta sala expirou junto com o desafio dela. As salas duram um dia."
          : problem === "offline"
            ? "Sem conexão. Confira sua internet e tente de novo."
            : "Algo deu errado ao carregar esta sala.";
    return (
      <Stage>
        <Title>{problem === "expired" ? "Sala expirada." : "Sala indisponível."}</Title>
        <Alert>{text}</Alert>
        <div className="flex flex-col gap-2.5">
          {(problem === "offline" || problem === "server") && (
            <button type="button" onClick={() => load()} className={BTN_PRIMARY}>
              Tentar de novo
            </button>
          )}
          <Link href="/friends" className={BTN_SECONDARY}>
            Voltar para os amigos
          </Link>
        </div>
      </Stage>
    );
  }
  if (!view)
    return (
      <Loading />
    );

  const done = view.me.status === "finished";
  const finished = view.players.filter((p) => p.status === "finished" && p.result);
  const ranked = [...finished].sort((a, b) => rank(view.mode, b.result!.tiles, b.result!.won) - rank(view.mode, a.result!.tiles, a.result!.won));
  const best = ranked[0] && rank(view.mode, ranked[0].result!.tiles, ranked[0].result!.won);
  const waiting = view.players.filter((p) => p.status !== "finished");

  return (
    <Stage wide>
      <Eyebrow>
        {MODE_NAME[view.mode]} · desafio #{view.day}
      </Eyebrow>
      <Title>{done ? "Placar." : "Sala de duelo."}</Title>
      <Sub>
        {done
          ? "O placar de cada um aparece quando ele termina."
          : "Você vê o placar dos outros quando terminar. Sem espiar."}
      </Sub>
      {problem === "offline" && <Alert>A conexão caiu. Vamos continuar tentando.</Alert>}
      {submitError && <Alert>{submitError}</Alert>}

      {view.me.status === "invited" && (
        <div className="mb-6 flex flex-col gap-2.5">
          <button type="button" onClick={() => answer(true)} disabled={busy} aria-busy={busy} className={BTN_PRIMARY}>
            {busy && <Spinner />} Entrar na sala
          </button>
          <button type="button" onClick={() => answer(false)} disabled={busy} className={BTN_SECONDARY}>
            Recusar
          </button>
        </div>
      )}
      {view.me.status === "declined" && (
        <div className="mb-6">
          <p className="mb-2 text-[15px] text-ink">Você recusou este convite.</p>
          <button type="button" onClick={() => answer(true)} disabled={busy} className={BTN_SECONDARY}>
            Entrar mesmo assim
          </button>
        </div>
      )}
      {view.me.status === "joined" && !busy && (
        <div className="mb-6">
          {local === "unverifiable" ? (
            <Alert>Você jogou o desafio de hoje neste aparelho antes de existirem as salas, então não dá para conferir esta partida.</Alert>
          ) : local === "other_day" ? (
            <Alert>Esta sala é do desafio #{view.day}, mas seu aparelho está no desafio de outro dia.</Alert>
          ) : local === "ready" && submitError ? (
            <button type="button" onClick={() => submit(view)} className={BTN_PRIMARY}>
              Enviar meu placar de novo
            </button>
          ) : (
            <Link href={MODE_PATH[view.mode]} className={BTN_PRIMARY}>
              Jogar o Modo {MODE_NAME[view.mode]} de hoje
            </Link>
          )}
        </div>
      )}
      {busy && view.me.status !== "invited" && <Loading size="sm" className="mb-6" />}

      {done && ranked.length > 0 && (
        <ol className="mb-6 grid gap-3 sm:grid-cols-2" aria-label="Placar">
          {ranked.map((p) => {
            const top = rank(view.mode, p.result!.tiles, p.result!.won) === best && ranked.length > 1;
            return (
              <li key={p.id} className={`rounded-xl border-2 p-3 ${top ? "border-ink bg-lime/30" : "border-track"}`}>
                <div className="flex items-center gap-2">
                  <Avatar image={p.image} handle={p.handle} size={32} />
                  <span className="min-w-0 flex-1 truncate font-bold text-ink">
                    @{p.handle}
                    {p.id === view.me.id && <span className="font-medium text-muted"> (você)</span>}
                  </span>
                  <span className="text-sm font-bold text-ink">{top ? `🏆 ${scoreLabel(view.mode, p.result!)}` : scoreLabel(view.mode, p.result!)}</span>
                </div>
                <p className="mt-2 text-xl tracking-widest" aria-label={`Rodadas: ${p.result!.tiles.join(" ")}`}>
                  {p.result!.tiles.join("")}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      <h2 className="mb-2 font-display text-xl font-extrabold text-ink">
        Jogadores ({view.players.filter((p) => p.status !== "declined").length}/{view.max})
      </h2>
      <ul className="border-t border-track">
        {(done ? waiting : view.players).map((p) => (
          <li key={p.id} className="flex items-center gap-3 border-b border-track py-3">
            <Avatar image={p.image} handle={p.handle} size={32} />
            <span className="min-w-0 flex-1 truncate font-bold text-ink">
              @{p.handle}
              {p.id === view.ownerId && <span className="font-medium text-muted"> · anfitrião</span>}
              {p.id === view.me.id && <span className="font-medium text-muted"> (você)</span>}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.status === "finished" ? "bg-lime text-ink" : p.status === "declined" ? "bg-track text-muted" : "bg-track text-grape"}`}>
              {STATUS[p.status]}
            </span>
          </li>
        ))}
        {done && waiting.length === 0 && <li className="border-b border-track py-3 text-sm text-muted">Todo mundo terminou.</li>}
      </ul>
      <p className="mt-6 text-sm">
        <Link href="/friends" className={LINK}>
          Voltar para os amigos
        </Link>
      </p>
    </Stage>
  );
}
