import { describe, expect, it } from "vitest";
import { formErrorMessage } from "./formErrors";

describe("mensagem de erro do formulário", () => {
  it("nomeia os campos recusados em vez de dizer só 'Dados inválidos'", () => {
    const data = {
      error: "Dados inválidos.",
      fields: [
        { field: "summary", message: "Too small: expected string to have >=2 characters" },
        { field: "presentation", message: "Too small: expected string to have >=2 characters" },
      ],
    };
    expect(formErrorMessage(data, "Falhou.")).toBe("Revise Resumo, Apresentação.");
  });

  it("repassa a explicação quando ela é nossa, em português", () => {
    const data = { error: "Dados inválidos.", fields: [{ field: "swatchColor", message: "Use uma cor hexadecimal válida." }] };
    expect(formErrorMessage(data, "Falhou.")).toBe("Revise Cor do círculo. Use uma cor hexadecimal válida.");
  });

  it("não repassa a explicação em inglês do validador", () => {
    const data = { error: "Dados inválidos.", fields: [{ field: "highlights", message: "Too big: expected array to have <=2 items" }] };
    expect(formErrorMessage(data, "Falhou.")).toBe("Revise Destaques.");
  });

  it("usa o erro do servidor quando não há campos", () => {
    expect(formErrorMessage({ error: "Este registro mudou desde que você o abriu." }, "Falhou.")).toBe(
      "Este registro mudou desde que você o abriu.",
    );
    expect(formErrorMessage({}, "Falhou.")).toBe("Falhou.");
  });

  it("agrupa campos repetidos de listas, como as fotos da galeria", () => {
    const data = {
      fields: [
        { field: "images.0.assetId", message: "A mesma imagem não pode aparecer duas vezes na galeria." },
        { field: "images.1.assetId", message: "A mesma imagem não pode aparecer duas vezes na galeria." },
      ],
    };
    expect(formErrorMessage(data, "Falhou.")).toBe("Revise Fotos.");
  });
});
