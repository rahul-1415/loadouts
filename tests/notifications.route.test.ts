import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireCompleteUser = vi.fn();
const mockDecodeNotificationCursor = vi.fn();
const mockGetNotificationsByRecipient = vi.fn();
const mockMarkNotificationsRead = vi.fn();
const mockTrackMilestoneEvent = vi.fn();

vi.mock("../lib/auth/api", () => ({
  requireCompleteUser: mockRequireCompleteUser,
}));

vi.mock("../lib/data/notifications", () => ({
  decodeNotificationCursor: mockDecodeNotificationCursor,
  getNotificationsByRecipient: mockGetNotificationsByRecipient,
  markNotificationsRead: mockMarkNotificationsRead,
}));

vi.mock("../lib/data/analytics", () => ({
  trackMilestoneEvent: mockTrackMilestoneEvent,
  captureOperationalEvent: vi.fn(),
}));

describe("/api/notifications", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRequireCompleteUser.mockReset();
    mockDecodeNotificationCursor.mockReset();
    mockGetNotificationsByRecipient.mockReset();
    mockMarkNotificationsRead.mockReset();
    mockTrackMilestoneEvent.mockReset();
  });

  it("returns paginated notification data for a complete user", async () => {
    mockRequireCompleteUser.mockResolvedValue({ user: { id: "user-1" } });
    mockDecodeNotificationCursor.mockReturnValue(null);
    mockGetNotificationsByRecipient.mockResolvedValue({
      items: [
        {
          id: "note-1",
          type: "follow",
          actor: { handle: "dev", displayName: "Dev" },
          isRead: false,
          createdAt: "2026-03-23T00:00:00.000Z",
          targetHref: "/profile/dev",
          targetLabel: "View profile",
          contextText: null,
          previewText: null,
        },
      ],
      nextCursor: null,
      hasMore: false,
    });

    const { GET, PATCH } = await import("../app/api/notifications/route");
    const getResponse = await GET(new Request("http://localhost/api/notifications?limit=10"));
    expect(getResponse.status).toBe(200);
    await expect(getResponse.json()).resolves.toMatchObject({
      data: {
        items: [{ id: "note-1" }],
        hasMore: false,
      },
    });

    const patchResponse = await PATCH(
      new Request("http://localhost/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: ["note-1"] }),
      })
    );

    expect(patchResponse.status).toBe(200);
    expect(mockMarkNotificationsRead).toHaveBeenCalledWith("user-1", ["note-1"]);
  });
});
