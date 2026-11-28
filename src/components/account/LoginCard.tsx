"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { api, loadMe, rememberAccount, safeNext, type Me } from "@/lib/account";
import { hasLocalDuels } from "@/lib/challenge";
import Loading from "../Loading";
import HandleStep, { type Suggestion } from "./HandleStep";
import { showToast } from "./SignInToast";
import { DiscordLogo, GoogleLogo } from "./ProviderLogos";
import Logo from "../Logo";
import { navigateStart } from "../NavProgress";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "../icons";
import { BTN_DISCORD, BTN_GOOGLE, LINK, Spinner } from "./ui";

type Provider = "google" | "discord";

// Sign-in screen (specs/login-duelo/02-ux.md, prototype estilos/d-login-v2.html): brand panel on the left (solid grape),
// sign-in on the right; on phones (up to 800 px) the panel becomes a short header above the sign-in.
// Google and Discord only (no email/password). Signing in is always optional. Uses the site's fonts (font-display for
// headings, font-sans from <body>), the site Logo and the account buttons from ./ui. No looping animation.

/** Provedor do último clique (guardado na sessão): na volta com ?error=, diz de onde veio o "cancelou". */
const PROVIDER_KEY = "aknewme.loginProvider";
const PROVIDER_NAME: Record<Provider, string> = { google: "Google", discord: "Discord" };
const FAILED = "Não deu para entrar. Tente de novo.";

/**
 * Texto do aviso para o ?error= do Auth.js. OAuthCallbackError = o provedor voltou com erro, na prática quem clicou em
 * "Cancelar" na tela do Google ou do Discord (error=access_denied). O resto (Configuration, AccessDenied...) é o genérico;
 * o motivo exato fica no log do servidor (lib/authLog.ts).
 */
function errorText(error: string, provider: string | null): string {
  if (error === "OAuthCallbackError" && (provider === "google" || provider === "discord")) return `Você cancelou o login no ${PROVIDER_NAME[provider]}.`;
  return FAILED;
}
/** Aviso de erro do login: toast do projeto no canto superior direito, que some sozinho e tem o "Fechar". */
const showError = (message: string) => showToast(message, undefined, { place: "top-right", alert: true });

// sem salas no lançamento (13-escopo-lancamento.md): só o que a conta dá hoje
const PERKS = ["Adicione seus amigos pelo username", "Desafie um amigo com um link", "Saiba quando te mandam um pedido de amizade"];

export default function LoginCard({ ready }: { ready: Record<Provider, boolean> }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [busy, setBusy] = useState<Provider | null>(null);
  // Volta do Google/Discord (?done=1): confere a conta. Com @ (o de sempre ou o criado agora), segue para `next`;
  // sem @, o passo 2 aparece aqui mesmo, no lugar dos botões (06-usuario.md).
  const [phase, setPhase] = useState<"buttons" | "checking" | "step">(params.get("done") === "1" ? "checking" : "buttons");
  const [me, setMe] = useState<Me | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  /** Há duelos jogados sem conta neste navegador (lido depois de montar) */
  const [localDuels, setLocalDuels] = useState(false);
  useEffect(() => setLocalDuels(hasLocalDuels()), []);

  // Auth.js volta para cá com ?error= quando o login falha: vira o aviso, e o ?error= sai da URL (recarregar não repete)
  useEffect(() => {
    const error = params.get("error");
    if (!error) return;
    let provider: string | null = null;
    try {
      provider = sessionStorage.getItem(PROVIDER_KEY);
    } catch {}
    showError(errorText(error, provider));
    router.replace(`/login?next=${encodeURIComponent(next)}`);
    // só ao chegar na tela
  }, []);

  useEffect(() => {
    if (params.get("done") !== "1") return;
    (async () => {
      const r = await loadMe();
      if (!r.ok) {
        showError(FAILED);
        return setPhase("buttons");
      }
      rememberAccount(r.data);
      if (r.data.handle) {
        navigateStart();
        return router.replace(next);
      }
      const sug = await api<Suggestion>("/api/me/handle?suggest=1");
      setSuggestion(sug.ok ? sug.data : null);
      setMe(r.data);
      setPhase("step");
    })();
    // só ao chegar na tela
  }, []);

  async function go(provider: Provider) {
    if (busy) return; // no double click
    setBusy(provider);
    try {
      sessionStorage.setItem(PROVIDER_KEY, provider);
    } catch {}
    try {
      // volta para esta tela (?done=1), que decide: segue para `next` ou mostra o passo 2 (escolher o @)
      await signIn(provider, { redirectTo: `/login?done=1&next=${encodeURIComponent(next)}` });
    } catch {
      setBusy(null);
      showError(FAILED);
    }
  }

  return (
    <main className={`grid min-h-screen min-[801px]:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]`}>
      {/* Brand panel */}
      <section
        aria-labelledby="hero-title"
        className={`relative flex flex-col justify-between gap-7 overflow-hidden bg-grape px-6 pt-7 pb-8 text-paper min-[801px]:min-h-screen min-[801px]:gap-0 min-[801px]:p-[clamp(32px,6vw,72px)]`}
      >
        <Logo light className="w-fit rounded leading-[1.2] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-lime" />
        <div className="relative z-10">
          <h1 id="hero-title" className={`mb-[18px] max-w-[14ch] font-display text-[34px] leading-[1.02] font-extrabold tracking-tight min-[801px]:text-[clamp(36px,4.4vw,56px)]`}>
            Jogue o desafio de anime de hoje.
          </h1>
          <p className={`max-w-[40ch] text-base leading-normal text-on-grape min-[801px]:text-lg`}>
            Entre para adicionar amigos e desafiá-los.
          </p>
        </div>
        <ol className={`relative z-10 grid gap-2.5 min-[801px]:mt-10 min-[801px]:gap-3.5`}>
          {PERKS.map((perk, i) => (
            <li key={perk} className={`flex items-center gap-3.5 text-[15px] font-semibold min-[801px]:text-base`}>
              <span className="grid size-7 flex-none place-items-center rounded-full bg-lime text-sm font-bold text-ink" aria-hidden="true">
                {i + 1}
              </span>
              {perk}
            </li>
          ))}
        </ol>
        {/* subtle brand texture */}
        <span
          className={`pointer-events-none absolute right-[-2%] bottom-[-6%] font-kana text-[180px] leading-none font-black text-paper opacity-[0.07] select-none min-[801px]:text-[clamp(160px,22vw,320px)]`}
          aria-hidden="true"
        >
          アニメ
        </span>
      </section>

      {/* Sign-in */}
      <section
        aria-labelledby={phase === "buttons" ? "auth-title" : undefined}
        aria-label={phase === "buttons" ? undefined : "Escolha seu username"}
        className={`grid place-items-center px-5 pt-9 pb-12 min-[801px]:px-6 min-[801px]:py-[clamp(32px,5vw,64px)]`}
      >
        {phase === "checking" && (
          <Loading />
        )}
        {phase === "step" && me && (
          // o passo 2 entra deslizando no lugar dos botões (animate-slide-in do projeto; parado com movimento reduzido)
          <div className="w-full max-w-[420px] animate-slide-in">
            <HandleStep
              me={me}
              step
              initial={suggestion}
              onSaved={(handle) => {
                rememberAccount({ handle });
                navigateStart();
                router.replace(next);
              }}
              onLater={() => {
                navigateStart();
                router.replace(next);
              }}
            />
          </div>
        )}
        <div className={`w-full max-w-[380px] ${phase === "buttons" ? "" : "hidden"}`}>
          <h2 id="auth-title" className={`mb-2 font-display text-[28px] leading-[1.2] font-extrabold tracking-tight text-ink min-[801px]:text-[32px]`}>
            Entrar
          </h2>
          <p className="mb-7 text-base leading-normal text-muted">Seus duelos ficam na sua conta.</p>

          {(!ready.google || !ready.discord) && (
            <p className="mb-3 text-sm text-muted" role="status">
              {!ready.google && !ready.discord ? "Entrar ainda não está disponível." : `Entrar com ${ready.google ? "Discord" : "Google"} ainda não está disponível.`}
            </p>
          )}
          {/* duelos jogados sem conta não entram na conta (14-duelos-na-conta-e-paginacao.md): só um aviso, sem confirmar nada */}
          {localDuels && (
            // caixinha separada do subtítulo (não é o mesmo bloco de texto): fundo track, ícone de informação em grape
            <p className="mt-1 mb-7 flex items-start gap-2.5 rounded-xl bg-track px-3 py-2.5 text-[13px] leading-snug font-semibold text-ink">
              <Icon icon={faCircleInfo} className="mt-0.5 shrink-0 text-sm text-grape" aria-hidden="true" />
              Duelos jogados sem conta ficam só neste navegador.
            </p>
          )}

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => go("google")}
              disabled={!!busy || !ready.google}
              aria-busy={busy === "google"}
              className={BTN_GOOGLE}
            >
              {busy === "google" ? <Spinner /> : <GoogleLogo />}
              Continuar com Google
            </button>
            <button
              type="button"
              onClick={() => go("discord")}
              disabled={!!busy || !ready.discord}
              aria-busy={busy === "discord"}
              className={BTN_DISCORD}
            >
              {busy === "discord" ? <Spinner /> : <DiscordLogo />}
              Continuar com Discord
            </button>
          </div>

          <p className="mt-[18px] text-center text-[13px] leading-normal text-muted">
            Ao continuar, você concorda com os{" "}
            <Link href="/terms" className={`${LINK} whitespace-nowrap`}>
              Termos
            </Link>{" "}
            e a{" "}
            <Link href="/privacy" className={`${LINK} whitespace-nowrap`}>
              Política de Privacidade
            </Link>
            .
          </p>

          <div className="mt-7 mb-6 h-px bg-mist" aria-hidden="true" />
          {/* área clicável só sobre o texto (não a largura toda) */}
          <p className="text-center text-base">
            <Link href={next} className={`${LINK} inline-block py-3`}>
              Continuar jogando sem conta
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
