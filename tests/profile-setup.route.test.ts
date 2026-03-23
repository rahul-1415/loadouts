import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireUser = vi.fn();
const mockGetProfileById = vi.fn();
const mockIsUsernameAvailable = vi.fn();
const mockValidateUsername = vi.fn();
const mockTrackMilestoneEvent = vi.fn();
const mockCaptureOperationalEvent = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();

vi.mock("../lib/auth/api", () => ({
  requireUser: mockRequireUser,
}));

vi.mock("../lib/auth/profile", () => ({
  getProfileById: mockGetProfileById,
  isUsernameAvailable: mockIsUsernameAvailable,
}));

vi.mock("../lib/auth/username", () => ({
  validateUsername: mockValidateUsername,
}));

vi.mock("../lib/data/analytics", () => ({
  trackMilestoneEvent: mockTrackMilestoneEvent,
  captureOperationalEvent: mockCaptureOperationalEvent,
}));

vi.mock("../lib/supabase/server", () => ({
  createSupabaseServerClient: mockCreateSupabaseServerClient,
}));

describe("POST /api/profile/setup", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRequireUser.mockReset();
    mockGetProfileById.mockReset();
    mockIsUsernameAvailable.mockReset();
    mockValidateUsername.mockReset();
    mockTrackMilestoneEvent.mockReset();
    mockCaptureOperationalEvent.mockReset();
    mockCreateSupabaseServerClient.mockReset();
  });

  it("saves the profile and records success instrumentation", async () => {
    mockRequireUser.mockResolvedValue({ user: { id: "user-1" } });
    mockValidateUsername.mockReturnValue({
      ok: true,
      normalizedUsername: "rahul",
    });
    mockGetProfileById.mockResolvedValue(null);
    mockIsUsernameAvailable.mockResolvedValue(true);

    const single = vi.fn().mockResolvedValue({
      data: {
        id: "user-1",
        handle: "rahul",
        display_name: "Rahul",
        avatar_url: null,
        bio: null,
        interests: [],
      },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const upsert = vi.fn(() => ({ select }));
    mockCreateSupabaseServerClient.mockResolvedValue({
      from: vi.fn(() => ({ upsert })),
    });

    const { POST } = await import("../app/api/profile/setup/route");
    const response = await POST(
      new Request("http://localhost/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "rahul", displayName: "Rahul" }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        handle: "rahul",
        display_name: "Rahul",
      },
    });
    expect(mockTrackMilestoneEvent).toHaveBeenCalled();
    expect(mockCaptureOperationalEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "profile_setup_completed",
        status: "success",
      })
    );
  });

  it("returns 409 when the username is already taken", async () => {
    mockRequireUser.mockResolvedValue({ user: { id: "user-1" } });
    mockValidateUsername.mockReturnValue({
      ok: true,
      normalizedUsername: "taken-name",
    });
    mockGetProfileById.mockResolvedValue(null);
    mockIsUsernameAvailable.mockResolvedValue(false);

    const { POST } = await import("../app/api/profile/setup/route");
    const response = await POST(
      new Request("http://localhost/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "taken-name", displayName: "Taken" }),
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "TAKEN",
        message: "This username is already taken.",
      },
    });
  });
});
