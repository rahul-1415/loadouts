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

  it("allows publishing when all required fields exist", () => {
    const result = buildPublishValidation({
      title: "Creator Desk",
      categoryId: "cat-001",
      productCount: 3,
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
