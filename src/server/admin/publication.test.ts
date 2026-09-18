import { describe, expect, it } from "vitest";
import { casePublicationError, productPublicationError, protocolPublicationError } from "./publication";

describe("regras de publicação do catálogo", () => {
  it("bloqueia produto cuja marca ainda não foi publicada", () => {
    expect(productPublicationError({ name: "Produto", summary: "Resumo", presentation: "Frasco", highlights: [], images: [{}], skus: [{ isActive: true }], line: { status: "DRAFT" } })).toContain("marca");
  });
  it("bloqueia mais de dois destaques ou emoji", () => {
    const base = { name: "Produto", summary: "Resumo", presentation: "Frasco", images: [{}], skus: [{ isActive: true }], line: { status: "PUBLISHED" } };
    expect(productPublicationError({ ...base, highlights: ["A", "B", "C"] })).toContain("2 destaques");
    expect(productPublicationError({ ...base, highlights: ["✨"] })).toContain("emoji");
  });
  it("exige composição, dados clínicos, capa e preço no protocolo", () => {
    expect(protocolPublicationError({ sessions: "", frequency: "", coverImageId: null, components: [], skus: [], line: { status: "PUBLISHED" } })).toContain("produto");
  });
  it("exige autorização e vínculo no caso clínico", () => {
    expect(casePublicationError({ imageRightsConfirmed: false, products: [{}], protocols: [] })).toContain("direito");
    expect(casePublicationError({ imageRightsConfirmed: true, products: [], protocols: [] })).toContain("Vincule");
    expect(casePublicationError({ imageRightsConfirmed: true, products: [{}], protocols: [] })).toBeNull();
  });
});
