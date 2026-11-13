import vercel from "../../vercel.json";
import { EPOCH_UTC } from "@/lib/game";
import type { BotLog } from "@/lib/xbot";

type State = "ok" | "fail" | "wait";
export type Check = { label: string; state: State; detail: string };

const X_KEYS = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"];
export const BOT_ENV = ["ANTHROPIC_API_KEY", ...X_KEYS, "CRON_SECRET", "XBOT_ENABLED"];
const HOUR = 3_600_000;

/** Horário (UTC) de cada post, lido do próprio agendamento da Vercel: "0 15 * * *" com ?slot=manha → 15. */
const SCHEDULE = vercel.crons.map((c) => ({ slot: c.path.split("slot=")[1], hourUtc: Number(c.schedule.split(" ")[1]) }));
const LABEL: Record<string, string> = { manha: "manhã", tarde: "tarde", noite: "noite" };
const brt = (hourUtc: number) => `${(hourUtc + 21) % 24}h`; // Brasília = UTC−3
/** Horário de Brasília em que o post do `slot` sai ("12h"). */
export const slotTime = (slot: string) => brt(SCHEDULE.find((s) => s.slot === slot)?.hourUtc ?? 0);

const ago = (ms: number) => (ms < HOUR ? `${Math.max(1, Math.round(ms / 60_000))} min` : `${Math.round(ms / HOUR)}h`);

/**
 * Saúde do bot do X: chaves, publicação ligada, se rodou, se os posts do horário saíram e se houve erro.
 * `env`: quais variáveis existem (só presença, nunca o valor); `bot`/`yesterday`: hash do dia e de ontem (textos e ids);
 * `logs`: mais novo primeiro. Post de um horário só conta como atrasado 1h depois (no plano grátis a Vercel dispara
 * dentro da hora); o da noite (23h UTC) só vence no dia seguinte, então ele é conferido pelo hash de ontem.
 */
export function botChecks(
  env: Record<string, boolean>,
  bot: Record<string, string>,
  yesterday: Record<string, string>,
  logs: BotLog[],
  day: number,
  now: number,
): Check[] {
  const missingX = X_KEYS.filter((k) => !env[k]);
  const enabled = env.XBOT_ENABLED;
  const last = logs[0];
  const lastError = logs.find((l) => l.level === "error" && now - l.t < 24 * HOUR);
  const claude = logs.find((l) => l.day === day && l.msg.startsWith("Claude escreveu"));
  const start = EPOCH_UTC + (day - 1) * 24 * HOUR;
  const due = SCHEDULE.filter((s) => now >= start + (s.hourUtc + 1) * HOUR);
  const late = due.filter((s) => !bot[`id:${s.slot}`]);
  // ontem o bot publicou de dia mas não à noite: a noite falhou (ou nem rodou)
  const lastNight = SCHEDULE.at(-1)!.slot;
  const missedNight = (yesterday["id:manha"] || yesterday["id:tarde"]) && !yesterday[`id:${lastNight}`];
  const posts = [
    ...SCHEDULE.map((s) => `${LABEL[s.slot]} ${bot[`id:${s.slot}`] ? "✓" : due.includes(s) ? "✗" : `às ${brt(s.hourUtc)}`}`),
    ...(missedNight ? [`ontem à ${LABEL[lastNight]} ✗`] : []),
  ].join(" · ");
  return [
    { label: "Chave do Claude", state: env.ANTHROPIC_API_KEY ? "ok" : "fail", detail: env.ANTHROPIC_API_KEY ? "configurada" : "falta ANTHROPIC_API_KEY" },
    { label: "Chaves do X", state: missingX.length ? "fail" : "ok", detail: missingX.length ? `falta ${missingX.join(", ")}` : "as 4 configuradas" },
    { label: "Agendamento", state: env.CRON_SECRET ? "ok" : "fail", detail: env.CRON_SECRET ? "CRON_SECRET configurado" : "falta CRON_SECRET: a Vercel não consegue chamar o bot" },
    { label: "Publicação", state: enabled ? "ok" : "fail", detail: enabled ? "ligada" : "desligada (falta XBOT_ENABLED=1): só escreve os textos" },
    {
      label: "Bot rodando",
      state: !last ? "fail" : now - last.t < 26 * HOUR ? "ok" : "fail",
      detail: last ? `última execução há ${ago(now - last.t)}` : "nunca rodou",
    },
    {
      label: "Textos do Claude hoje",
      state: !claude ? (due.length ? "fail" : "wait") : claude.level === "ok" ? "ok" : "fail",
      detail: claude ? claude.msg : due.length ? "não escreveu hoje" : "escreve na primeira chamada do dia",
    },
    {
      label: "Posts de hoje",
      state: !enabled ? "wait" : late.length || missedNight ? "fail" : due.length ? "ok" : "wait",
      detail: enabled ? posts : "publicação desligada",
    },
    { label: "Erros nas últimas 24h", state: lastError ? "fail" : "ok", detail: lastError ? lastError.msg : "nenhum" },
  ];
}

const ICON: Record<State, { mark: string; color: string }> = {
  ok: { mark: "✓", color: "text-lime" },
  fail: { mark: "✗", color: "text-blush" },
  wait: { mark: "…", color: "text-lavender" },
};

/** Card de status: "100% funcionando e postando" só quando nenhuma conferência falhou. */
export default function PlaysBotStatus({ checks }: { checks: Check[] }) {
  const failed = checks.filter((c) => c.state === "fail");
  const testMode = failed.length === 1 && failed[0].label === "Publicação";
  const [title, badge] = !failed.length
    ? ["100% funcionando e postando", "bg-lime text-ink"]
    : testMode
      ? ["Modo teste: escrevendo, sem publicar", "bg-sun text-ink"]
      : [`Precisa de atenção: ${failed.length} ${failed.length === 1 ? "problema" : "problemas"}`, "bg-blush text-ink"];
  return (
    <section className="mt-4 rounded-3xl bg-ink p-5 text-white shadow-pop sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold">Status do bot do X</h2>
        <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${badge}`}>{title}</span>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {checks.map((c) => (
          <li key={c.label} className="rounded-xl bg-grape-ink px-3 py-2.5">
            <p className="text-xs font-bold">
              <span className={ICON[c.state].color} aria-hidden="true">
                {ICON[c.state].mark}
              </span>{" "}
              {c.label}
              <span className="sr-only"> ({c.state === "ok" ? "ok" : c.state === "fail" ? "com problema" : "aguardando"})</span>
            </p>
            <p className="mt-1 text-xs leading-snug wrap-break-word text-lavender">{c.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
