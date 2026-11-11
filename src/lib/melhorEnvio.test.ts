import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { calculateMelhorEnvioShipping } from "./melhorEnvio";

const item = {
  id: "produto-a",
  skuCode: "produto-a",
  name: "Produto A",
  quantity: 1,
  unitPrice: 100,
  trackStock: false,
};

describe("calculateMelhorEnvioShipping", () => {
  beforeEach(() => {
    process.env.MELHOR_ENVIO_CEP_ORIGEM = "49000000";
    process.env.MELHOR_ENVIO_TOKEN = "token-de-teste";
    delete process.env.MELHOR_ENVIO_API_URL;
  });

  afterEach(() => {
    delete process.env.MELHOR_ENVIO_CEP_ORIGEM;
    delete process.env.MELHOR_ENVIO_TOKEN;
    delete process.env.MELHOR_ENVIO_API_URL;
  });

  it("devolve só as opções dos Correios, da mais barata para a mais cara", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      { id: 2, name: "SEDEX", price: "45.00", delivery_time: 3, company: { id: 1, name: "Correios" } },
      { id: 1, name: "PAC", price: "30.00", delivery_time: 8, company: { id: 1, name: "Correios" } },
      { id: 3, name: "Expresso", price: "20.00", delivery_time: 4, company: { id: 2, name: "Jadlog" } },
      { id: 4, name: "Rodoviário", price: "25.00", delivery_time: 6, company: { id: 6, name: "LATAM Cargo" } },
      { id: 17, name: "Mini Envios", error: "Serviço indisponível", company: { id: 1, name: "Correios" } },
    ]), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const options = await calculateMelhorEnvioShipping("49000-001", [item]);

    expect(options.map(({ id }) => id)).toEqual(["1", "2"]);
    expect(options.every(({ company }) => company === "Correios")).toBe(true);
  });

  it("avisa quando os Correios não atendem, mesmo com outras transportadoras disponíveis", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([
      { id: 3, name: "Expresso", price: "20.00", delivery_time: 4, company: { id: 2, name: "Jadlog" } },
    ]), { status: 200, headers: { "Content-Type": "application/json" } })));

    await expect(calculateMelhorEnvioShipping("49000-001", [item])).rejects.toThrow("Os Correios não atendem");
  });

  it("envia medidas de uma unidade com a quantidade, sem somar nem multiplicar", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      { id: 1, name: "PAC", price: "30.00", delivery_time: 8, company: { name: "Correios" } },
    ]), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await calculateMelhorEnvioShipping("49000-001", [
      { ...item, quantity: 3 },
      { ...item, id: "produto-b", skuCode: "produto-b", quantity: 2, package: { width: 4.2, height: 12, length: 4, weight: 0.08 } },
    ]);

    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(request.products).toEqual([
      { id: "produto-a", width: 10, height: 15, length: 20, weight: 0.5, insurance_value: 100, quantity: 3 },
      { id: "produto-b", width: 5, height: 12, length: 4, weight: 0.08, insurance_value: 100, quantity: 2 },
    ]);
  });
});
