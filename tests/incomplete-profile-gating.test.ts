import { beforeEach, describe, expect, it, vi } from "vitest";

function buildIncompleteResponse() {
  return new Response(
    JSON.stringify({
      error: {
        code: "PROFILE_INCOMPLETE",
        message: "Complete profile setup",
      },
    }),
    {
      status: 409,
      headers: { "Content-Type": "application/json" },
    }
  );
}

describe("incomplete profile gating on protected routes", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function importWithIncompleteAuth<T>(path: string): Promise<T> {
    vi.doMock("../lib/auth/api", () => ({
      requireCompleteUser: vi.fn().mockResolvedValue({
        response: buildIncompleteResponse(),
      }),
      requireUser: vi.fn().mockResolvedValue({
        response: buildIncompleteResponse(),
      }),
    }));

    return import(path) as Promise<T>;
  }

  it("blocks save writes with PROFILE_INCOMPLETE", async () => {
    const module = await importWithIncompleteAuth<typeof import("../app/api/saved/route")>(
      "../app/api/saved/route"
    );
    const response = await module.POST(
      new Request("http://localhost/api/saved", { method: "POST" })
    );

    expect(response.status).toBe(409);
  });

  it("blocks like writes with PROFILE_INCOMPLETE", async () => {
    const module = await importWithIncompleteAuth<typeof import("../app/api/likes/route")>(
      "../app/api/likes/route"
    );
    const response = await module.POST(
      new Request("http://localhost/api/likes", { method: "POST" })
    );

    expect(response.status).toBe(409);
  });

  it("blocks comment writes with PROFILE_INCOMPLETE", async () => {
    const module = await importWithIncompleteAuth<typeof import("../app/api/comments/route")>(
      "../app/api/comments/route"
    );
    const response = await module.POST(
      new Request("http://localhost/api/comments", { method: "POST" })
    );

    expect(response.status).toBe(409);
  });

  it("blocks follow writes with PROFILE_INCOMPLETE", async () => {
    const module = await importWithIncompleteAuth<typeof import("../app/api/follows/route")>(
      "../app/api/follows/route"
    );
    const response = await module.POST(
      new Request("http://localhost/api/follows", { method: "POST" })
    );

    expect(response.status).toBe(409);
  });

  it("blocks notifications reads with PROFILE_INCOMPLETE", async () => {
    const module = await importWithIncompleteAuth<typeof import("../app/api/notifications/route")>(
      "../app/api/notifications/route"
    );
    const response = await module.GET(
      new Request("http://localhost/api/notifications")
    );

    expect(response.status).toBe(409);
  });
});
