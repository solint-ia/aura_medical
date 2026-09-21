import { describe, expect, it } from "vitest";
import { activeSectionId } from "./SubNavBar";

// A linha da barra fica a 140px do topo da janela: cabeçalho + sub-barra.
const LINE = 140;

describe("activeSectionId", () => {
  const sections = [
    { id: "visao-geral", top: -600 },
    { id: "produtos", top: 120 },
    { id: "protocolos", top: 900 },
  ];

  it("acende a última seção que cruzou a barra", () => {
    expect(activeSectionId(sections, LINE)).toBe("produtos");
  });

  it("mantém a primeira enquanto nenhuma cruzou", () => {
    expect(activeSectionId([{ id: "visao-geral", top: 300 }, { id: "produtos", top: 1200 }], LINE)).toBe("visao-geral");
  });

  it("acende a última seção quando a página chega ao fim", () => {
    expect(activeSectionId(sections, LINE, true)).toBe("protocolos");
  });

  it("não acende nada quando a página não tem as seções", () => {
    expect(activeSectionId([], LINE)).toBe("");
  });
});
