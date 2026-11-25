import { ImageResponse } from "next/og";
import { dailyAnimes, dailyNumber, MODE_LABEL, type GameMode } from "@/lib/game";
import { appleEmojiUrl, OG, ogFonts } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

// Card de resultado para compartilhar (1080×1350, feed do Instagram e do X), feito no botão "Desafiar um amigo"
// do fim de jogo: /api/card?mode=emoji&day=198&g=🟩🟨🟥⬜⬜&won=1&hide=1
// hide=1 (convite do duelo): mostra o placar, mas os quadradinhos viram "?" — as jogadas só aparecem para quem terminar.
// Só aceita modo, dia e quadradinhos (nada de texto livre): ninguém gera imagem da marca escrevendo o que quiser.
// O mesmo pedido sempre dá a mesma imagem, então fica em cache.

const TILE: Record<string, string> = { "🟩": OG.lime, "🟨": OG.sun, "🟥": OG.blush, "⬛": OG.lavender, "🟪": OG.lavender };

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const mode = q.get("mode") as GameMode;
  const day = Number(q.get("day"));
  const tiles = Array.from(q.get("g") ?? "").filter((t) => t in TILE || t === "⬜").slice(0, 10);
  const won = q.get("won") === "1";
  const hide = q.get("hide") === "1";
  if (!(mode in MODE_LABEL) || !Number.isInteger(day) || day < 1 || day > dailyNumber() + 1 || !tiles.length)
    return new Response("pedido inválido", { status: 400 });

  const hits = tiles.filter((t) => t === "🟩" || t === "🟨").length;
  const tried = tiles.filter((t) => t !== "⬜").length;
  const [big, sub] =
    mode === "emoji"
      ? [`${hits}/${tiles.length}`, hits === tiles.length ? "gabaritei os animes de hoje" : "animes acertados pelos emojis"]
      : !won
        ? ["Quase!", mode === "opening" ? "não reconheci a opening de hoje" : "não descobri o anime de hoje"]
        : mode === "opening"
          ? [`${tried}ª`, tried === 1 ? "reconheci a opening de primeira" : "tentativa para reconhecer a opening"]
          : [`${tried}`, tried === 1 ? "acertei o anime de primeira" : "palpites para descobrir o anime"];
  // Emoji: o enigma da 1ª rodada vira o gancho (é o mesmo da prévia do site, então não entrega nada novo)
  const riddle = mode === "emoji" ? dailyAnimes("emoji", day)[0].emojis : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "96px 80px",
          background: OG.grape,
          color: OG.white,
          fontFamily: "Figtree",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontFamily: "Bricolage Grotesque", fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>
            aknewme<span style={{ color: OG.lime }}>.</span>
            <span style={{ color: OG.lavender, marginLeft: 24, fontWeight: 400 }}>#{day}</span>
          </div>
          <div style={{ marginTop: 28, background: OG.ink, color: OG.lavender, fontSize: 34, fontWeight: 700, padding: "10px 32px", borderRadius: 999 }}>
            {`Modo ${MODE_LABEL[mode]}`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: "Bricolage Grotesque", fontSize: 260, fontWeight: 800, lineHeight: 1, letterSpacing: -8, color: won ? OG.lime : OG.blush }}>
            {big}
          </div>
          <div style={{ marginTop: 16, fontSize: 44, fontWeight: 700, color: OG.lavender }}>{sub}</div>
          <div style={{ display: "flex", gap: 20, marginTop: 56 }}>
            {tiles.map((t, i) => (
              <div
                key={i}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 64,
                  fontWeight: 700,
                  color: OG.lavender,
                  background: hide ? OG.grapeDeep : (TILE[t] ?? OG.grapeDeep),
                  border: hide || TILE[t] ? "none" : `5px dashed ${OG.lavender}`,
                }}
              >
                {hide ? "?" : ""}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {riddle && (
            <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 48 }}>
              <span style={{ fontSize: 40, fontWeight: 700, color: OG.lavender, marginRight: 8 }}>Que anime é esse?</span>
              {riddle.map((e, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={appleEmojiUrl(SITE_URL, e)} width={88} height={88} alt="" />
              ))}
            </div>
          )}
          <div style={{ background: OG.lime, color: OG.ink, fontSize: 46, fontWeight: 700, padding: "22px 56px", borderRadius: 999 }}>
            Consegue bater? aknewme.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: await ogFonts(),
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
