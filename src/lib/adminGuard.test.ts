import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, verifyAuthToken } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  verifyAuthToken: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { userProfile: { findUnique } },
}));
vi.mock("@/lib/auth", () => ({ verifyAuthToken }));

import { requireAdmin } from "./adminGuard";

describe("requireAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects requests without authentication", async () => {
    verifyAuthToken.mockReturnValue(null);
    const result = await requireAdmin(new Request("http://localhost"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("rejects authenticated users without the admin role", async () => {
    verifyAuthToken.mockReturnValue({ userId: "user-1", email: "user@example.com" });
    findUnique.mockResolvedValue({ role: "USER" });
    const result = await requireAdmin(new Request("http://localhost"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });
});
