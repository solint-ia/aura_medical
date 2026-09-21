/**
 * ID de âncora a partir de um título de seção, para a sub-barra de navegação
 * apontar para blocos cujo título vem do catálogo, como "Modo de uso".
 */
export function anchorId(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
