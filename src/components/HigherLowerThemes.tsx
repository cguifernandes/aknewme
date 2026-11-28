import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { THEMES, type ThemeId } from "@/lib/higherLower";
import { Icon } from "./icons";

const short = (id: ThemeId, label: string) => (id === "all" ? "Todos" : label);

/**
 * Seletor de tema do Mais ou Menos, dentro do placar (specs/mais-ou-menos/01-ficha-favoritos-temas.md, seções 4 e 6):
 * pílula lime com seta, que abre a lista do próprio aparelho com "Todos" e os 2 temas de teste. Escolhe-se antes da
 * partida: com uma sequência em andamento fica travado (`locked`) e destrava quando a partida acaba. Cada tema tem o
 * seu recorde.
 * A pílula mostra só o tema atual (fica do tamanho dele, e o placar cabe no celular); a lista de verdade fica por cima,
 * invisível, e recebe o toque, o teclado e o leitor de tela.
 */
export default function ThemeSelect({ value, onChange, locked }: { value: ThemeId; onChange: (id: ThemeId) => void; locked: boolean }) {
  const current = THEMES.find((t) => t.id === value) ?? THEMES[0];
  return (
    <label className="block text-[9px] font-bold tracking-wide text-lavender uppercase md:text-[11px]">
      Tema
      <span
        className={`relative mt-0.5 flex w-fit items-center gap-1.5 rounded-full bg-lime py-0.5 pr-2 pl-2.5 text-xs font-extrabold whitespace-nowrap text-ink normal-case has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-white md:py-1 md:pr-2.5 md:pl-3 md:text-sm ${
          locked ? "opacity-70" : ""
        }`}
      >
        <span aria-hidden="true">{short(current.id, current.label)}</span>
        <Icon icon={faCaretDown} className="text-[10px]" />
        <select
          value={value}
          disabled={locked}
          onChange={(e) => onChange(e.target.value as ThemeId)}
          title={locked ? "Termine a partida para trocar de tema" : undefined}
          className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0 disabled:cursor-default"
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {short(t.id, t.label)}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}
