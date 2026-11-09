import { describe, expect, it } from "vitest";
import { parseListText } from "./listText";

describe("texto colado vira lista", () => {
  it("usa cada linha como item", () => {
    expect(
      parseListText("Potencializa a redução de rugas\nClareamento e uniformidade do tom da pele\n\nHidratação profunda"),
    ).toEqual(["Potencializa a redução de rugas", "Clareamento e uniformidade do tom da pele", "Hidratação profunda"]);
  });

  it("remove marcadores e junta as linhas que continuam o item", () => {
    expect(parseListText("• Reduz manchas e\nmelasma\n• Uniformiza o tom;\n2) Uso noturno")).toEqual([
      "Reduz manchas e melasma",
      "Uniformiza o tom",
      "Uso noturno",
    ]);
  });

  it("junta frase quebrada no meio quando não há marcadores", () => {
    expect(parseListText("Aplicar sobre a pele limpa e\nseca, à noite.\nEvitar exposição solar.")).toEqual([
      "Aplicar sobre a pele limpa e seca, à noite.",
      "Evitar exposição solar.",
    ]);
  });

  it("divide uma linha única em ponto e vírgula", () => {
    expect(parseListText("Água; Propanediol; Cisteamina")).toEqual(["Água", "Propanediol", "Cisteamina"]);
  });

  it("não confunde número e porcentagem com marcador", () => {
    expect(parseListText("1.5 ml por sessão\n-10% de oleosidade")).toEqual(["1.5 ml por sessão", "-10% de oleosidade"]);
  });

  it("não junta parágrafos só porque uma linha tem marcador", () => {
    expect(
      parseListText(
        "Resultados após 7 dias\n\n73% Constataram melhora;\n\n70% Constataram o tom uniforme;\n\nSelos:\n\n• Vegano   • Sulfato free  •eureciclo.",
      ),
    ).toEqual([
      "Resultados após 7 dias",
      "73% Constataram melhora",
      "70% Constataram o tom uniforme",
      "Selos:",
      "Vegano",
      "Sulfato free",
      "eureciclo.",
    ]);
  });

  it("devolve vazio para texto vazio", () => {
    expect(parseListText("  \n \n")).toEqual([]);
  });
});
