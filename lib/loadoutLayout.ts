export type LoadoutLayoutMode = "standard" | "custom";
export type LoadoutWidgetType = "text" | "image" | "gallery" | "product" | "divider";
export type LoadoutTextAlign = "left" | "center" | "right";
export type LoadoutTextStyle = "eyebrow" | "headline" | "body";
export type LoadoutGalleryStyle = "grid" | "stack";
export type LoadoutDividerTone = "muted" | "accent";
export type LoadoutImageAspectRatio = "landscape" | "square" | "portrait";

export const LOADOUT_LAYOUT_VERSION = 1;
export const LOADOUT_GRID_COLUMNS = 12;
export const LOADOUT_WIDGET_MAX_COUNT = 24;
export const LOADOUT_WIDGET_MAX_ROWS = 120;

interface WidgetBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface BaseWidget extends WidgetBounds {
  id: string;
  type: LoadoutWidgetType;
}

export interface TextWidget extends BaseWidget {
  type: "text";
  title: string;
  body: string;
  align: LoadoutTextAlign;
  style: LoadoutTextStyle;
}

export interface ImageWidget extends BaseWidget {
  type: "image";
  imageUrl: string;
  caption: string;
  aspectRatio: LoadoutImageAspectRatio;
}

export interface GalleryWidgetImage {
  id: string;
  imageUrl: string;
  caption: string;
}

export interface GalleryWidget extends BaseWidget {
  type: "gallery";
  layout: LoadoutGalleryStyle;
  images: GalleryWidgetImage[];
}

export interface ProductWidget extends BaseWidget {
  type: "product";
  attachmentKey: string;
  showDescription: boolean;
}

export interface DividerWidget extends BaseWidget {
  type: "divider";
  label: string;
  tone: LoadoutDividerTone;
}

export type LoadoutWidget =
  | TextWidget
  | ImageWidget
  | GalleryWidget
  | ProductWidget
  | DividerWidget;

export interface LoadoutLayout {
  version: typeof LOADOUT_LAYOUT_VERSION;
  widgets: LoadoutWidget[];
}

export interface LayoutValidationOptions {
  allowEmpty?: boolean;
  allowedAttachmentKeys?: string[];
}

export interface LayoutValidationResult {
  ok: boolean;
  layout: LoadoutLayout | null;
  errors: string[];
  referencedAttachmentKeys: string[];
}

function createWidgetId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `widget-${Math.random().toString(36).slice(2, 10)}`;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeBounds(
  input: Partial<WidgetBounds> | undefined,
  fallback: WidgetBounds
): WidgetBounds {
  const x = clamp(
    isPositiveInteger(input?.x) ? input.x : fallback.x,
    0,
    LOADOUT_GRID_COLUMNS - 1
  );
  const y = clamp(
    isPositiveInteger(input?.y) ? input.y : fallback.y,
    0,
    LOADOUT_WIDGET_MAX_ROWS
  );
  const maxWidth = LOADOUT_GRID_COLUMNS - x;
  const w = clamp(
    isPositiveInteger(input?.w) && input.w > 0 ? input.w : fallback.w,
    1,
    Math.max(1, maxWidth)
  );
  const h = clamp(
    isPositiveInteger(input?.h) && input.h > 0 ? input.h : fallback.h,
    1,
    LOADOUT_WIDGET_MAX_ROWS - y + 1
  );

  return { x, y, w, h };
}

function isValidMediaUrl(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  );
}

function normalizeTextAlign(value: unknown): LoadoutTextAlign {
  return value === "center" || value === "right" ? value : "left";
}

function normalizeTextStyle(value: unknown): LoadoutTextStyle {
  if (value === "eyebrow" || value === "body") {
    return value;
  }

  return "headline";
}

function normalizeImageAspectRatio(value: unknown): LoadoutImageAspectRatio {
  if (value === "square" || value === "portrait") {
    return value;
  }

  return "landscape";
}

function normalizeGalleryStyle(value: unknown): LoadoutGalleryStyle {
  return value === "stack" ? "stack" : "grid";
}

function normalizeDividerTone(value: unknown): LoadoutDividerTone {
  return value === "accent" ? "accent" : "muted";
}

function validateWidgetBounds(
  widget: WidgetBounds,
  widgetLabel: string,
  errors: string[]
) {
  if (widget.x + widget.w > LOADOUT_GRID_COLUMNS) {
    errors.push(`${widgetLabel} exceeds the board width.`);
  }

  if (widget.y + widget.h > LOADOUT_WIDGET_MAX_ROWS + 1) {
    errors.push(`${widgetLabel} exceeds the board height.`);
  }
}

export function getAttachmentKey(attachmentType: "product" | "submission", attachmentId: string) {
  return `${attachmentType}:${attachmentId}`;
}

export function isLoadoutLayoutMode(value: unknown): value is LoadoutLayoutMode {
  return value === "standard" || value === "custom";
}

export function normalizeLoadoutLayoutMode(
  value: unknown,
  fallback: LoadoutLayoutMode = "standard"
): LoadoutLayoutMode {
  return isLoadoutLayoutMode(value) ? value : fallback;
}

export function createEmptyLoadoutLayout(): LoadoutLayout {
  return {
    version: LOADOUT_LAYOUT_VERSION,
    widgets: [],
  };
}

export function createDefaultWidget(
  type: LoadoutWidgetType,
  index = 0
): LoadoutWidget {
  const y = index * 4;

  switch (type) {
    case "text":
      return {
        id: createWidgetId(),
        type,
        x: 0,
        y,
        w: 6,
        h: 4,
        title: "Section heading",
        body: "Add context, process notes, or a short explanation.",
        align: "left",
        style: "headline",
      };
    case "image":
      return {
        id: createWidgetId(),
        type,
        x: 0,
        y,
        w: 6,
        h: 4,
        imageUrl: "",
        caption: "",
        aspectRatio: "landscape",
      };
    case "gallery":
      return {
        id: createWidgetId(),
        type,
        x: 0,
        y,
        w: 8,
        h: 5,
        layout: "grid",
        images: [
          { id: createWidgetId(), imageUrl: "", caption: "" },
          { id: createWidgetId(), imageUrl: "", caption: "" },
        ],
      };
    case "product":
      return {
        id: createWidgetId(),
        type,
        x: 0,
        y,
        w: 4,
        h: 4,
        attachmentKey: "",
        showDescription: true,
      };
    case "divider":
      return {
        id: createWidgetId(),
        type,
        x: 0,
        y,
        w: 12,
        h: 1,
        label: "",
        tone: "muted",
      };
  }
}

export function getReferencedAttachmentKeys(layout: LoadoutLayout | null | undefined) {
  if (!layout) {
    return [] as string[];
  }

  return layout.widgets
    .filter((widget): widget is ProductWidget => widget.type === "product")
    .map((widget) => widget.attachmentKey)
    .filter((value, index, collection) => value && collection.indexOf(value) === index);
}

export function sortWidgetsForMobile(widgets: LoadoutWidget[]) {
  return [...widgets].sort((left, right) => {
    if (left.y !== right.y) {
      return left.y - right.y;
    }

    if (left.x !== right.x) {
      return left.x - right.x;
    }

    return left.id.localeCompare(right.id);
  });
}

export function validateLoadoutLayout(
  value: unknown,
  options: LayoutValidationOptions = {}
): LayoutValidationResult {
  const errors: string[] = [];
  const allowedAttachmentKeys = new Set(options.allowedAttachmentKeys ?? []);

  if (value === null || value === undefined) {
    if (options.allowEmpty) {
      return {
        ok: true,
        layout: createEmptyLoadoutLayout(),
        errors: [],
        referencedAttachmentKeys: [],
      };
    }

    return {
      ok: false,
      layout: null,
      errors: ["Custom board data is required."],
      referencedAttachmentKeys: [],
    };
  }

  if (typeof value !== "object") {
    return {
      ok: false,
      layout: null,
      errors: ["Custom board must be a JSON object."],
      referencedAttachmentKeys: [],
    };
  }

  const layoutCandidate = value as { version?: unknown; widgets?: unknown };
  const widgetsCandidate = Array.isArray(layoutCandidate.widgets)
    ? layoutCandidate.widgets
    : null;

  if (widgetsCandidate === null) {
    return {
      ok: false,
      layout: null,
      errors: ["Custom board widgets must be an array."],
      referencedAttachmentKeys: [],
    };
  }

  if (widgetsCandidate.length > LOADOUT_WIDGET_MAX_COUNT) {
    errors.push(`Custom board supports up to ${LOADOUT_WIDGET_MAX_COUNT} widgets.`);
  }

  if (widgetsCandidate.length === 0 && !options.allowEmpty) {
    errors.push("Add at least one widget to the custom board.");
  }

  const seenIds = new Set<string>();
  const normalizedWidgets: LoadoutWidget[] = [];
  const referencedAttachmentKeys: string[] = [];

  widgetsCandidate.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") {
      errors.push(`Widget ${index + 1} is invalid.`);
      return;
    }

    const widget = entry as Record<string, unknown>;
    const widgetId = isNonEmptyString(widget.id) ? widget.id.trim() : `widget-${index + 1}`;
    const widgetType = widget.type;

    if (seenIds.has(widgetId)) {
      errors.push(`Widget ${index + 1} must have a unique id.`);
      return;
    }

    seenIds.add(widgetId);

    if (
      widgetType !== "text" &&
      widgetType !== "image" &&
      widgetType !== "gallery" &&
      widgetType !== "product" &&
      widgetType !== "divider"
    ) {
      errors.push(`Widget ${index + 1} has an unsupported type.`);
      return;
    }

    const baseBounds = normalizeBounds(widget as Partial<WidgetBounds>, {
      x: 0,
      y: index * 4,
      w: widgetType === "divider" ? 12 : 4,
      h: widgetType === "divider" ? 1 : 4,
    });
    const widgetLabel = `Widget ${index + 1}`;
    validateWidgetBounds(baseBounds, widgetLabel, errors);

    switch (widgetType) {
      case "text": {
        const title = typeof widget.title === "string" ? widget.title.trim() : "";
        const body = typeof widget.body === "string" ? widget.body.trim() : "";

        if (!title && !body) {
          errors.push(`${widgetLabel} needs a title or body.`);
        }

        normalizedWidgets.push({
          id: widgetId,
          type: "text",
          ...baseBounds,
          title,
          body,
          align: normalizeTextAlign(widget.align),
          style: normalizeTextStyle(widget.style),
        });
        break;
      }
      case "image": {
        if (!isValidMediaUrl(widget.imageUrl)) {
          errors.push(`${widgetLabel} needs a valid image URL.`);
        }

        normalizedWidgets.push({
          id: widgetId,
          type: "image",
          ...baseBounds,
          imageUrl: typeof widget.imageUrl === "string" ? widget.imageUrl.trim() : "",
          caption: typeof widget.caption === "string" ? widget.caption.trim() : "",
          aspectRatio: normalizeImageAspectRatio(widget.aspectRatio),
        });
        break;
      }
      case "gallery": {
        const imagesCandidate = Array.isArray(widget.images) ? widget.images : [];

        if (imagesCandidate.length < 2 || imagesCandidate.length > 6) {
          errors.push(`${widgetLabel} needs between 2 and 6 images.`);
        }

        const normalizedImages = imagesCandidate.map((image, imageIndex) => {
          const record = image && typeof image === "object" ? (image as Record<string, unknown>) : {};
          const imageUrl = typeof record.imageUrl === "string" ? record.imageUrl.trim() : "";

          if (!isValidMediaUrl(imageUrl)) {
            errors.push(`${widgetLabel} image ${imageIndex + 1} needs a valid URL.`);
          }

          return {
            id: isNonEmptyString(record.id) ? record.id.trim() : `${widgetId}-image-${imageIndex + 1}`,
            imageUrl,
            caption: typeof record.caption === "string" ? record.caption.trim() : "",
          } satisfies GalleryWidgetImage;
        });

        normalizedWidgets.push({
          id: widgetId,
          type: "gallery",
          ...baseBounds,
          layout: normalizeGalleryStyle(widget.layout),
          images: normalizedImages,
        });
        break;
      }
      case "product": {
        const attachmentKey = typeof widget.attachmentKey === "string" ? widget.attachmentKey.trim() : "";

        if (!attachmentKey) {
          errors.push(`${widgetLabel} must reference an attached product.`);
        } else if (allowedAttachmentKeys.size > 0 && !allowedAttachmentKeys.has(attachmentKey)) {
          errors.push(`${widgetLabel} references a product that is not attached to this loadout.`);
        } else {
          referencedAttachmentKeys.push(attachmentKey);
        }

        normalizedWidgets.push({
          id: widgetId,
          type: "product",
          ...baseBounds,
          attachmentKey,
          showDescription: widget.showDescription !== false,
        });
        break;
      }
      case "divider": {
        normalizedWidgets.push({
          id: widgetId,
          type: "divider",
          ...baseBounds,
          label: typeof widget.label === "string" ? widget.label.trim() : "",
          tone: normalizeDividerTone(widget.tone),
        });
        break;
      }
    }
  });

  const normalizedLayout: LoadoutLayout = {
    version: LOADOUT_LAYOUT_VERSION,
    widgets: normalizedWidgets,
  };

  return {
    ok: errors.length === 0,
    layout: errors.length === 0 ? normalizedLayout : null,
    errors,
    referencedAttachmentKeys,
  };
}
