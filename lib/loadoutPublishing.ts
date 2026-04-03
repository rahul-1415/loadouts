import type { LoadoutStatus } from "./data/collections";
import {
  validateLoadoutLayout,
  type LoadoutLayoutMode,
} from "./loadoutLayout";

export function normalizeRequestedStatus(value: unknown, fallback: LoadoutStatus = "draft") {
  if (value === "draft" || value === "published" || value === "archived") {
    return value;
  }

  return fallback;
}

export function buildPublishValidation({
  title,
  categoryId,
  productCount,
  layoutMode = "standard",
  bodyLayout = null,
  allowedAttachmentKeys = [],
}: {
  title: string;
  categoryId: string | null;
  productCount: number;
  layoutMode?: LoadoutLayoutMode;
  bodyLayout?: unknown;
  allowedAttachmentKeys?: string[];
}) {
  const missing: string[] = [];

  if (!title.trim()) {
    missing.push("title");
  }

  if (!categoryId) {
    missing.push("category");
  }

  if (productCount < 1) {
    missing.push("at least one product");
  }

  if (layoutMode === "custom") {
    const layoutValidation = validateLoadoutLayout(bodyLayout, {
      allowEmpty: false,
      allowedAttachmentKeys,
    });

    if (!layoutValidation.ok) {
      missing.push("custom board");
    }
  }

  return {
    canPublish: missing.length === 0,
    missing,
  };
}

export function slugifyLoadoutTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
