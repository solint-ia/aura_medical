import { describe, expect, it } from "vitest";
import { mapProduct } from "./mappers";

describe("mapeamento do detalhe de produto", () => {
  it("expõe toda a galeria e casos vinculados sem duplicar o cadastro", () => {
    const asset = (path: string, alt: string) => ({ provider: "LOCAL", bucket: null, path, alt });
    const row = {
      slug: "produto-a", lineId: "line", name: "Produto A", collection: null, summary: "Resumo", highlights: [], presentation: "Frasco", variantName: null,
      line: { slug: "marca", name: "Marca", descriptor: "Desc", surfaceLight: "#FFFFFF", surfaceDark: "#000000", accentLight: "#111111", accentDark: "#EEEEEE", inkLight: "#000000", inkDark: "#FFFFFF" },
      category: null, images: [{ asset: asset("/a.png", "A"), caption: "Frente" }, { asset: asset("/b.png", "B"), caption: "Verso" }], sections: [], pending: [], skus: [],
      caseLinks: [{ case: { slug: "caso", title: "Caso", description: null, professional: "Profissional", country: "Brasil", sessions: 2, status: "PUBLISHED", imageRightsConfirmed: true, beforeImage: asset("/antes.png", "Antes"), afterImage: asset("/depois.png", "Depois"), products: [{ product: { name: "Produto A", slug: "produto-a" } }, { product: { name: "Produto B", slug: "produto-b" } }], protocols: [] } }],
    };
    const result = mapProduct(row as never);
    expect(result.images).toHaveLength(2);
    expect(result.images?.[1].caption).toBe("Verso");
    expect(result.clinicalCases).toHaveLength(1);
    expect(result.clinicalCases?.[0].related).toEqual([{ name: "Produto B", href: "/produtos/produto-b" }]);
  });
});
