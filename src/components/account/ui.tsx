import type { ReactNode } from "react";

// Peças das telas de conta no estilo C (specs/login-duelo/estilos/c-minimo.html): fundo paper, texto ink,
// acento lime, botões de 50 px (mais que os 44 px mínimos) com foco visível. Só tokens do tema.

export const FOCUS = "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-grape";
const BTN = `flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl border-2 px-4 text-base font-bold disabled:opacity-60 ${FOCUS}`;
export const BTN_PRIMARY = `${BTN} shine-lime border-ink bg-ink text-white`;
export const BTN_SECONDARY = `${BTN} border-ink bg-paper text-ink hover:bg-track`;
/** "Continuar sem entrar": mesmo tamanho dos botões de login (U2), borda clara. */
export const BTN_QUIET = `${BTN} border-track bg-paper text-ink hover:border-lavender`;
// Botões de login (Google e Discord): a pílula do projeto nas cores de cada marca. Sem sweep (pedido do dono, 26/11):
// no hover a cor só escurece um pouco (tokens google-hover e discord-deep).
const BTN_PROVIDER = `flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border-2 px-4 text-base font-bold transition-colors active:translate-y-0.5 disabled:opacity-60 ${FOCUS}`;
export const BTN_GOOGLE = `${BTN_PROVIDER} border-google-line bg-paper text-google-ink not-disabled:hover:bg-google-hover`;
export const BTN_DISCORD = `${BTN_PROVIDER} border-discord bg-discord text-paper not-disabled:hover:border-discord-deep not-disabled:hover:bg-discord-deep`;
export const BTN_SMALL = `inline-flex min-h-11 items-center justify-center rounded-lg border-2 px-3 text-sm font-bold disabled:opacity-60 ${FOCUS}`;
/** Link-botão do projeto: texto grape sublinhado; no hover só o texto escurece (sem fundo). */
export const LINK = `rounded font-bold text-grape underline underline-offset-4 transition-colors hover:text-grape-deep ${FOCUS}`;
export const INPUT = `min-h-[50px] w-full rounded-xl border-2 border-ink bg-paper px-4 text-base text-ink placeholder:text-muted ${FOCUS}`;

/** Página das telas de conta: coluna estreita, centrada (cabe em 375 px). */
export function Stage({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <main className={`mx-auto mt-6 w-full animate-enter ${wide ? "max-w-xl" : "max-w-[360px]"} pb-12`}>{children}</main>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3.5 inline-flex items-center gap-2 text-[13px] font-bold text-grape">
      <span className="size-2 animate-ping-lime rounded-full bg-lime" aria-hidden="true" /> {children}
    </p>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="mb-3.5 font-display text-[32px] leading-[1.08] font-extrabold tracking-tight text-ink">
      <span className="block animate-reveal">{children}</span>
    </h1>
  );
}

export const Sub = ({ children }: { children: ReactNode }) => <p className="mb-6 text-base leading-snug text-muted">{children}</p>;

/** Mensagem de erro: anunciada ao leitor de tela e com texto (nunca só cor: U3). */
export const Alert = ({ children }: { children: ReactNode }) => (
  <p role="alert" className="my-3 rounded-xl border-2 border-danger px-4 py-3 text-sm font-bold text-danger">
    {children}
  </p>
);

export const Spinner = () => (
  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
);

/** Foto do provedor (Google/Discord) ou as iniciais do handle. */
/**
 * Foto do perfil (Google/Discord) ou, sem foto, as iniciais do nome em lime (07-perfil.md): cabeçalho, painel da conta e
 * o cartão "Assim te veem nos duelos".
 */
export function ProfileAvatar({ image, name, size = 40, className = "" }: { image: string | null; name: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size };
  if (image)
    return <img src={image} alt="" referrerPolicy="no-referrer" style={style} className={`shrink-0 rounded-full bg-track object-cover ${className}`} />;
  return (
    <span style={style} className={`flex shrink-0 items-center justify-center rounded-full bg-lime font-bold text-ink ${className}`} aria-hidden="true">
      {initials(name ?? "Você")}
    </span>
  );
}

/** Iniciais da foto padrão: 1ª letra do primeiro e do último nome ("Ana Souza" → AS); nome único, as 2 primeiras letras. */
function initials(name: string): string {
  const words = name.replace(/^@/, "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2)).toUpperCase();
}

export function Avatar({ image, handle, size = 40 }: { image: string | null; handle: string | null; size?: number }) {
  const style = { width: size, height: size };
  // foto externa pequena: <img> comum, sem o otimizador do Next e sem mandar o endereço da página (no-referrer)
  if (image)
    return <img src={image} alt="" referrerPolicy="no-referrer" style={style} className="shrink-0 rounded-full bg-track object-cover" />;
  return (
    <span style={style} className="flex shrink-0 items-center justify-center rounded-full bg-lavender text-sm font-extrabold text-ink" aria-hidden="true">
      {(handle ?? "?").slice(0, 2).toUpperCase()}
    </span>
  );
}
