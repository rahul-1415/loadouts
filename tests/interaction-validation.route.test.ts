import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireCompleteUser = vi.fn();

vi.mock("../lib/auth/api", () => ({
  requireCompleteUser: mockRequireCompleteUser,
}));

vi.mock("../lib/data/analytics", () => ({
  captureOperationalEvent: vi.fn(),
  trackMilestoneEvent: vi.fn(),
}));

vi.mock("../lib/data/notifications", () => ({
  createNotification: vi.fn(),
}));

describe("interaction route validation", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRequireCompleteUser.mockReset();
    mockRequireCompleteUser.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("returns 400 when like toggle has no collection identifier", async () => {
    const { POST } = await import("../app/api/likes/route");
    const response = await POST(
      new Request("http://localhost/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "COLLECTION_REQUIRED",
        message: "Collection id or slug is required.",
      },
    });
  });

  it("returns 400 when comment body is empty", async () => {
    const { POST } = await import("../app/api/comments/route");
    const response = await POST(
      new Request("http://localhost/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId: "loadout-1", body: "   " }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_BODY",
        message: "Comment cannot be empty.",
      },
    });
  });

  it("returns 400 when follow target handle is missing", async () => {
    const { POST } = await import("../app/api/follows/route");
    const response = await POST(
      new Request("http://localhost/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "TARGET_REQUIRED",
        message: "Target handle is required.",
      },
    });
  });
});
