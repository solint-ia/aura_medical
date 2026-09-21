import { describe, expect, it } from "vitest";
import { contextFramings, DEFAULT_FRAMING, framingStyle, toFraming } from "./imageFraming";

const asset = {
  fit: "COVER",
  focalX: 50,
  focalY: 30,
  zoom: 100,
  framingByContext: { page: { fit: "contain", x: 50, y: 50, zoom: 100 } },
};

describe("enquadramento por contexto", () => {
  it("usa o ajuste próprio do contexto quando ele existe", () => {
    expect(toFraming(asset, "page")).toEqual({ fit: "contain", x: 50, y: 50, zoom: 100 });
  });

  it("herda o padrão da imagem no contexto sem ajuste próprio", () => {
    expect(toFraming(asset, "card")).toEqual({ fit: "cover", x: 50, y: 30, zoom: 100 });
  });

  it("sem contexto, vale o padrão da imagem", () => {
    expect(toFraming(asset)).toEqual({ fit: "cover", x: 50, y: 30, zoom: 100 });
  });

  it("cai no padrão geral quando não há imagem", () => {
    expect(toFraming(null, "card")).toEqual(DEFAULT_FRAMING);
  });

  it("ignora ajustes corrompidos guardados no banco", () => {
    expect(contextFramings({ framingByContext: { card: "lixo", page: null } })).toEqual({});
    expect(toFraming({ fit: "CONTAIN", framingByContext: { card: "lixo" } }, "card").fit).toBe("contain");
  });

  it("limita valores fora da faixa em vez de confiar no banco", () => {
    expect(toFraming({ framingByContext: { card: { fit: "cover", x: 999, y: -5, zoom: 5000 } } }, "card")).toEqual({
      fit: "cover",
      x: 100,
      y: 0,
      zoom: 300,
    });
  });

  it("não gera estilo quando o enquadramento é o padrão", () => {
    expect(framingStyle(DEFAULT_FRAMING)).toBeUndefined();
  });

  it("aproxima a partir do ponto focal", () => {
    expect(framingStyle({ fit: "cover", x: 30, y: 70, zoom: 150 })).toEqual({
      objectFit: "cover",
      objectPosition: "30% 70%",
      transform: "scale(1.5)",
      transformOrigin: "30% 70%",
    });
  });
});
