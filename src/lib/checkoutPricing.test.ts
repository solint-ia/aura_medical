import { describe, expect, it } from "vitest";
import { calculateCheckoutTotal, verifyCheckoutItems, type CheckoutSkuResolver } from "./checkoutPricing";

const resolver: CheckoutSkuResolver = async (codes) => codes.map((code) => ({
  requestedCode: code, skuCode: code === "enz-slim" ? "enz-slim-plus" : code,
  name: code === "revytra-c20-nano" ? "Revytra C20+ Nano" : "Slim+",
  unitPrice: code === "revytra-c20-nano" ? 314.85 : 390,
  isActive: true, status: "PUBLISHED", visibility: "PUBLIC", lineStatus: "PUBLISHED", trackStock: false,
}));

describe("verifyCheckoutItems", () => {
  it("ignora o preço do cliente e preserva aliases", async () => {
    const result = await verifyCheckoutItems([{ id: "enz-slim", quantity: 2, unitPrice: 0.01 }], { resolver });
    expect(result).toMatchObject({ ok: true, subtotal: 780, items: [{ id: "enz-slim", skuCode: "enz-slim-plus", unitPrice: 390 }] });
  });

  it.each([0, 21, 1.5])("recusa quantidade %s", async (quantity) => {
    expect((await verifyCheckoutItems([{ id: "revytra-c20-nano", quantity }], { resolver })).ok).toBe(false);
  });

  it("aplica desconto PIX somente depois do frete", () => {
    expect(calculateCheckoutTotal(100, "pix", 10)).toBe(104.5);
    expect(calculateCheckoutTotal(100, "card", 10)).toBe(110);
  });

  it("recusa mais de 25 itens distintos", async () => {
    const result = await verifyCheckoutItems(Array.from({ length: 26 }, (_, index) => ({ id: `sku-${index}`, quantity: 1 })), { resolver });
    expect(result.ok).toBe(false);
  });

  it.each([
    { isActive: false, status: "PUBLISHED", visibility: "PUBLIC", lineStatus: "PUBLISHED" },
    { isActive: true, status: "DRAFT", visibility: "PUBLIC", lineStatus: "PUBLISHED" },
    { isActive: true, status: "ARCHIVED", visibility: "PUBLIC", lineStatus: "PUBLISHED" },
    { isActive: true, status: "PUBLISHED", visibility: "PUBLIC", lineStatus: "ARCHIVED" },
  ])("recusa SKU/produto/linha indisponível", async (state) => {
    const unavailable: CheckoutSkuResolver = async ([code]) => [{ requestedCode: code, skuCode: code, name: "Indisponível", unitPrice: 1, trackStock: false, ...state }];
    expect((await verifyCheckoutItems([{ id: "sku", quantity: 1 }], { resolver: unavailable })).ok).toBe(false);
  });

  it.each(["teste-pix", "teste-cartao"])("restringe o SKU interno %s ao administrador", async (code) => {
    const internal: CheckoutSkuResolver = async ([code]) => [{ requestedCode: code, skuCode: code, name: "Teste", unitPrice: 1, isActive: true, status: "PUBLISHED", visibility: "INTERNAL", lineStatus: "PUBLISHED", trackStock: false }];
    expect((await verifyCheckoutItems([{ id: code, quantity: 1 }], { resolver: internal })).ok).toBe(false);
    expect((await verifyCheckoutItems([{ id: code, quantity: 1 }], { resolver: internal, allowInternal: true })).ok).toBe(true);
  });
});
