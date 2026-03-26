import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireCompleteUser = vi.fn();
const mockEnforceRateLimit = vi.fn();
const mockGetRequestIdentity = vi.fn();

vi.mock("../lib/auth/api", () => ({
  requireCompleteUser: mockRequireCompleteUser,
}));

vi.mock("../lib/server/rateLimit", () => ({
  enforceRateLimit: mockEnforceRateLimit,
  getRequestIdentity: mockGetRequestIdentity,
}));

vi.mock("../lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

describe("/api/reports", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRequireCompleteUser.mockReset();
    mockEnforceRateLimit.mockReset();
    mockGetRequestIdentity.mockReset();
    mockRequireCompleteUser.mockResolvedValue({ user: { id: "user-1" } });
    mockEnforceRateLimit.mockReturnValue(null);
    mockGetRequestIdentity.mockReturnValue("user-1");
  });

  it("rejects invalid entity types", async () => {
    const { POST } = await import("../app/api/reports/route");
    const response = await POST(
      new Request("http://localhost/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "category",
          entityId: "cat-001",
          reason: "This should be rejected.",
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_ENTITY",
        message: "Entity type is invalid.",
      },
    });
  });

  it("rejects reports with too-short reasons", async () => {
    const { POST } = await import("../app/api/reports/route");
    const response = await POST(
      new Request("http://localhost/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "loadout",
          entityId: "loadout-1",
          reason: "short",
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_REPORT",
        message: "A report reason with at least 8 characters is required.",
      },
    });
  });
});
