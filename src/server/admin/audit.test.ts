import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAuditLog: vi.fn(),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { auditLog: { create: mocks.createAuditLog } },
}));
vi.mock("next/cache", () => ({
  revalidateTag: mocks.revalidateTag,
  revalidatePath: mocks.revalidatePath,
}));
vi.mock("@/server/catalog/cache", () => ({ CATALOG_TAG: "catalog" }));

import { audit } from "./mutation";

describe("audit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createAuditLog.mockResolvedValue({});
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("does not turn an already committed mutation into a failure when audit logging fails", async () => {
    mocks.createAuditLog.mockRejectedValueOnce(new Error("audit unavailable"));

    await expect(audit("actor", "Product", "product-1", "update", {})).resolves.toBeUndefined();
    expect(mocks.revalidateTag).toHaveBeenCalledWith("catalog", { expire: 0 });
  });

  it("does not fail the mutation response when cache revalidation fails", async () => {
    mocks.revalidateTag.mockImplementationOnce(() => {
      throw new Error("cache unavailable");
    });

    await expect(audit("actor", "MediaAsset", "asset-1", "update", {})).resolves.toBeUndefined();
  });
});
