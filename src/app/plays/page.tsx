import { notFound } from "next/navigation";
import { createClient } from "redis";
import AnimeCatalog from "@/components/AnimeCatalog";
import InternalFlag from "@/components/InternalFlag";
import PlaysChart from "@/components/PlaysChart";
import PlaysDays, { type DaySummary } from "@/components/PlaysDays";
import PlaysDifficulty from "@/components/PlaysDifficulty";
import PlaysHigherLower from "@/components/PlaysHigherLower";
import PlaysKpis from "@/components/PlaysKpis";
import PlaysModes from "@/components/PlaysModes";
import PlaysPixel, { type PixelStats } from "@/components/PlaysPixel";
import PlaysBotLog from "@/components/PlaysBotLog";
import PlaysBotStatus, { BOT_ENV, botChecks } from "@/components/PlaysBotStatus";
import PlaysXPosts from "@/components/PlaysXPosts";
import { botKey, LOG_KEY, LOG_MAX, type BotLog } from "@/lib/xbot";
import { dailyPosts } from "@/lib/xposts";
import { EPOCH_UTC, dailyNumber, type GameMode } from "@/lib/game";
import { MODES, PANEL, date, num, pct, total, visits, type Counts } from "@/lib/plays";

const DAYS = 30;

/** Períodos do filtro; sem `days` = desde o desafio #1. */
const PERIODS: { id: string; label: string; days?: number }[] = [
  { id: "1", label: "Hoje", days: 1 },
  { id: "7", label: "7 dias", days: 7 },
  { id: "30", label: "30 dias", days: 30 },
  { id: "all", label: "Tudo" },
];

const DEVICES = [
  { id: "mobile", label: "Celular", dot: "bg-grape" },
  { id: "desktop", label: "PC", dot: "bg-lavender" },
];

/**
 * O que o Meta recebeu do pixel desde o dia `from` (API de estatísticas do pixel), somado por evento.
 * null = sem NEXT_PUBLIC_META_PIXEL_ID/META_ACCESS_TOKEN; string = erro da API.
 * ponytail: lê uma página só (1000 horas ≈ 41 dias); seguir paging.next se "Tudo" passar disso.
 */
async function pixelStats(from: number): Promise<PixelStats> {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_ACCESS_TOKEN;
  if (!id || !token) return null;
  try {
    const start = Math.floor((EPOCH_UTC + (from - 1) * 86_400_000) / 1000);
    const res = await fetch(
      `https://graph.facebook.com/v27.0/${id}/stats?aggregation=event&start_time=${start}&end_time=${Math.floor(Date.now() / 1000)}&limit=1000`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    const json = await res.json();
    if (!res.ok) return String(json?.error?.message ?? `erro ${res.status}`);
    const out: Record<string, number> = {};
    for (const hour of json.data ?? []) for (const e of hour.data ?? []) out[e.value] = (out[e.value] ?? 0) + Number(e.count);
    return out;
  } catch (e) {
    return String(e);
  }
}

/** Visitas por aparelho no período: a barra divide celular × PC; embaixo, o funil de cada um (visitas · começaram · terminaram). */
function DeviceCard({ c, when }: { c: Counts; when: string }) {
  const all = visits(c);
  return (
    <section className={PANEL}>
      <h2 className="font-display text-xl font-extrabold">Aparelho · {when}</h2>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-track" aria-hidden="true">
        {DEVICES.map((d) => (
          <span key={d.id} className={d.dot} style={{ width: `${all ? (100 * num(c, `visit:${d.id}`)) / all : 0}%` }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {DEVICES.map((d) => (
          <div key={d.id} className="rounded-xl bg-track px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-bold">
              <span className={`size-2.5 rounded-sm ${d.dot}`} aria-hidden="true" />
              {d.label} · {pct(num(c, `visit:${d.id}`), all)}
            </p>
            {/* visitas contam uma vez por dia por navegador; começados e terminados são jogos (até 3 por pessoa) */}
            <p className="mt-1 text-xs leading-snug text-muted">
              {num(c, `visit:${d.id}`)} visitas · {num(c, `start:${d.id}`)} começaram · {num(c, `done:${d.id}`)} terminaram
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// Painel de jogadores (contadores gravados por api/played).
// Abrir /plays?key=<PLAYS_KEY> — sem a chave certa dá 404.
// No `next dev` (NODE_ENV=development) abre direto em localhost:3000/plays, sem a chave: em produção
// (next build / Vercel) NODE_ENV é sempre "production", então lá a chave continua obrigatória.
export default async function PlaysPage({ searchParams }: { searchParams: Promise<{ key?: string; period?: string }> }) {
  const { key, period } = await searchParams;
  const local = process.env.NODE_ENV === "development";
  if (!local && (!process.env.PLAYS_KEY || key !== process.env.PLAYS_KEY)) notFound();

  const today = dailyNumber();
  // Intervalo contínuo: dia sem ninguém aparece zerado, em vez de sumir da lista.
  // Filtro de período (?period=): os cards somam os N dias mais recentes; gráfico e tabela mostram pelo menos 30.
  const chosen = PERIODS.find((p) => p.id === period) ?? PERIODS[0];
  const n = Math.min(today, chosen.days ?? today);
  const days = Array.from({ length: Math.min(today, Math.max(n, DAYS)) }, (_, i) => today - i);
  const redis = await createClient({ url: process.env.KV_REDIS_URL }).connect();
  const [pixel, bot, botYesterday, botLog, ...counts] = await Promise.all([
    pixelStats(today - n + 1),
    redis.hGetAll(botKey(today)),
    redis.hGetAll(botKey(today - 1)),
    redis.lRange(LOG_KEY, 0, LOG_MAX - 1),
    ...days.map((d) => redis.hGetAll(`played:${d}`)),
  ]);
  await redis.quit();
  const rows = days.map((day, i) => ({ day, c: counts[i] as Counts }));
  // posts do bot: o texto do Claude quando já escrito, senão o padrão; `posted` = id do post publicado
  const logs = botLog.flatMap((l) => {
    try {
      return [JSON.parse(l) as BotLog];
    } catch {
      return []; // linha estragada não derruba o painel
    }
  });
  // só se cada variável existe (o valor nunca sai do servidor); XBOT_ENABLED vale só com "1"
  const botEnv = Object.fromEntries(BOT_ENV.map((k) => [k, k === "XBOT_ENABLED" ? process.env[k] === "1" : !!process.env[k]]));
  const xPosts = dailyPosts(today).map((p) => ({ ...p, text: bot[p.slot] ?? p.text, posted: bot[`id:${p.slot}`] }));

  const now = total(rows.slice(0, n).map((r) => r.c)); // soma do período escolhido
  const title = n === 1 ? "Hoje" : chosen.days ? `Últimos ${n} dias` : "Todos os dias";
  const when = title.toLowerCase();
  // Tabela "Dia a dia": resumo de cada dia, já sem os contadores crus (vai para um client component).
  const summary: DaySummary[] = rows.map(({ day, c }) => ({
    day,
    date: date(day),
    mobile: num(c, "visit:mobile"),
    desktop: num(c, "visit:desktop"),
    people: num(c, "people"),
    modes: Object.fromEntries(
      MODES.map((m) => [m, { start: num(c, `${m}:start`), done: num(c, m), won: num(c, `${m}:won`) }]),
    ) as Record<GameMode, { start: number; done: number; won: number }>,
    follow: num(c, "click:follow"),
    support: { end: num(c, "click:support:end"), home: num(c, "click:support:home"), menu: num(c, "click:support:menu") },
  }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 text-ink md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">Painel de jogadores</h1>
          <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold">
            Hoje · #{today} · {date(today)}
          </span>
        </div>
        {/* filtro segmentado, como o do arquivo */}
        <nav aria-label="Período" className="flex gap-1.5 rounded-full bg-white p-1.5 shadow-pop">
          {PERIODS.map((p) => (
            <a
              key={p.id}
              href={`/plays?${key ? `key=${encodeURIComponent(key)}&` : ""}period=${p.id}`}
              aria-current={p === chosen ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape ${
                p === chosen ? "bg-grape text-white" : "text-ink hover:bg-track"
              }`}
            >
              {p.label}
            </a>
          ))}
        </nav>
      </div>
      <InternalFlag />

      <PlaysKpis now={now} n={n} rows={rows} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <PlaysChart rows={rows} />
        <div className="flex flex-col gap-4">
          <DeviceCard c={now} when={when} />

        </div>
      </div>

      <PlaysPixel pixel={pixel} now={now} />

      <h2 className="mt-8 font-display text-2xl font-extrabold">
        {title} por modo
        {n === 1 && (
          <>
            {" "}
            · desafio #{today} <span className="ml-2 font-sans text-sm font-normal text-muted">O mesmo sorteio para todo mundo</span>
          </>
        )}
      </h2>
      {/* o anime do desafio só aparece no período "Hoje": nos outros a soma junta vários dias */}
      <PlaysModes c={now} day={n === 1 ? today : undefined} />

      <PlaysHigherLower now={now} rows={rows.slice(0, n)} when={when} />

      <section className={`${PANEL} mt-4`}>
        {/* em "Tudo", a tabela traz todos os dias desde o #1 */}
        <PlaysDays days={summary} />
      </section>

      {/* bot do X: o que sai hoje, se está tudo funcionando e o registro de cada execução */}
      <PlaysXPosts posts={xPosts} />
      <PlaysBotStatus checks={botChecks(botEnv, bot, botYesterday, logs, today, Date.now())} />
      <PlaysBotLog logs={logs} />

      <section className={`${PANEL} mt-4`}>
        <h2 className="font-display text-xl font-extrabold">Dificuldade por anime · {when}</h2>
        <p className="mt-0.5 text-xs text-muted">
          o anime de cada desafio, com a taxa de acerto e os votos de “Como foi o desafio de hoje?”; os mais votados como difíceis vêm primeiro
        </p>
        <PlaysDifficulty rows={rows.slice(0, n)} />
      </section>

      <AnimeCatalog />
    </main>
  );
}
