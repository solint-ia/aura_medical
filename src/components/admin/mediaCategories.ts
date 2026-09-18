export type MediaCategory = "PRODUCT" | "PROTOCOL" | "CLINICAL_CASE" | "BRAND" | "OTHER";

export const MEDIA_CATEGORIES: { value: MediaCategory; label: string }[] = [
  { value: "PRODUCT", label: "Produto" },
  { value: "PROTOCOL", label: "Protocolo" },
  { value: "CLINICAL_CASE", label: "Caso clínico" },
  { value: "BRAND", label: "Marca" },
  { value: "OTHER", label: "Outros" },
];

export const mediaCategoryLabel = (value?: string | null) =>
  MEDIA_CATEGORIES.find((entry) => entry.value === value)?.label ?? "Sem tipo";

/** Onde a imagem será usada, para já nascer classificada no envio. */
export interface MediaDefaults {
  category?: MediaCategory;
  lineId?: string;
}
