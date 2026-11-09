import Link from "next/link";
import ErrorScreen, { ERROR_BTN } from "@/components/ErrorScreen";
import { MODE_LABEL, MODE_PATH, type GameMode } from "@/lib/game";

export const metadata = { title: "Página não encontrada" };

/** 404 de qualquer rota que não existe (o Next já marca como noindex). */
export default function NotFound() {
  return (
    <ErrorScreen
      cards="404"
      kana="迷子"
      badge="Página não encontrada"
      title="Esse episódio não existe."
      text="O link pode estar errado ou a página saiu do ar. O desafio de hoje continua te esperando."
    >
      <Link href="/" className={`${ERROR_BTN} bg-lime sweep-white`}>
        Jogar o desafio de hoje
      </Link>
      {(Object.keys(MODE_LABEL) as GameMode[]).map((m) => (
        <Link key={m} href={MODE_PATH[m]} className={`${ERROR_BTN} bg-track sweep-lavender`}>
          Modo {MODE_LABEL[m]}
        </Link>
      ))}
    </ErrorScreen>
  );
}
