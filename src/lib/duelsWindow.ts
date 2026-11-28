// Abrir a janela "Duelos" já num rival, na página em que a pessoa está (sem ir para a home): o "Ver placar" do cartão
// "Desafios" de /friends e do aviso (toast). A janela fica montada no cabeçalho de todas as páginas (SiteHeader); o link
// "/?duelos=<id>" continua valendo para quem chega de fora (a janela lê o parâmetro ao abrir a página).

const OPEN = "aknewme:open-duels";
let mounted = 0;

/** A janela Duelos se registra aqui ao montar; devolve a função de desmontar. */
export function registerDuelsWindow(open: (rivalId: string) => void) {
  const onOpen = (e: Event) => open((e as CustomEvent<string>).detail);
  window.addEventListener(OPEN, onOpen);
  mounted++;
  return () => {
    window.removeEventListener(OPEN, onOpen);
    mounted--;
  };
}

/** Se `href` é "/?duelos=<id>" e a janela está nesta página, abre nela no rival e devolve true (não precisa navegar). */
export function openDuelsFromHref(href: string): boolean {
  const url = new URL(href, location.origin);
  const rival = url.pathname === "/" ? url.searchParams.get("duelos") : null;
  if (!rival || !mounted) return false;
  window.dispatchEvent(new CustomEvent(OPEN, { detail: rival }));
  return true;
}
