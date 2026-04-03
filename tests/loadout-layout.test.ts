import { describe, expect, it } from "vitest";
import { validateLoadoutLayout } from "../lib/loadoutLayout";

describe("loadout layout validation", () => {
  it("accepts a valid mixed widget layout", () => {
    const result = validateLoadoutLayout(
      {
        version: 1,
        widgets: [
          {
            id: "widget-1",
            type: "text",
            x: 0,
            y: 0,
            w: 6,
            h: 4,
            title: "Creator Desk",
            body: "What is on the desk and why.",
            align: "left",
            style: "headline",
          },
          {
            id: "widget-2",
            type: "product",
            x: 6,
            y: 0,
            w: 6,
            h: 4,
            attachmentKey: "product:mx-master-3s",
            showDescription: true,
          },
        ],
      },
      {
        allowEmpty: false,
        allowedAttachmentKeys: ["product:mx-master-3s"],
      }
    );

    expect(result.ok).toBe(true);
    expect(result.layout?.widgets).toHaveLength(2);
  });

  it("rejects image widgets without valid media urls", () => {
    const result = validateLoadoutLayout(
      {
        version: 1,
        widgets: [
          {
            id: "widget-1",
            type: "image",
            x: 0,
            y: 0,
            w: 6,
            h: 4,
            imageUrl: "",
            caption: "",
            aspectRatio: "landscape",
          },
        ],
      },
      { allowEmpty: false }
    );

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("valid image URL");
  });

  it("rejects product widgets that reference unattached products", () => {
    const result = validateLoadoutLayout(
      {
        version: 1,
        widgets: [
          {
            id: "widget-1",
            type: "product",
            x: 0,
            y: 0,
            w: 4,
            h: 4,
            attachmentKey: "product:not-attached",
            showDescription: true,
          },
        ],
      },
      {
        allowEmpty: false,
        allowedAttachmentKeys: ["product:attached"],
      }
    );

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("not attached");
  });
});
