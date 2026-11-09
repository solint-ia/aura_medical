import { describe, expect, it } from "vitest";
import { parsePrice } from "./money";

describe("preço digitado no admin", () => {
  it("aceita vírgula, ponto e milhar", () => {
    expect(parsePrice("285,90")).toBe(285.9);
    expect(parsePrice("285.9")).toBe(285.9);
    expect(parsePrice("R$ 1.234,56")).toBe(1234.56);
  });

  it("recusa vazio, negativo e texto", () => {
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("-3")).toBeNull();
    expect(parsePrice("abc")).toBeNull();
  });
});
