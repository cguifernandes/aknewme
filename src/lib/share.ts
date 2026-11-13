/**
 * Compartilha um texto: no celular abre o menu nativo; no computador copia.
 * Devolve true só quando copiou (para o botão mostrar "Copiado!").
 */
export async function shareOrCopy(text: string): Promise<boolean> {
  try {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ text });
      return false;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false; // usuário cancelou o compartilhamento, ou sem acesso à área de transferência
  }
}
