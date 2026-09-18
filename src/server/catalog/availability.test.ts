import { describe, expect, it } from "vitest";

import { effectiveStock, isSoldOut, kitsFromComponents, productUnits, UNLIMITED } from "./availability";

const sku = (stockQuantity: number | null, trackStock = true, isActive = true) => ({
  isActive,
  trackStock,
  stockQuantity,
});

describe("productUnits", () => {
  it("soma o estoque dos SKUs ativos", () => {
    expect(productUnits([sku(4), sku(6)])).toBe(10);
  });

  it("ignora SKUs inativos", () => {
    expect(productUnits([sku(4), sku(99, true, false)])).toBe(4);
  });

  it("trata como ilimitado quando algum SKU ativo não controla estoque", () => {
    expect(productUnits([sku(0), sku(null, false)])).toBe(UNLIMITED);
  });

  it("sem SKU ativo não há informação de estoque, então não limita o kit", () => {
    expect(productUnits([])).toBe(UNLIMITED);
    expect(productUnits([sku(10, true, false)])).toBe(UNLIMITED);
  });
});

describe("kitsFromComponents", () => {
  it("usa o produto mais escasso da composição", () => {
    const kits = kitsFromComponents([
      { quantity: 2, product: { skus: [sku(10)] } }, // 5 kits
      { quantity: 1, product: { skus: [sku(3)] } }, // 3 kits
    ]);
    expect(kits).toBe(3);
  });

  it("chega a zero quando falta qualquer componente", () => {
    const kits = kitsFromComponents([
      { quantity: 1, product: { skus: [sku(50)] } },
      { quantity: 1, product: { skus: [sku(0)] } },
    ]);
    expect(kits).toBe(0);
  });

  it("é ilimitado quando nenhum componente controla estoque", () => {
    const kits = kitsFromComponents([{ quantity: 4, product: { skus: [sku(null, false)] } }]);
    expect(kits).toBe(UNLIMITED);
  });

  it("protocolo sem composição não é limitado por ela", () => {
    expect(kitsFromComponents([])).toBe(UNLIMITED);
  });
});

describe("effectiveStock", () => {
  it("sem controle e sem teto, a oferta é ilimitada", () => {
    expect(effectiveStock({ trackStock: false, stockQuantity: null })).toEqual({ trackStock: false });
  });

  it("o teto da composição vence o estoque do próprio SKU", () => {
    expect(effectiveStock({ trackStock: true, stockQuantity: 20 }, 3)).toEqual({ trackStock: true, stock: 3 });
  });

  it("o estoque do próprio SKU vence quando é menor", () => {
    expect(effectiveStock({ trackStock: true, stockQuantity: 2 }, 9)).toEqual({ trackStock: true, stock: 2 });
  });

  it("o teto limita mesmo quando o SKU do protocolo não controla estoque", () => {
    expect(effectiveStock({ trackStock: false, stockQuantity: null }, 0)).toEqual({ trackStock: true, stock: 0 });
  });
});

describe("isSoldOut", () => {
  it("esgotado quando toda oferta controlada está zerada", () => {
    expect(isSoldOut([{ trackStock: true, stock: 0 }])).toBe(true);
  });

  it("não esgotado se alguma oferta ainda tem unidade", () => {
    expect(isSoldOut([{ trackStock: true, stock: 0 }, { trackStock: true, stock: 2 }])).toBe(false);
  });

  it("não esgotado quando alguma oferta é ilimitada", () => {
    expect(isSoldOut([{ trackStock: false }])).toBe(false);
  });

  it("item sem oferta não é esgotado, apenas não tem preço", () => {
    expect(isSoldOut([])).toBe(false);
  });
});
