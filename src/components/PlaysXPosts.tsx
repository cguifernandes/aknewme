import { PANEL } from "@/lib/plays";
import { X_URL } from "@/lib/site";
import type { XPost } from "@/lib/xposts";
import { slotTime } from "./PlaysBotStatus";

/** O que o bot (api/xbot) publica hoje: o texto do Claude (ou o padrão, antes dele escrever) e o link quando sair. */
export default function PlaysXPosts({ posts }: { posts: (XPost & { posted?: string })[] }) {
  return (
    <section className={`${PANEL} mt-4`}>
      <h2 className="font-display text-xl font-extrabold">Posts do bot hoje</h2>
      <p className="mt-0.5 text-xs text-muted">
        manhã adivinha (e responde o de ontem com a resposta), tarde rende discussão, noite leva o link do site na resposta
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {posts.map((p) => (
          <div key={p.slot} className="flex flex-col rounded-xl bg-track p-4">
            <p className="text-xs font-bold text-muted">
              {p.when} · {slotTime(p.slot)} · {p.kind}
            </p>
            <p className="mt-2 flex-1 text-sm whitespace-pre-line">{p.text}</p>
            {p.answer && <p className="mt-2 text-xs text-muted">Resposta (o bot publica amanhã): {p.answer}</p>}
            {p.posted ? (
              <a
                href={`${X_URL}/status/${p.posted}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-sm font-bold text-grape underline underline-offset-2"
              >
                Publicado ↗
              </a>
            ) : (
              <p className="mt-3 text-sm font-bold text-muted">Sai às {slotTime(p.slot)}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
