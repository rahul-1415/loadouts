const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export type UploadKind = "avatar" | "loadout-cover" | "product-image";

export const uploadBucket = "media";

export function validateUploadKind(value: unknown): value is UploadKind {
  return value === "avatar" || value === "loadout-cover" || value === "product-image";
}

export function validateUploadFile(file: File) {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return {
      ok: false,
      message: "Only JPG, PNG, WebP, AVIF, and GIF files are allowed.",
    } as const;
  }

  if (file.size > 6 * 1024 * 1024) {
    return {
      ok: false,
      message: "File size must be 6MB or smaller.",
    } as const;
  }

  return { ok: true } as const;
}

export function sanitizeFileName(value: string) {
  const parts = value.split(".");
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() ?? "bin" : "bin";
  const baseName = parts.join(".") || "upload";
  const safeBaseName =
    baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "upload";

  return `${safeBaseName}.${extension}`;
}

export function buildUploadPath({
  userId,
  kind,
  fileName,
}: {
  userId: string;
  kind: UploadKind;
  fileName: string;
}) {
  const safeName = sanitizeFileName(fileName);
  return `${userId}/${kind}/${Date.now().toString(36)}-${safeName}`;
}
