import { describe, expect, it } from "vitest";
import { requireUnchanged } from "./concurrency";

describe("requireUnchanged", () => {
  const updatedAt = new Date("2026-01-02T03:04:05.000Z");

  it("accepts the current version", () => {
    const request = new Request("http://localhost", {
      headers: { "If-Match": updatedAt.toISOString() },
    });
    expect(requireUnchanged(request, updatedAt)).toBeNull();
  });

  it("requires a version header", async () => {
    const response = requireUnchanged(new Request("http://localhost"), updatedAt);
    expect(response?.status).toBe(428);
    await expect(response?.json()).resolves.toMatchObject({ error: expect.any(String) });
  });

  it("rejects a stale version", async () => {
    const request = new Request("http://localhost", {
      headers: { "If-Match": "2025-01-01T00:00:00.000Z" },
    });
    const response = requireUnchanged(request, updatedAt);
    expect(response?.status).toBe(409);
    await expect(response?.json()).resolves.toMatchObject({ error: expect.any(String) });
  });
});
