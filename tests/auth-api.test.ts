import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateSupabaseServerClient = vi.fn();
const mockGetProfileById = vi.fn();

vi.mock("../lib/supabase/server", () => ({
  createSupabaseServerClient: mockCreateSupabaseServerClient,
}));

vi.mock("../lib/auth/profile", () => ({
  getProfileById: mockGetProfileById,
  isProfileComplete: (profile: { handle?: string | null; display_name?: string | null } | null) =>
    Boolean(profile?.handle && profile?.display_name),
}));

function buildClient(user: unknown, error: unknown = null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error,
      }),
    },
  };
}

describe("lib/auth/api", () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateSupabaseServerClient.mockReset();
    mockGetProfileById.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no authenticated user", async () => {
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient(null));

    const { requireUser } = await import("../lib/auth/api");
    const result = await requireUser();

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toEqual({
        error: {
          code: "UNAUTHORIZED",
          message: "Sign in required",
        },
      });
    }
  });

  it("returns 409 when the user profile is incomplete", async () => {
    const user = { id: "user-1" };
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient(user));
    mockGetProfileById.mockResolvedValue({
      id: "user-1",
      handle: null,
      display_name: null,
    });

    const { requireCompleteUser } = await import("../lib/auth/api");
    const result = await requireCompleteUser();

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(409);
      await expect(result.response.json()).resolves.toEqual({
        error: {
          code: "PROFILE_INCOMPLETE",
          message: "Complete profile setup",
        },
      });
    }
  });

  it("returns the user and profile when auth and profile are complete", async () => {
    const user = { id: "user-1", email: "person@example.com" };
    const profile = {
      id: "user-1",
      handle: "person",
      display_name: "Person",
    };
    mockCreateSupabaseServerClient.mockResolvedValue(buildClient(user));
    mockGetProfileById.mockResolvedValue(profile);

    const { requireCompleteUser } = await import("../lib/auth/api");
    const result = await requireCompleteUser();

    expect("response" in result).toBe(false);
    if (!("response" in result)) {
      expect(result.user).toEqual(user);
      expect(result.profile).toEqual(profile);
    }
  });
});
