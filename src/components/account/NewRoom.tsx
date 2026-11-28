"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, loadMe, MODE_NAME, rememberAccount, setActiveRoom } from "@/lib/account";
import Loading from "../Loading";
import { dailyNumber, type GameMode } from "@/lib/game";
import NeedHandle from "./NeedHandle";
import { Alert, Avatar, BTN_PRIMARY, BTN_SECONDARY, Eyebrow, LINK, Spinner, Stage, Sub, Title } from "./ui";

type Friend = { id: string; handle: string | null; image: string | null; playedToday: boolean };
const MODES: GameMode[] = ["emoji", "opening", "pistas"];
const MAX_INVITES = 3; // sala de 4: o dono e 3 amigos

const ERROR: Record<string, string> = {
  not_friends: "Alguém que você escolheu não é mais seu amigo. Recarregue a página e escolha de novo.",
  rate_limited: "Muitas tentativas. Espere um minuto e tente de novo.",
  offline: "Sem conexão. Nada foi perdido: tente de novo.",
};

/** Criar sala (T15): o desafio de hoje do modo escolhido, com até 3 amigos da lista. */
export default function NewRoom() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("mode") as GameMode;
  const [mode, setMode] = useState<GameMode>(MODES.includes(initial) ? initial : "emoji");
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needHandle, setNeedHandle] = useState(false);

  const start = useCallback(() => {
    const here = location.pathname + location.search; // volta para cá depois do login
    loadMe().then(async (r) => {
      if (!r.ok && r.status === 401) return router.replace(`/login?next=${encodeURIComponent(here)}`);
      if (!r.ok) return setError(ERROR.offline);
      rememberAccount(r.data);
      // sem @: escolhe na janela Meu perfil (a tela /handle saiu) e a tela segue sozinha depois
      if (!r.data.handle) return setNeedHandle(true);
      setNeedHandle(false);
      const f = await api<{ friends: Friend[] }>("/api/friends");
      if (f.ok) {
        setFriends(f.data.friends);
        // "Desafiar em outro modo" do "⋯" de /friends: o amigo já vem marcado
        const pre = params.get("friend");
        if (pre && f.data.friends.some((x) => x.id === pre)) setPicked([pre]);
      }
      else setError(ERROR[f.status === 429 ? "rate_limited" : "offline"]);
    });
  }, [router, params]);
  useEffect(start, [start]);

  const toggle = (id: string) =>
    setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length < MAX_INVITES ? [...list, id] : list));

  async function create() {
    if (!picked.length || busy) return;
    setBusy(true);
    setError("");
    const r = await api<{ id: string }>("/api/duels", "POST", { mode, invite: picked });
    if (!r.ok) {
      setBusy(false);
      return setError(ERROR[r.status === 429 ? "rate_limited" : r.status === 0 ? "offline" : r.error] ?? "Não deu para criar a sala. Tente de novo.");
    }
    setActiveRoom(mode, dailyNumber(), r.data.id);
    router.replace(`/room/${r.data.id}`);
  }

  if (needHandle) return <NeedHandle text="Seus amigos te acham pelo username. Escolha o seu para abrir uma sala." onReady={start} />;

  return (
    <Stage wide>
      <Eyebrow>Desafio de hoje</Eyebrow>
      <Title>Desafie seus amigos.</Title>
      <Sub>Escolha até {MAX_INVITES} amigos. Todo mundo joga o desafio de hoje, e o placar de cada um aparece quando ele termina.</Sub>

      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-bold text-ink">Modo</legend>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <label key={m} className={`flex min-h-11 cursor-pointer items-center rounded-lg border-2 px-4 font-bold has-focus-visible:outline-3 has-focus-visible:outline-grape ${mode === m ? "border-ink bg-ink text-white" : "border-track text-ink"}`}>
              <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
              {MODE_NAME[m]}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <Alert>{error}</Alert>}
      {!friends ? (
        !error && (
          <Loading size="sm" />
        )
      ) : friends.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-lavender p-4">
          <p className="mb-3 text-[15px] text-ink">Você precisa de amigos para abrir uma sala.</p>
          <Link href="/friends" className={BTN_SECONDARY}>
            Adicionar amigos
          </Link>
        </div>
      ) : (
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-ink">
            Amigos ({picked.length}/{MAX_INVITES})
          </legend>
          <ul className="border-t border-track">
            {friends.map((f) => {
              const on = picked.includes(f.id);
              const full = !on && picked.length >= MAX_INVITES;
              return (
                <li key={f.id} className="border-b border-track">
                  <label className={`flex min-h-14 items-center gap-3 py-2 ${full ? "opacity-60" : "cursor-pointer"}`}>
                    <input type="checkbox" checked={on} disabled={full} onChange={() => toggle(f.id)} className="size-5 accent-grape" />
                    <Avatar image={f.image} handle={f.handle} size={32} />
                    <span className="flex-1 font-bold text-ink">@{f.handle}</span>
                    <span className="text-sm text-muted">{f.playedToday ? "Jogou hoje" : "Ainda não jogou"}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {picked.length >= MAX_INVITES && <p className="mt-2 text-sm text-muted">A sala tem até 4 jogadores: você e 3 amigos.</p>}
          <button type="button" onClick={create} disabled={!picked.length || busy} aria-busy={busy} className={`${BTN_PRIMARY} mt-5`}>
            {busy && <Spinner />} Criar sala
          </button>
        </fieldset>
      )}
      <p className="mt-6 text-sm">
        <Link href="/friends" className={LINK}>
          Voltar para os amigos
        </Link>
      </p>
    </Stage>
  );
}
