import Link from "next/link";
import { A, ContactLink, H2, LegalPage, P } from "@/components/legal/Legal";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata("Termos de uso", "As regras para usar o aknewme, o quiz diário de anime, com ou sem conta.", "/terms");

/** Termos de uso. Texto para revisão do dono (não é parecer jurídico). */
export default function TermsPage() {
  return (
    <LegalPage current="/terms" title="Termos de uso" updated="27 de novembro de 2026">
      <p className={P}>
        Estes termos valem quando você usa o aknewme (o &quot;site&quot;), um quiz diário de anime gratuito. Ao usar o site, você concorda
        com eles. Se não concordar, por favor não use o site.
      </p>

      <h2 className={H2}>O jogo</h2>
      <p className={P}>
        O site é gratuito e oferecido do jeito que está. Os desafios diários, os modos e os recursos podem mudar ou acabar a qualquer
        momento. Você pode jogar sem conta.
      </p>

      <h2 className={H2}>Contas</h2>
      <p className={P}>
        Entrar com Google ou Discord é opcional e permite adicionar amigos e desafiá-los. Você é responsável pelo que acontece na
        sua conta. Você escolhe seu usuário ao entrar e pode trocá-lo uma única vez. Depois disso, mudanças só pelo suporte (contato@aknewme.com),
        com confirmação de que a conta é sua. Podemos remover um nome de usuário ofensivo ou que se passe por outra pessoa. Você pode excluir sua conta a
        qualquer momento na janela Meu perfil (no menu); veja a{" "}
        <Link href="/privacy" className={A}>
          Política de privacidade
        </Link>{" "}
        para saber o que é guardado e o que é apagado.
      </p>

      <h2 className={H2}>Jogo limpo</h2>
      <ul className={`${P} list-disc pl-5`}>
        <li>Não forje placares nem mexa no jogo ou nas requisições dele.</li>
        <li>Não mande pedidos de amizade em massa, nem use o site para assediar outros jogadores.</li>
        <li>Não sobrecarregue, raspe (scraping) nem ataque o site, nem tente acessar os dados de outros jogadores.</li>
      </ul>
      <p className={P}>Podemos limitar, suspender ou excluir contas que desrespeitarem estas regras.</p>

      <h2 className={H2}>Conteúdo</h2>
      <p className={P}>
        Títulos, sinopses, imagens e trechos de openings de anime pertencem aos seus respectivos donos e são usados para identificar as
        obras no quiz. Os trechos de opening são, em sua maioria, prévias oficiais de 30 segundos do Apple Music. O código-fonte do site é
        publicado sob a licença MIT.
      </p>

      <h2 className={H2}>Sem garantia</h2>
      <p className={P}>
        O site é oferecido &quot;do jeito que está&quot;, sem garantias de nenhum tipo. Na medida em que a lei permitir, não nos
        responsabilizamos por nenhuma perda decorrente do seu uso do site, incluindo placares, sequências ou dados da conta perdidos.
      </p>

      <h2 className={H2}>Mudanças</h2>
      <p className={P}>Podemos atualizar estes termos. A data no rodapé mostra a versão mais recente; usar o site depois de uma mudança significa que você a aceita.</p>

      <h2 className={H2}>Contato</h2>
      <p className={P}>
        Dúvidas sobre estes termos: <ContactLink />.
      </p>
    </LegalPage>
  );
}
