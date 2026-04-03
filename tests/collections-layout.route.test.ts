import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireCompleteUser = vi.fn();
const mockAssertOwner = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();
const mockGetLoadoutAttachmentReferences = vi.fn();

vi.mock("../lib/auth/api", () => ({
  requireCompleteUser: mockRequireCompleteUser,
  assertOwner: mockAssertOwner,
}));

vi.mock("../lib/supabase/server", () => ({
  createSupabaseServerClient: mockCreateSupabaseServerClient,
}));

vi.mock("../lib/loadoutAttachments", () => ({
  getLoadoutAttachmentReferences: mockGetLoadoutAttachmentReferences,
}));

function buildCollectionQuery(data: unknown, error: { message: string } | null = null) {
  return {
    limit: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
}

function buildUpdateQuery(data: unknown, error: { message: string } | null = null) {
  return {
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
}

describe("/api/collections/[id]/layout", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRequireCompleteUser.mockReset();
    mockAssertOwner.mockReset();
    mockCreateSupabaseServerClient.mockReset();
    mockGetLoadoutAttachmentReferences.mockReset();

    mockRequireCompleteUser.mockResolvedValue({ user: { id: "user-1" } });
    mockAssertOwner.mockReturnValue(null);
  });

  it("saves a valid custom layout for the owner", async () => {
    const selectQuery = buildCollectionQuery({
      id: "loadout-1",
      slug: "creator-desk",
      owner_id: "user-1",
      kind: "loadout",
      layout_mode: "custom",
      body_layout: null,
    });
    const updateQuery = buildUpdateQuery({
      id: "loadout-1",
      slug: "creator-desk",
      layout_mode: "custom",
      body_layout: {
        version: 1,
        widgets: [
          {
            id: "widget-1",
            type: "product",
            x: 0,
            y: 0,
            w: 4,
            h: 4,
            attachmentKey: "product:prod-1",
            showDescription: true,
          },
        ],
      },
      body_layout_updated_at: "2026-04-02T00:00:00.000Z",
    });

    mockCreateSupabaseServerClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => selectQuery),
        update: vi.fn(() => updateQuery),
      })),
    });
    mockGetLoadoutAttachmentReferences.mockResolvedValue([
      {
        attachmentType: "product",
        attachmentId: "prod-1",
        attachmentKey: "product:prod-1",
      },
    ]);

    const { PUT } = await import("../app/api/collections/[id]/layout/route");
    const response = await PUT(
      new Request("http://localhost/api/collections/loadout-1/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layoutMode: "custom",
          bodyLayout: {
            version: 1,
            widgets: [
              {
                id: "widget-1",
                type: "product",
                x: 0,
                y: 0,
                w: 4,
                h: 4,
                attachmentKey: "product:prod-1",
                showDescription: true,
              },
            ],
          },
        }),
      }),
      { params: { id: "loadout-1" } }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: "loadout-1",
        slug: "creator-desk",
        layoutMode: "custom",
        bodyLayout: {
          version: 1,
          widgets: [
            {
              id: "widget-1",
              type: "product",
              x: 0,
              y: 0,
              w: 4,
              h: 4,
              attachmentKey: "product:prod-1",
              showDescription: true,
            },
          ],
        },
        bodyLayoutUpdatedAt: "2026-04-02T00:00:00.000Z",
      },
    });
  });

  it("rejects product widgets that point at unattached products", async () => {
    const selectQuery = buildCollectionQuery({
      id: "loadout-1",
      slug: "creator-desk",
      owner_id: "user-1",
      kind: "loadout",
      layout_mode: "custom",
      body_layout: null,
    });

    mockCreateSupabaseServerClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => selectQuery),
        update: vi.fn(),
      })),
    });
    mockGetLoadoutAttachmentReferences.mockResolvedValue([
      {
        attachmentType: "product",
        attachmentId: "prod-1",
        attachmentKey: "product:prod-1",
      },
    ]);

    const { PUT } = await import("../app/api/collections/[id]/layout/route");
    const response = await PUT(
      new Request("http://localhost/api/collections/loadout-1/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layoutMode: "custom",
          bodyLayout: {
            version: 1,
            widgets: [
              {
                id: "widget-1",
                type: "product",
                x: 0,
                y: 0,
                w: 4,
                h: 4,
                attachmentKey: "product:missing",
                showDescription: true,
              },
            ],
          },
        }),
      }),
      { params: { id: "loadout-1" } }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INVALID_LAYOUT",
        message: "Widget 1 references a product that is not attached to this loadout.",
        details: ["Widget 1 references a product that is not attached to this loadout."],
      },
    });
  });

  it("returns 403 for non-owners", async () => {
    const selectQuery = buildCollectionQuery({
      id: "loadout-1",
      slug: "creator-desk",
      owner_id: "owner-2",
      kind: "loadout",
      layout_mode: "standard",
      body_layout: null,
    });

    mockCreateSupabaseServerClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => selectQuery),
        update: vi.fn(),
      })),
    });
    mockAssertOwner.mockReturnValue(
      new Response(
        JSON.stringify({
          error: {
            code: "FORBIDDEN",
            message: "Not allowed",
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    const { PUT } = await import("../app/api/collections/[id]/layout/route");
    const response = await PUT(
      new Request("http://localhost/api/collections/loadout-1/layout", {
        method: "PUT",
      }),
      { params: { id: "loadout-1" } }
    );

    expect(response.status).toBe(403);
  });
});
