import { beforeEach, describe, expect, it, vi } from "vitest";
import { collapseTrail, pushTrail, trailSnapshot } from "./navigationTrail";

describe("trilha de navegação", () => {
  beforeEach(() => {
    sessionStorage.clear();
    // O snapshot é lido do armazenamento na primeira chamada de cada página.
    pushTrail({ href: "/", label: "Início" });
  });

  it("acumula o caminho percorrido", () => {
    pushTrail({ href: "/catalogo", label: "Catálogo" });
    pushTrail({ href: "/produtos/slim-plus", label: "SLIM+" });
    expect(trailSnapshot().map((entry) => entry.label)).toEqual(["Início", "Catálogo", "SLIM+"]);
  });

  it("corta o que veio depois ao voltar para uma página anterior", () => {
    pushTrail({ href: "/catalogo", label: "Catálogo" });
    pushTrail({ href: "/produtos/slim-plus", label: "SLIM+" });
    pushTrail({ href: "/catalogo", label: "Catálogo" });
    expect(trailSnapshot().map((entry) => entry.label)).toEqual(["Início", "Catálogo"]);
  });

  it("trata a mesma página com filtros diferentes como uma só", () => {
    pushTrail({ href: "/catalogo?linha=pbserum", label: "Catálogo" });
    pushTrail({ href: "/catalogo", label: "Catálogo" });
    expect(trailSnapshot()).toHaveLength(2);
  });

  it("começa pela home mesmo quando a pessoa entra direto numa página interna", async () => {
    // Aba nova: nem armazenamento nem trilha em memória.
    sessionStorage.clear();
    vi.resetModules();
    const trilha = await import("./navigationTrail");
    trilha.pushTrail({ href: "/protocolos/celulite", label: "Celulite" });
    expect(trilha.trailSnapshot().map((entry) => entry.label)).toEqual(["Início", "Celulite"]);
  });

  it("resume o meio de trilhas longas", () => {
    const trail = ["a", "b", "c", "d", "e", "f"];
    expect(collapseTrail(trail)).toEqual(["a", "ellipsis", "d", "e", "f"]);
  });
});
