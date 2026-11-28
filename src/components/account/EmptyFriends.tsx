/**
 * /friends sem amigos (specs/login-duelo/10-amigos.md, "Lista vazia"): cartão grape (o roxo do cartão do perfil), texto
 * branco, sem avatares e sem link de perfil (ainda não existe). Três passos em cartõezinhos grape-deep com o número numa
 * bolinha lime. O cartão "Adicionar amigo" continua ao lado (ou acima, no celular).
 */
export default function EmptyFriends({ handle }: { handle: string | null }) {
  const steps: [string, string][] = [
    ["Adicione pelo username", "Digite o username do seu amigo em Adicionar amigo."],
    ["Peça para te adicionarem", `Passe o seu username${handle ? ` (@${handle})` : ""} para a turma te achar.`],
    ["Bora duelar", "Desafie seus amigos no desafio do dia e compare o placar."],
  ];
  return (
    <section aria-labelledby="empty-friends-title" className="rounded-3xl bg-grape p-5 text-white sm:p-6">
      <h2 id="empty-friends-title" className="font-display text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">
        Sua turma ainda está vazia
      </h2>
      <p className="mt-2 max-w-prose text-[15px] text-on-grape">Com amigos aqui, você desafia a turma em duelos e vê o placar com cada um.</p>
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map(([title, text], i) => (
          <li key={title} className="rounded-2xl bg-grape-deep p-4">
            <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-lime text-sm font-extrabold text-ink">
              {i + 1}
            </span>
            <p className="mt-2 font-bold">{title}</p>
            <p className="mt-1 text-sm break-words text-on-grape">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
