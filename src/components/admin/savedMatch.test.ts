import { describe, expect, it } from "vitest";
import { matchesSaved } from "./savedMatch";

describe("matchesSaved", () => {
  const sent = {
    name: "Cicatrizes",
    coverImageId: "asset-1",
    note: "",
    sortOrder: 2,
    images: [{ assetId: "asset-2", caption: "", sortOrder: 0 }],
  };

  it("reconhece a gravação quando o servidor devolve colunas a mais", () => {
    const saved = {
      id: "protocol-1",
      name: "Cicatrizes",
      coverImageId: "asset-1",
      note: null,
      sortOrder: 2,
      updatedAt: "2026-09-21T12:00:00.000Z",
      images: [{ id: "row-1", protocolId: "protocol-1", assetId: "asset-2", caption: null, sortOrder: 0, asset: { path: "x.webp" } }],
    };
    expect(matchesSaved(sent, saved)).toBe(true);
  });

  it("acusa diferença quando a imagem gravada é outra", () => {
    const saved = { ...sent, images: [{ assetId: "asset-9", caption: "", sortOrder: 0 }] };
    expect(matchesSaved(sent, saved)).toBe(false);
  });

  it("acusa diferença quando falta uma imagem da galeria", () => {
    expect(matchesSaved(sent, { ...sent, images: [] })).toBe(false);
  });

  it("ignora campos que o painel não enviou", () => {
    expect(matchesSaved({ name: "Cicatrizes" }, { name: "Cicatrizes", status: "PUBLISHED" })).toBe(true);
  });

  it("aceita componentes recriados quando os campos editáveis são iguais", () => {
    const sent = {
      components: [{ productId: "product-1", quantity: 2, role: "Remodelação", sortOrder: 0 }],
    };
    const saved = {
      components: [{ id: "new-row", protocolId: "protocol-1", productId: "product-1", quantity: 2, role: "Remodelação", sortOrder: 0 }],
    };
    expect(matchesSaved(sent, saved)).toBe(true);
  });

  it("continua detectando troca de produto em componente recriado", () => {
    const sent = {
      components: [{ productId: "product-1", quantity: 2, role: "Remodelação", sortOrder: 0 }],
    };
    const saved = {
      components: [{ id: "new-row", protocolId: "protocol-1", productId: "product-2", quantity: 2, role: "Remodelação", sortOrder: 0 }],
    };
    expect(matchesSaved(sent, saved)).toBe(false);
  });
});
