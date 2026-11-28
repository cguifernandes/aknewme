// Datas em português do Brasil para as listas de /friends (specs/login-duelo/10-amigos.md): "há 3 horas", "há 2 dias",
// "nov/2026". Só formatação: as datas vêm do banco.

const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "always" });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86_400],
  ["month", 30 * 86_400],
  ["week", 7 * 86_400],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "há 3 horas", "há 2 dias", "há 1 mês"; menos de 1 minuto: "agora há pouco" */
export function ago(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  for (const [unit, size] of STEPS) if (s >= size) return rtf.format(-Math.floor(s / size), unit);
  return "agora há pouco";
}

/** "nov/2026" */
export function monthYear(iso: string): string {
  const d = new Date(iso);
  const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return `${month}/${d.getFullYear()}`;
}
