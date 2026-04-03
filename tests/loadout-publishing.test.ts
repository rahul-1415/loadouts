import { describe, expect, it } from "vitest";
import {
  buildPublishValidation,
  normalizeRequestedStatus,
  slugifyLoadoutTitle,
} from "../lib/loadoutPublishing";

describe("loadout publishing helpers", () => {
  it("normalizes known statuses and falls back safely", () => {
    expect(normalizeRequestedStatus("published")).toBe("published");
    expect(normalizeRequestedStatus("archived")).toBe("archived");
    expect(normalizeRequestedStatus("unknown", "draft")).toBe("draft");
  });

  it("marks publish requirements incomplete when cover and products are missing", () => {
    const result = buildPublishValidation({
      title: "Creator Desk",
      categoryId: "cat-001",
      productCount: 0,
    });

    expect(result.canPublish).toBe(false);
    expect(result.missing).toEqual(["at least one product"]);
  });

  it("requires a valid custom board when publishing in custom mode", () => {
    const result = buildPublishValidation({
      title: "Creator Desk",
      categoryId: "cat-001",
      productCount: 1,
      layoutMode: "custom",
      bodyLayout: {
        version: 1,
        widgets: [],
      },
      allowedAttachmentKeys: ["product:1"],
    });

    expect(result.canPublish).toBe(false);
    expect(result.missing).toEqual(["custom board"]);
  });

  it("allows publishing when all required fields exist", () => {
    const result = buildPublishValidation({
      title: "Creator Desk",
      categoryId: "cat-001",
      productCount: 3,
    });

    expect(result.canPublish).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("allows publishing a valid custom board", () => {
    const result = buildPublishValidation({
      title: "Creator Desk",
      categoryId: "cat-001",
      productCount: 1,
      layoutMode: "custom",
      bodyLayout: {
        version: 1,
        widgets: [
          {
            id: "widget-1",
            type: "text",
            x: 0,
            y: 0,
            w: 6,
            h: 4,
            title: "Desk Setup",
            body: "",
            align: "left",
            style: "headline",
          },
        ],
      },
      allowedAttachmentKeys: ["product:1"],
    });

    expect(result.canPublish).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("slugifies loadout titles without adding random suffixes", () => {
    expect(slugifyLoadoutTitle("  My Creator Desk  ")).toBe("my-creator-desk");
    expect(slugifyLoadoutTitle("Video / Starter Kit!!!")).toBe(
      "video-starter-kit"
    );
  });
});
