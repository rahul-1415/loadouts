import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireUser = vi.fn();
const mockRequireCompleteUser = vi.fn();
const mockGetSavedCollectionsByUserId = vi.fn();

vi.mock("../lib/auth/api", () => ({
  requireUser: mockRequireUser,
  requireCompleteUser: mockRequireCompleteUser,
}));

vi.mock("../lib/data/collections", () => ({
  getSavedCollectionsByUserId: mockGetSavedCollectionsByUserId,
}));

describe("/api/saved", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRequireUser.mockReset();
    mockRequireCompleteUser.mockReset();
    mockGetSavedCollectionsByUserId.mockReset();
  });

  it("returns saved items for the authenticated user", async () => {
    mockRequireUser.mockResolvedValue({ user: { id: "user-1" } });
    mockGetSavedCollectionsByUserId.mockResolvedValue([
      { id: "loadout-1", slug: "desk-kit", kind: "loadout" },
    ]);

    const { GET } = await import("../app/api/saved/route");
    const response = await GET(new Request("http://localhost/api/saved?limit=12"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        items: [{ id: "loadout-1", slug: "desk-kit", kind: "loadout" }],
      },
    });
    expect(mockGetSavedCollectionsByUserId).toHaveBeenCalledWith("user-1", 12);
  });

  it("returns 400 when save toggle is missing both id and slug", async () => {
    mockRequireCompleteUser.mockResolvedValue({ user: { id: "user-1" } });

    const { POST } = await import("../app/api/saved/route");
    const response = await POST(
      new Request("http://localhost/api/saved", {
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
});
