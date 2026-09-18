import { describe, expect, it } from "vitest";
import { productPatchSchema } from "./catalog";

describe("productPatchSchema", () => {
  it("aceita uma galeria com imagens diferentes", () => {
    const result = productPatchSchema.safeParse({
      images: [
        { assetId: "11111111-1111-4111-8111-111111111111", sortOrder: 0 },
        { assetId: "22222222-2222-4222-8222-222222222222", sortOrder: 1 },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejeita a mesma imagem repetida na galeria", () => {
    const assetId = "11111111-1111-4111-8111-111111111111";
    const result = productPatchSchema.safeParse({
      images: [
        { assetId, sortOrder: 0 },
        { assetId, sortOrder: 1 },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        path: ["images", 1, "assetId"],
        message: "A mesma imagem não pode aparecer duas vezes na galeria.",
      });
    }
  });
});
