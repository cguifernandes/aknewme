/**
 * Compartilha um texto: no celular abre o menu nativo; no computador copia.
 * Devolve true só quando copiou (para o botão mostrar "Copiado!").
 */
/** Este aparelho abre o compartilhar nativo (toque + Web Share), em vez de copiar? A mesma regra de shareOrCopy. */
export const sharesNatively = () => typeof navigator !== "undefined" && !!navigator.share && matchMedia("(pointer: coarse)").matches;

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

/** Baixa a imagem do link como arquivo, para compartilhar depois (no iPhone o menu precisa abrir logo após o toque). */
export async function imageFile(url: string, name: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`imagem respondeu ${res.status}`);
  return new File([await res.blob()], name, { type: "image/png" });
}

/**
 * Compartilha imagem + texto no menu nativo do celular. Onde não dá para mandar arquivo (computador),
 * copia só o texto. Devolve true só quando copiou (para o botão mostrar "Copiado!").
 */
export async function shareWithImage(file: File | null, text: string): Promise<boolean> {
  try {
    if (file && matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return false;
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return false; // cancelou o menu
  }
  return shareOrCopy(text);
}
