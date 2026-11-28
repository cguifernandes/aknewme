import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import { authErrorLine, logAuth } from "@/lib/authLog";
import { autoHandle } from "@/lib/handleSuggest";
import { upsertAccount } from "@/lib/users";

// Login opcional (specs/login-duelo). Auth.js v5 cuida do OAuth (state + PKCE) e do cookie da sessão
// (httpOnly, sameSite=lax, secure em HTTPS). Sem adapter (decisão do dono): a sessão é um JWT no cookie que leva só
// o id interno; usuário e login são gravados por upsertAccount, com o e-mail do provedor (09-menu-perfil.md, terceira
// rodada) e sem tokens OAuth.
// Variáveis: AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_DISCORD_ID, AUTH_DISCORD_SECRET (lidas pelo Auth.js).

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Nome, foto e e-mail (03-seguranca.md). state + PKCE; o padrão do Auth.js é só PKCE.
    Google({ authorization: { params: { scope: "openid profile email" } }, checks: ["pkce", "state"] }),
    // issuer: o Discord devolve iss=https://discord.com na volta do login (RFC 9207; authorization_response_iss_parameter_supported
    // no /.well-known/openid-configuration dele). Sem isso o Auth.js compara com o padrão "https://authjs.dev" e recusa a
    // resposta (OperationProcessingError OAUTH_INVALID_RESPONSE: o "Não deu para entrar" do Discord, 27/11).
    Discord({ issuer: "https://discord.com", authorization: { params: { scope: "identify email" } }, checks: ["pkce", "state"] }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 86_400 },
  pages: { signIn: "/login", error: "/login" },
  // Logs sem dados pessoais nem tokens: o tipo do erro e o motivo por baixo dele (lib/authLog.ts)
  logger: {
    error: (e) => logAuth("error", authErrorLine(e)),
    warn: (code) => logAuth("warn", code),
    debug: () => {},
  },
  callbacks: {
    async jwt({ token, account, user, profile }) {
      if (account) {
        // Entrada nova: o token passa a levar só o id interno (nada de nome, e-mail ou foto no cookie). O e-mail vai para
        // o banco com o "verificado" do provedor (Google: email_verified; Discord: verified).
        const p = profile as { email_verified?: unknown; verified?: unknown } | undefined;
        const uid = await upsertAccount(account.provider, account.providerAccountId, {
          name: user?.name,
          image: user?.image,
          email: user?.email,
          emailVerified: account.provider === "discord" ? p?.verified : p?.email_verified,
        });
        // 1º login: tenta criar o @ sozinho (06-usuario.md). Discord: username; Google: nome da conta. Se falhar, a pessoa
        // escolhe no passo 2. Sem aviso na tela: a troca fica no perfil.
        try {
          const raw = account.provider === "discord" ? (profile as { username?: unknown } | undefined)?.username : user?.name;
          await autoHandle(uid, raw);
        } catch (e) {
          console.error("[auth] autoHandle", (e as { code?: string })?.code ?? (e as Error)?.name);
        }
        return { uid, sub: uid };
      }
      return token;
    },
    session({ session, token }) {
      const uid = typeof token.uid === "string" ? token.uid : "";
      return { expires: session.expires, user: { id: uid } } as unknown as typeof session;
    },
  },
});
