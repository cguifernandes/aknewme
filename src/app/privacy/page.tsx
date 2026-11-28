import Link from "next/link";
import { A, ContactLink, H2, LegalPage, P } from "@/components/legal/Legal";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata(
  "Política de privacidade",
  "O que o aknewme guarda quando você entra com Google ou Discord, por quê, e como excluir sua conta.",
  "/privacy",
);

/** Política de privacidade (specs/login-duelo/03-seguranca.md, T16). */
export default function PrivacyPage() {
  return (
    <LegalPage current="/privacy" title="Política de privacidade" updated="27 de novembro de 2026">
      <p className={P}>
        Para jogar o aknewme você nunca precisa de conta. Entrar é opcional e serve só para adicionar amigos e desafiá-los.
      </p>

      <h2 className={H2}>O que guardamos quando você entra</h2>
      <ul className={`${P} list-disc pl-5`}>
        <li>Um identificador interno da sua conta.</li>
        <li>Qual provedor você usou (Google ou Discord) e o identificador da sua conta nesse provedor.</li>
        <li>Seu nome de exibição e o endereço (URL) da sua foto de perfil, como o provedor os compartilha.</li>
        <li>
          Seu e-mail e se o provedor diz que ele é verificado, atualizados a cada vez que você entra. Ele aparece só para você, mascarado
          (por exemplo, <code>g••••@gmail.com</code>), na janela Meu perfil, e serve para acharmos sua conta quando você pede suporte ou a
          exclusão. Não aparece para outros jogadores, não vai para os registros do servidor e não é usado para mandar e-mails de
          divulgação.
        </li>
        <li>O usuário (@) que você escolhe, para seus amigos te encontrarem. Quando você troca de usuário, o anterior fica guardado para a sua conta por 30 dias. Guardamos também a data da troca e se o seu usuário atual foi criado automaticamente no login, para aplicar a regra de uma única troca; isso fica até você excluir a conta.</li>
        <li>Sua lista de amigos e os pedidos de amizade.</li>
        <li>As notificações dentro do site (pedido de amizade e pedido aceito): só quem recebe, quem causou e o tipo. São apagadas depois de 30 dias, ou junto com a conta de qualquer um dos dois. Não mandamos e-mail nem notificação do navegador.</li>
      </ul>

      <h2 className={H2}>O que não guardamos</h2>
      <p className={P}>
        Não guardamos os tokens de acesso dos provedores nem sua senha (o login é feito no Google ou no Discord). Sua sessão fica num
        cookie seguro, do tipo http-only. Os registros (logs) do servidor não incluem seu nome, seu usuário, seu e-mail nem tokens. Não
        juntamos contas pelo e-mail: entrar com Google e com Discord cria duas contas separadas.
      </p>

      <h2 className={H2}>Por quê</h2>
      <p className={P}>
        Para seus amigos poderem te encontrar pelo seu usuário e para vocês trocarem pedidos de amizade. Para evitar abuso, as ações de conta têm um limite por
        minuto: para isso guardamos um contador de curta duração ligado ao identificador da sua conta e a uma forma cifrada (hash) do seu
        endereço IP, apagado depois de um minuto.
      </p>

      <h2 className={H2}>No seu aparelho</h2>
      <p className={P}>
        Seus resultados diários, sua sequência, suas estatísticas e o progresso do jogo ficam salvos no armazenamento local do seu
        navegador, com ou sem conta. Suas jogadas não vão para a sua conta.
      </p>

      <h2 className={H2}>Medição de acesso</h2>
      <p className={P}>
        Sem nenhuma conta, contamos partidas e visitas de forma anônima, e usamos o Vercel Web Analytics e, quando ativado, o Meta Pixel
        para medir as visitas. Eles nunca recebem os dados da sua conta.
      </p>

      <h2 className={H2}>Por quanto tempo</h2>
      <p className={P}>
        Sua conta, com o seu e-mail, fica até você excluí-la. As notificações são apagadas depois de 30 dias.
      </p>

      <h2 className={H2}>Excluir sua conta</h2>
      <p className={P}>
        Abra o menu, toque no seu perfil (a janela Meu perfil) e escolha <strong className="text-ink">Excluir conta</strong>. Sua conta, seu e-mail, os
        vínculos de login, seus amigos, os pedidos de amizade e as notificações são apagados na hora. Sair da conta não apaga nada. Você também pode
        pedir a exclusão por e-mail.
      </p>

      <h2 className={H2}>Quem trata os dados</h2>
      <p className={P}>
        O login passa pelo Google ou pelo Discord. Os dados da conta ficam num banco de dados Postgres hospedado pela Neon, o contador do
        limite de ações num banco Redis, e o site roda na Vercel. As fotos de perfil carregam dos servidores do Google ou do Discord.
      </p>

      <h2 className={H2}>Contato</h2>
      <p className={P}>
        Dúvidas ou pedidos: <ContactLink />. Veja também nossos{" "}
        <Link href="/terms" className={A}>
          Termos de uso
        </Link>
        .
      </p>
    </LegalPage>
  );
}
