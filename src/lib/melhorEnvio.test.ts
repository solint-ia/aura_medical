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

  it("solicita e devolve todas as opções válidas retornadas pela API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      { id: 1, name: "PAC", price: "30.00", delivery_time: 8, company: { name: "Correios" } },
      { id: 3, name: "Expresso", price: "20.00", delivery_time: 4, company: { name: "Jadlog" } },
      { id: 4, name: "Rodoviário", price: "25.00", delivery_time: 6, company: { name: "LATAM Cargo" } },
      { id: 9, name: "Indisponível", error: "Serviço indisponível" },
    ]), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const options = await calculateMelhorEnvioShipping("49000-001", [item]);

    expect(options.map(({ id }) => id)).toEqual(["3", "4", "1"]);
    expect(options.map(({ company }) => company)).toEqual(["Jadlog", "LATAM Cargo", "Correios"]);
    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(request).not.toHaveProperty("services");
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
