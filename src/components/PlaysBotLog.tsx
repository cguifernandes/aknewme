import { X_URL } from "@/lib/site";
import type { BotLog, LogLevel } from "@/lib/xbot";

const LEVEL: Record<LogLevel, { label: string; color: string }> = {
  info: { label: "info", color: "text-lavender" },
  ok: { label: "ok", color: "text-lime" },
  warn: { label: "aviso", color: "text-sun" },
  error: { label: "erro", color: "text-blush" },
};
const SLOT: Record<string, string> = { manha: "manhã", tarde: "tarde", noite: "noite" };

const time = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Link do post no lugar de "x.com/i/status/<id>" (o registro guarda só o id). */
function Message({ msg }: { msg: string }) {
  const parts = msg.split(/(x\.com\/i\/status\/\d+)/);
  return parts.map((p, i) =>
    i % 2 ? (
      <a key={i} href={`${X_URL}/status/${p.split("/").pop()}`} target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2">
        Ver post
      </a>
    ) : (
      p
    ),
  );
}

/** Console do bot do X (api/xbot): cada linha que ele registrou, a mais nova em cima, em horário de Brasília. */
export default function PlaysBotLog({ logs }: { logs: BotLog[] }) {
  const errors = logs.filter((l) => l.level === "error").length;
  return (
    <section className="mt-4 rounded-3xl bg-ink p-5 text-white shadow-pop sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-extrabold">Console do bot do X</h2>
        <p className="text-xs text-lavender">
          últimas {logs.length} linhas · {errors} {errors === 1 ? "erro" : "erros"} · horário de Brasília
        </p>
      </div>
      {logs.length ? (
        <ol className="mt-3 max-h-96 overflow-y-auto rounded-2xl bg-grape-ink p-3 font-mono text-xs leading-relaxed">
          {logs.map((l, i) => (
            <li key={i} className="wrap-break-word">
              <span className="text-lavender/70">{time.format(l.t)}</span>{" "}
              <span className="text-lavender">
                #{l.day} {SLOT[l.slot] ?? l.slot}
              </span>{" "}
              <span className={`font-bold ${LEVEL[l.level].color}`}>[{LEVEL[l.level].label}]</span> <Message msg={l.msg} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-lavender">
          Nada ainda: o bot registra aqui cada vez que a Vercel chama ele (12h, 17h e 20h)
        </p>
      )}
    </section>
  );
}
