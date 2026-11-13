"use client";

import { useState } from "react";
import { PANEL } from "@/lib/plays";
import { intentUrl } from "@/lib/share";
import type { XPost } from "@/lib/xposts";

const BUTTON =
  "inline-flex items-center justify-center rounded-full bg-x px-4 py-2 text-sm font-bold text-white sweep-lime hover:text-ink focus-visible:text-ink active:translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grape";

/** Posts do dia para o X: cada botão abre o X com o texto pronto; o link vai como resposta do 3º post. */
export default function PlaysXPosts({ posts, reply }: { posts: XPost[]; reply: string }) {
  const [last, setLast] = useState("");
  const id = last.match(/status\/(\d+)/)?.[1];
  return (
    <section className={`${PANEL} mt-4`}>
      <h2 className="font-display text-xl font-extrabold">Posts do dia no X</h2>
      <p className="mt-0.5 text-xs text-muted">
        2 sem link + 1 com o link na resposta (post com link aparece para menos gente); os animes do 1º e 2º não são os do desafio de hoje
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {posts.map((p, i) => (
          <div key={i} className="flex flex-col rounded-xl bg-track p-4">
            <p className="text-xs font-bold text-muted">
              {i + 1}º · {p.when}
            </p>
            <p className="mt-2 flex-1 text-sm whitespace-pre-line">{p.text}</p>
            {p.answer && <p className="mt-2 text-xs text-muted">Resposta (para responder no dia seguinte): {p.answer}</p>}
            <a href={intentUrl(p.text)} target="_blank" rel="noopener noreferrer" className={`${BUTTON} mt-3`}>
              Postar no X
            </a>
            {i === posts.length - 1 && (
              <div className="mt-3 flex flex-col gap-2 border-t border-lavender pt-3">
                <input
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                  placeholder="Depois de postar, cole o link deste post"
                  aria-label="Link do 3º post, para responder com o link do site"
                  autoComplete="off"
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium placeholder:text-muted/60 focus:outline-2 focus:outline-offset-2 focus:outline-grape"
                />
                {id ? (
                  <a href={intentUrl(reply, id)} target="_blank" rel="noopener noreferrer" className={BUTTON}>
                    Responder com o link
                  </a>
                ) : (
                  <p className="text-xs text-muted">o botão de responder com o link aparece aqui</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
