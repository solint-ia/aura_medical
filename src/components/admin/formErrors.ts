/**
 * "Dados inválidos." não ajuda ninguém a encontrar o campo errado. A API
 * devolve a lista de campos recusados; aqui ela vira uma frase com os nomes
 * que o admin vê na tela.
 */
const FIELD_LABELS: Record<string, string> = {
  lineId: "Marca",
  categoryId: "Categoria",
  slug: "Endereço da página",
  name: "Nome",
  eyebrow: "Linha de apoio",
  summary: "Resumo",
  presentation: "Apresentação",
  netContent: "Conteúdo líquido",
  collection: "Coleção",
  highlights: "Destaques",
  specs: "Pares da ficha",
  sections: "Blocos de descrição",
  images: "Fotos",
  weightGrams: "Peso",
  lengthCm: "Comprimento",
  widthCm: "Largura",
  heightCm: "Altura",
  sortOrder: "Ordem na lista",
  introduction: "Introdução",
  sessions: "Sessões",
  frequency: "Frequência",
  indications: "Indicações",
  reconstitution: "Reconstituição",
  expectedResults: "Resultados esperados",
  marking: "Marcação",
  components: "Composição do kit",
  coverImageId: "Foto de capa",
  mappingImageId: "Imagem de mapeamento",
  price: "Preço",
  code: "Código",
  label: "Rótulo",
  swatchColor: "Cor do círculo",
  stockQuantity: "Quantidade em estoque",
};

interface ApiError {
  error?: string;
  fields?: { field: string; message: string }[];
}

/** O Zod explica em inglês; só repassamos explicação quando ela é nossa. */
const ENGLISH = /^(Too |Invalid|Expected|Required|Unrecognized|Number|String)/;

export function formErrorMessage(data: ApiError, fallback: string): string {
  if (data.fields?.length) {
    const names = [...new Set(data.fields.map((entry) => FIELD_LABELS[entry.field.split(".")[0]] ?? entry.field))];
    const own = data.fields.length === 1 && !ENGLISH.test(data.fields[0].message) ? ` ${data.fields[0].message}` : "";
    return `Revise ${names.join(", ")}.${own}`;
  }
  return data.error || fallback;
}
