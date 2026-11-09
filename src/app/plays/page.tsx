import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "redis";
import { EPOCH_UTC, MODE_LABEL, dailyNumber, type GameMode } from "@/lib/game";
import { X_POST_KEY, X_POST_URL } from "@/lib/site";
import { DIST, rank } from "@/lib/stats";

const MODES = Object.keys(MODE_LABEL) as GameMode[];
const DAYS = 30;

type Counts = Record<string, string>;
const num = (c: Counts, k: string) => Number(c[k] ?? 0);
const sum = (c: Counts, suffix = "") => MODES.reduce((t, m) => t + num(c, m + suffix), 0);
/** Soma os contadores de vários dias num só (filtro de período). */
const total = (list: Counts[]) => {
  const t: Counts = {};
  for (const c of list) for (const k in c) t[k] = String(num(t, k) + num(c, k));
  return t;
};
/** Períodos do filtro; sem `days` = desde o desafio #1. */
const PERIODS: { id: string; label: string; days?: number }[] = [
  { id: "1", label: "Hoje", days: 1 },
  { id: "7", label: "7 dias", days: 7 },
  { id: "30", label: "30 dias", days: 30 },
  { id: "all", label: "Tudo" },
];
const visits = (c: Counts) => num(c, "visit:mobile") + num(c, "visit:desktop");
/** a de b em %; "—" sem base (ex.: dias antes do contador de "começaram"). */
const pct = (a: number, b: number) => (b > 0 ? `${Math.min(100, Math.round((100 * a) / b))}%` : "—");
const date = (day: number) =>
  new Date(EPOCH_UTC + (day - 1) * 86_400_000).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });

/** Eventos do pixel que serão mostrados, com o contador do painel que mede a mesma coisa. */
const PIXEL_EVENTS = [
  { event: "PageView", ours: null },
  { event: "JogoIniciado", ours: ":start" },
  { event: "JogoConcluido", ours: "" },
];

/**
 * O que o Meta recebeu do pixel desde o dia `from` (API de estatísticas do pixel), somado por evento.
 * null = sem NEXT_PUBLIC_META_PIXEL_ID/META_ACCESS_TOKEN; string = erro da API.
 * ponytail: lê uma página só (1000 horas ≈ 41 dias); seguir paging.next se "Tudo" passar disso.
 */
async function pixelStats(from: number): Promise<Record<string, number> | string | null> {
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

/** DEBUG temporário: de quem é o token, quais permissões ele tem e se enxerga o pixel. Remover junto com a linha do token. */
async function metaDebug(): Promise<string[]> {
  const ask = async (label: string, path: string) => {
    try {
      const res = await fetch(`https://graph.facebook.com/v27.0/${path}`, {
        headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` },
        cache: "no-store",
      });
      const json = await res.json();
      return `${label}: ${JSON.stringify(json.error ?? json.data ?? json)}`;
    } catch (e) {
      return `${label}: ${e}`;
    }
  };
  return Promise.all([
    ask("dono do token", "me?fields=id,name"),
    ask("permissões", "me/permissions"),
    ask("pixel", `${process.env.NEXT_PUBLIC_META_PIXEL_ID}?fields=id,name`),
    ask("contas de anúncios e pixels que o token enxerga", "me/adaccounts?fields=id,name,adspixels{id,name}"),
    ask("stats sem período", `${process.env.NEXT_PUBLIC_META_PIXEL_ID}/stats?aggregation=event`),
    ask("stats sem agregação", `${process.env.NEXT_PUBLIC_META_PIXEL_ID}/stats`),
  ]);
}

/** Troca o post do X em destaque (XPostAlert lê de /api/xpost). Vazio = volta ao link do código (site.ts). */
async function setPost(form: FormData) {
  "use server";
  if (!process.env.PLAYS_KEY || form.get("key") !== process.env.PLAYS_KEY) return;
  const url = String(form.get("url") ?? "")
    .trim()
    .replace(/^https:\/\/(www\.)?twitter\.com\//, "https://x.com/")
    .split("?")[0]; // sem os parâmetros de compartilhar (?s=20)
  if (url && !/^https:\/\/x\.com\/\w+\/status\/\d+$/.test(url)) return;
  const redis = await createClient({ url: process.env.KV_REDIS_URL }).connect();
  await (url ? redis.set(X_POST_KEY, url) : redis.del(X_POST_KEY));
  await redis.quit();
  revalidatePath("/plays");
}

function Card({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-pop">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 font-display text-4xl font-extrabold text-ink">{value}</p>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}

/** Barra horizontal: `value` de `max`. */
function Bar({ value, max, className = "bg-grape" }: { value: number; max: number; className?: string }) {
  return (
    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-track">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${max > 0 ? Math.min(100, (100 * value) / max) : 0}%` }} />
    </div>
  );
}

type Step = { label: string; value: number; className: string };

/** Etapas em barras, todas na escala da maior. */
function Funnel({ steps }: { steps: Step[] }) {
  const max = Math.max(...steps.map((s) => s.value));
  return (
    <div className="mt-4 space-y-2">
      {steps.map((s) => (
        <div key={s.label} className="flex items-center gap-3 text-sm">
          <span className="w-24 text-muted">{s.label}</span>
          <Bar value={s.value} max={max} className={s.className} />
          <span className="w-8 text-right font-bold tabular-nums">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

const DEVICES = [
  { id: "mobile", label: "Celular" },
  { id: "desktop", label: "PC" },
];

/** Visitas → jogos começados → terminados de um aparelho no dia: mostra onde cada público desiste. */
function DeviceCard({ id, label, c, share }: { id: string; label: string; c: Counts; share: string }) {
  const visits = num(c, `visit:${id}`);
  const start = num(c, `start:${id}`);
  const done = num(c, `done:${id}`);
  return (
    <div className="rounded-2xl bg-white p-5 shadow-pop">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl font-extrabold">
          {label} {visits > 0 && <span className="text-base text-muted">{share} das visitas</span>}
        </h3>
        <p className="text-sm text-muted">
          começou <strong className="text-ink">{pct(start, visits)}</strong> · terminou <strong className="text-ink">{pct(done, start)}</strong>
        </p>
      </div>
      <Funnel
        steps={[
          { label: "Visitas", value: visits, className: "bg-lavender" },
          { label: "Começados", value: start, className: "bg-grape" },
          { label: "Terminados", value: done, className: "bg-lime" },
        ]}
      />
    </div>
  );
}

/** Funil do modo no dia (começaram → terminaram → acertaram) + distribuição das notas. */
function ModeCard({ mode, c }: { mode: GameMode; c: Counts }) {
  const done = num(c, mode);
  const start = Math.max(num(c, `${mode}:start`), done); // dias antigos não têm "começaram"
  const won = num(c, `${mode}:won`);
  const steps = [
    { label: "Começaram", value: start, className: "bg-lavender" },
    { label: "Terminaram", value: done, className: "bg-grape" },
    { label: "Acertaram", value: won, className: "bg-lime" },
  ];
  const dist = DIST[mode].buckets.map((b) => ({ label: b.label, count: num(c, `${mode}:r${rank(mode, b.score)}`) }));
  const top = Math.max(1, ...dist.map((d) => d.count));
  return (
    <div className="rounded-2xl bg-white p-5 shadow-pop">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl font-extrabold">{MODE_LABEL[mode]}</h3>
        <p className="text-sm text-muted">
          conclusão <strong className="text-ink">{pct(done, num(c, `${mode}:start`))}</strong> · acerto{" "}
          <strong className="text-ink">{pct(won, done)}</strong>
        </p>
      </div>
      <Funnel steps={steps} />
      <p className="mt-5 text-sm font-semibold text-muted">{DIST[mode].title}</p>
      <div className="mt-2 flex h-20 items-end gap-1.5">
        {dist.map((d) => (
          <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs font-bold tabular-nums">{d.count || ""}</span>
            <div className="w-full rounded-t-md bg-grape" style={{ height: `${(60 * d.count) / top}%`, minHeight: 2 }} />
            <span className="text-xs text-muted">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Painel de jogadores (contadores gravados por api/played).
// Abrir /plays?key=<PLAYS_KEY> — sem a chave certa dá 404.
export default async function PlaysPage({ searchParams }: { searchParams: Promise<{ key?: string; period?: string }> }) {
  const { key, period } = await searchParams;
  if (!process.env.PLAYS_KEY || key !== process.env.PLAYS_KEY) notFound();

  const today = dailyNumber();
  // Intervalo contínuo: dia sem ninguém aparece zerado, em vez de sumir da lista.
  // Filtro de período (?period=): os cards somam os N dias mais recentes; a tabela mostra pelo menos 30.
  const chosen = PERIODS.find((p) => p.id === period) ?? PERIODS[0];
  const n = Math.min(today, chosen.days ?? today);
  const days = Array.from({ length: Math.min(today, Math.max(n, DAYS)) }, (_, i) => today - i);
  const redis = await createClient({ url: process.env.KV_REDIS_URL }).connect();
  const [pixel, post, ...counts] = await Promise.all([
    pixelStats(today - n + 1),
    redis.get(X_POST_KEY),
    ...days.map((d) => redis.hGetAll(`played:${d}`)),
  ]);
  await redis.quit();
  const rows = days.map((day, i) => ({ day, c: counts[i] as Counts }));

  const now = total(rows.slice(0, n).map((r) => r.c)); // soma do período escolhido
  const before = rows[1]?.c ?? {};
  const people = rows.map((r) => num(r.c, "people"));
  const month = people.slice(0, DAYS);
  const monthTotal = month.reduce((a, b) => a + b, 0);
  const peak = Math.max(...people);
  const monthPeak = Math.max(...month);
  const diff = num(now, "people") - num(before, "people");
  const title = n === 1 ? "Hoje" : chosen.days ? `Últimos ${n} dias` : "Todos os dias";
  const when = title.toLowerCase();
  // Tabela: até 30 dias, contínua (dia vazio aparece zerado); em "Tudo", só os dias com algum dado.
  const table = n > DAYS ? rows.filter(({ c }) => Object.keys(c).length > 0) : rows;
  const postUrl = post ?? X_POST_URL;
  const th = "py-2 pr-4 font-semibold";

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-ink md:px-10">
      {/* selo ao lado do título: o canto direito é do aviso do X (XPostAlert) */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Painel de jogadores</h1>
        <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold">
          Hoje · #{today} · {date(today)}
        </span>
      </div>

      <nav aria-label="Período" className="mt-6 flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <a
            key={p.id}
            href={`/plays?key=${encodeURIComponent(key)}&period=${p.id}`}
            aria-current={p === chosen ? "page" : undefined}
            className={`rounded-full px-5 py-2 text-sm font-bold shadow-pop transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape ${
              p === chosen ? "bg-grape text-white" : "bg-white text-ink"
            }`}
          >
            {p.label}
          </a>
        ))}
      </nav>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label={`Jogaram · ${when}`}
          value={num(now, "people")}
          sub={
            n === 1
              ? `de ${visits(now)} visitas · ${diff > 0 ? "+" : ""}${diff} em relação a ontem (${num(before, "people")})`
              : `de ${visits(now)} visitas · média ${(num(now, "people") / n).toFixed(1)}/dia`
          }
        />
        <Card
          label={`Conclusão · ${when}`}
          value={pct(sum(now), sum(now, ":start"))}
          sub={`${sum(now)} jogos terminados de ${sum(now, ":start")} começados`}
        />
        <Card label={`Acerto · ${when}`} value={pct(sum(now, ":won"), sum(now))} sub={`${sum(now, ":won")} acertos em ${sum(now)} jogos`} />
        <Card
          label={`Últimos ${month.length} dias`}
          value={monthTotal}
          sub={`média ${(monthTotal / month.length).toFixed(1)}/dia · pico ${monthPeak} em ${date(rows[month.indexOf(monthPeak)].day)}`}
        />
      </section>

      <section className="mt-6 rounded-2xl bg-grape p-5 text-white shadow-pop-lg">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-extrabold">Post do X em destaque</h2>
          <p className="text-sm text-lavender">
            {when}: <strong className="text-white">{num(now, "click:post")}</strong> cliques no post ·{" "}
            <strong className="text-white">{num(now, "click:follow")}</strong> em seguir
          </p>
        </div>
        <p className="mt-1 text-sm text-lavender">
          Atual:{" "}
          {postUrl ? (
            <a href={postUrl} target="_blank" rel="noopener noreferrer" className="font-semibold break-all text-white underline underline-offset-2">
              {postUrl}
            </a>
          ) : (
            "nenhum"
          )}
          {!post && postUrl && " (link do código)"}
        </p>
        <form action={setPost} className="mt-4 flex flex-wrap gap-3">
          <input type="hidden" name="key" value={key} />
          <input
            name="url"
            type="url"
            placeholder="https://x.com/aknewmee/status/..."
            aria-label="Link do post novo"
            pattern="https://(www\.)?(x|twitter)\.com/\w+/status/\d+.*"
            title="Link de um post: https://x.com/usuario/status/123..."
            autoComplete="off"
            className="min-w-64 flex-1 rounded-full bg-white px-5 py-3 font-medium text-ink placeholder:text-muted/60 focus:outline-2 focus:outline-offset-2 focus:outline-lime"
          />
          <button
            type="submit"
            className="rounded-full bg-lime px-6 py-3 font-bold text-ink shadow-pop transition hover:brightness-105 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
          >
            Publicar aviso
          </button>
        </form>
        <p className="mt-2 text-xs text-lavender">
          Vale na hora, sem deploy: o aviso “Post novo no X!” reaparece para todo mundo. Enviar vazio volta ao link do código.
        </p>
      </section>

      <h2 className="mt-10 font-display text-2xl font-extrabold">{title} no Pixel do Meta</h2>
      <p className="mt-1 text-sm text-muted">
        {pixel === null
          ? "defina NEXT_PUBLIC_META_PIXEL_ID e META_ACCESS_TOKEN para ver o que o Meta recebeu"
          : typeof pixel === "string"
            ? `a API do Meta respondeu com erro: ${pixel}`
            : "eventos que chegaram ao Meta (dias em UTC); adblock e arquivo ficam de fora, então é normal dar menos que o painel"}
      </p>
      {/* DEBUG temporário: qual token está valendo neste deploy. Remover depois de acertar a permissão. */}
      <p className="mt-1 font-mono text-sm text-muted">
        META_ACCESS_TOKEN:{" "}
        {process.env.META_ACCESS_TOKEN
          ? `${process.env.META_ACCESS_TOKEN.slice(0, 8)}… (${process.env.META_ACCESS_TOKEN.length} caracteres)`
          : "não definido"}
      </p>
      {typeof pixel === "string" &&
        (await metaDebug()).map((line) => (
          <p key={line} className="mt-1 font-mono text-sm break-all text-muted">
            {line}
          </p>
        ))}
      {pixel !== null && typeof pixel !== "string" && (
        <section className="mt-4 grid gap-4 sm:grid-cols-3">
          {PIXEL_EVENTS.map(({ event, ours }) => (
            <Card
              key={event}
              label={event}
              value={pixel[event] ?? 0}
              sub={ours === null ? "carregamentos de página, fora o /plays" : `${pct(pixel[event] ?? 0, sum(now, ours))} dos ${sum(now, ours)} do painel`}
            />
          ))}
        </section>
      )}

      <h2 className="mt-10 font-display text-2xl font-extrabold">{title} por aparelho</h2>
      <p className="mt-1 text-sm text-muted">visitas contam uma vez por dia por navegador; começados e terminados são jogos (até 3 por pessoa)</p>
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        {DEVICES.map((d) => (
          <DeviceCard key={d.id} {...d} c={now} share={pct(num(now, `visit:${d.id}`), visits(now))} />
        ))}
      </section>

      <h2 className="mt-10 font-display text-2xl font-extrabold">{title} por modo</h2>
      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        {MODES.map((m) => (
          <ModeCard key={m} mode={m} c={now} />
        ))}
      </section>

      <h2 className="mt-10 font-display text-2xl font-extrabold">Dia a dia</h2>
      <p className="mt-1 text-sm text-muted">por modo: começaram→terminaram · % de acerto</p>
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white p-5 shadow-pop">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="border-b-2 border-lavender text-muted">
            <tr>
              <th className={th}>Dia</th>
              <th className={th}>Visitas</th>
              <th className={`${th} w-1/5`}>Jogaram</th>
              {MODES.map((m) => (
                <th key={m} className={th}>
                  {MODE_LABEL[m]}
                </th>
              ))}
              <th className={th}>Seguir</th>
              <th className={th}>Post</th>
            </tr>
          </thead>
          <tbody>
            {table.map(({ day, c }) => (
              <tr key={day} className={`border-b border-track last:border-0 ${num(c, "people") || sum(c, ":start") || visits(c) ? "" : "text-muted"}`}>
                <td className="py-2 pr-4 font-semibold tabular-nums">
                  #{day} · {date(day)}
                </td>
                <td className="py-2 pr-4 tabular-nums">
                  {visits(c)}{" "}
                  <span className="text-muted">
                    · cel {num(c, "visit:mobile")} · pc {num(c, "visit:desktop")}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-right font-bold tabular-nums">{num(c, "people")}</span>
                    <Bar value={num(c, "people")} max={peak} />
                  </div>
                </td>
                {MODES.map((m) => (
                  <td key={m} className="py-2 pr-4 tabular-nums">
                    {/* dias antes do contador de "começaram": só os que terminaram */}
                    {num(c, `${m}:start`) >= num(c, m) && `${num(c, `${m}:start`)}→`}
                    {num(c, m)} <span className="text-muted">· {pct(num(c, `${m}:won`), num(c, m))}</span>
                  </td>
                ))}
                <td className="py-2 pr-4 tabular-nums">{num(c, "click:follow")}</td>
                <td className="py-2 pr-4 tabular-nums">{num(c, "click:post")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
