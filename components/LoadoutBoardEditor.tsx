"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import Button from "./Button";
import ImageUploadField from "./ImageUploadField";
import LoadoutBoardRenderer from "./LoadoutBoardRenderer";
import type { LoadoutProductItem } from "./LoadoutProductsManager";
import {
  LOADOUT_GRID_COLUMNS,
  createDefaultWidget,
  createEmptyLoadoutLayout,
  validateLoadoutLayout,
  type GalleryWidget,
  type LoadoutLayout,
  type LoadoutWidget,
  type LoadoutWidgetType,
} from "../lib/loadoutLayout";

const ROW_HEIGHT = 84;
const MAX_ROWS = 120;

interface LoadoutBoardEditorProps {
  collectionIdentifier: string;
  initialLayout: LoadoutLayout | null;
  products: LoadoutProductItem[];
}

type InteractionMode = "drag" | "resize";

interface ActiveInteraction {
  mode: InteractionMode;
  widgetId: string;
  startX: number;
  startY: number;
  startWidget: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ensureLayout(layout: LoadoutLayout | null) {
  if (layout?.widgets) {
    return layout;
  }

  return createEmptyLoadoutLayout();
}

function replaceWidget(
  layout: LoadoutLayout,
  widgetId: string,
  updater: (widget: LoadoutWidget) => LoadoutWidget
): LoadoutLayout {
  return {
    ...layout,
    widgets: layout.widgets.map((widget) =>
      widget.id === widgetId ? updater(widget) : widget
    ),
  };
}

function removeWidget(layout: LoadoutLayout, widgetId: string): LoadoutLayout {
  return {
    ...layout,
    widgets: layout.widgets.filter((widget) => widget.id !== widgetId),
  };
}

function boardHeight(layout: LoadoutLayout) {
  const maxRow = layout.widgets.reduce(
    (currentMax, widget) => Math.max(currentMax, widget.y + widget.h),
    6
  );

  return maxRow * ROW_HEIGHT;
}

function compactMessage(products: LoadoutProductItem[]) {
  if (products.length === 0) {
    return "Attach products first if you want to place product widgets on the board.";
  }

  return `${products.length} attached product${products.length === 1 ? "" : "s"} available for product widgets.`;
}

function serializeLayout(layout: LoadoutLayout) {
  return JSON.stringify(layout);
}

function parseLayout(serializedLayout: string): LoadoutLayout {
  return JSON.parse(serializedLayout) as LoadoutLayout;
}

function describeWidget(
  widget: LoadoutWidget,
  products: LoadoutProductItem[]
) {
  switch (widget.type) {
    case "text":
      return widget.title.trim() || "Text block";
    case "image":
      return widget.caption.trim() || "Single image";
    case "gallery":
      return `Gallery (${widget.images.length})`;
    case "product": {
      const product = products.find(
        (entry) => entry.attachmentKey === widget.attachmentKey
      );
      return product?.name ?? "Product card";
    }
    case "divider":
      return widget.label.trim() || "Divider";
  }
}

function duplicateSelectedWidget(
  layout: LoadoutLayout,
  widgetId: string
): { layout: LoadoutLayout; duplicatedId: string | null } {
  const widgetIndex = layout.widgets.findIndex((widget) => widget.id === widgetId);

  if (widgetIndex < 0) {
    return { layout, duplicatedId: null };
  }

  const sourceWidget = layout.widgets[widgetIndex];
  const duplicatedId = `${sourceWidget.id}-copy-${Date.now().toString(36)}`;
  const duplicatedWidget = JSON.parse(
    JSON.stringify(sourceWidget)
  ) as LoadoutWidget;

  duplicatedWidget.id = duplicatedId;
  duplicatedWidget.x = clamp(
    sourceWidget.x + 1,
    0,
    LOADOUT_GRID_COLUMNS - sourceWidget.w
  );
  duplicatedWidget.y = clamp(sourceWidget.y + 1, 0, MAX_ROWS - sourceWidget.h);

  if (duplicatedWidget.type === "gallery") {
    duplicatedWidget.images = duplicatedWidget.images.map((image, index) => ({
      ...image,
      id: `${duplicatedId}-image-${index + 1}`,
    }));
  }

  return {
    duplicatedId,
    layout: {
      ...layout,
      widgets: [
        ...layout.widgets.slice(0, widgetIndex + 1),
        duplicatedWidget,
        ...layout.widgets.slice(widgetIndex + 1),
      ],
    },
  };
}

export default function LoadoutBoardEditor({
  collectionIdentifier,
  initialLayout,
  products,
}: LoadoutBoardEditorProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<LoadoutLayout>(() => ensureLayout(initialLayout));
  const [savedLayoutSignature, setSavedLayoutSignature] = useState(() =>
    serializeLayout(ensureLayout(initialLayout))
  );
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(
    ensureLayout(initialLayout).widgets[0]?.id ?? null
  );
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [interaction, setInteraction] = useState<ActiveInteraction | null>(null);

  useEffect(() => {
    const nextLayout = ensureLayout(initialLayout);
    setLayout(nextLayout);
    setSavedLayoutSignature(serializeLayout(nextLayout));
    setSelectedWidgetId((currentSelectedWidgetId) => {
      if (
        currentSelectedWidgetId &&
        nextLayout.widgets.some((widget) => widget.id === currentSelectedWidgetId)
      ) {
        return currentSelectedWidgetId;
      }

      return nextLayout.widgets[0]?.id ?? null;
    });
  }, [initialLayout]);

  useEffect(() => {
    if (!canvasRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const element = canvasRef.current;
    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      setCanvasWidth(nextWidth);
    });

    observer.observe(element);
    setCanvasWidth(element.getBoundingClientRect().width);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!interaction || canvasWidth <= 0) {
      return;
    }

    const activeInteraction = interaction;
    const columnWidth = canvasWidth / LOADOUT_GRID_COLUMNS;

    function handlePointerMove(event: PointerEvent) {
      const deltaColumns = Math.round(
        (event.clientX - activeInteraction.startX) / columnWidth
      );
      const deltaRows = Math.round(
        (event.clientY - activeInteraction.startY) / ROW_HEIGHT
      );

      setLayout((currentLayout) =>
        replaceWidget(currentLayout, activeInteraction.widgetId, (widget) => {
          if (activeInteraction.mode === "drag") {
            const nextX = clamp(
              activeInteraction.startWidget.x + deltaColumns,
              0,
              LOADOUT_GRID_COLUMNS - activeInteraction.startWidget.w
            );
            const nextY = clamp(
              activeInteraction.startWidget.y + deltaRows,
              0,
              MAX_ROWS - activeInteraction.startWidget.h
            );

            return {
              ...widget,
              x: nextX,
              y: nextY,
            };
          }

          const nextW = clamp(
            activeInteraction.startWidget.w + deltaColumns,
            1,
            LOADOUT_GRID_COLUMNS - activeInteraction.startWidget.x
          );
          const nextH = clamp(
            activeInteraction.startWidget.h + deltaRows,
            1,
            MAX_ROWS - activeInteraction.startWidget.y
          );

          return {
            ...widget,
            w: nextW,
            h: nextH,
          };
        })
      );
    }

    function handlePointerUp() {
      setInteraction(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [interaction, canvasWidth]);

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        attachmentKey: product.attachmentKey,
        label: product.brand ? `${product.name} - ${product.brand}` : product.name,
      })),
    [products]
  );

  const selectedWidget = useMemo(
    () => layout.widgets.find((widget) => widget.id === selectedWidgetId) ?? null,
    [layout.widgets, selectedWidgetId]
  );
  const layoutSignature = useMemo(() => serializeLayout(layout), [layout]);
  const hasUnsavedChanges = layoutSignature !== savedLayoutSignature;

  const localValidation = useMemo(
    () =>
      validateLoadoutLayout(layout, {
        allowEmpty: true,
        allowedAttachmentKeys: products.map((product) => product.attachmentKey),
      }),
    [layout, products]
  );

  function addWidget(type: LoadoutWidgetType) {
    if (type === "product" && productOptions.length === 0) {
      setErrorMessage("Attach at least one product before placing a product widget.");
      return;
    }

    const widget = createDefaultWidget(type, layout.widgets.length);

    if (widget.type === "product" && productOptions[0]) {
      widget.attachmentKey = productOptions[0].attachmentKey;
    }

    setLayout((currentLayout) => ({
      ...currentLayout,
      widgets: [...currentLayout.widgets, widget],
    }));
    setSelectedWidgetId(widget.id);
    setPreviewMode(false);
    setMessage(null);
    setErrorMessage(null);
  }

  function updateSelectedWidget(updater: (widget: LoadoutWidget) => LoadoutWidget) {
    if (!selectedWidgetId) {
      return;
    }

    setLayout((currentLayout) => replaceWidget(currentLayout, selectedWidgetId, updater));
    setMessage(null);
    setErrorMessage(null);
  }

  function beginInteraction(
    event: ReactPointerEvent<HTMLButtonElement>,
    widget: LoadoutWidget,
    mode: InteractionMode
  ) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedWidgetId(widget.id);
    setInteraction({
      mode,
      widgetId: widget.id,
      startX: event.clientX,
      startY: event.clientY,
      startWidget: {
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h,
      },
    });
  }

  async function saveBoard() {
    setErrorMessage(null);
    setMessage(null);

    if (!localValidation.ok) {
      setErrorMessage(localValidation.errors[0] ?? "Custom board is invalid.");
      return;
    }

    setSaving(true);

    const response = await fetch(
      `/api/collections/${encodeURIComponent(collectionIdentifier)}/layout`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          layoutMode: "custom",
          bodyLayout: layout,
        }),
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string; details?: string[] } }
        | null;
      setErrorMessage(payload?.error?.message ?? "Unable to save custom board.");
      setSaving(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { data?: { bodyLayout?: LoadoutLayout | null } }
      | null;

    if (payload?.data?.bodyLayout) {
      setLayout(payload.data.bodyLayout);
      setSavedLayoutSignature(serializeLayout(payload.data.bodyLayout));
    } else {
      setSavedLayoutSignature(serializeLayout(layout));
    }

    setMessage("Custom board saved.");
    setSaving(false);
    router.refresh();
  }

  function resetUnsavedChanges() {
    const restoredLayout = parseLayout(savedLayoutSignature);
    setLayout(restoredLayout);
    setSelectedWidgetId(restoredLayout.widgets[0]?.id ?? null);
    setMessage("Unsaved board changes discarded.");
    setErrorMessage(null);
    setPreviewMode(false);
  }

  function updateGalleryImage(
    widget: GalleryWidget,
    imageId: string,
    updater: (current: GalleryWidget["images"][number]) => GalleryWidget["images"][number]
  ) {
    updateSelectedWidget((currentWidget) => {
      if (currentWidget.type !== "gallery") {
        return currentWidget;
      }

      return {
        ...currentWidget,
        images: currentWidget.images.map((image) =>
          image.id === imageId ? updater(image) : image
        ),
      };
    });
  }

  const currentHeight = boardHeight(layout);

  return (
    <section className="space-y-5 rounded-3xl border border-white/[0.05] bg-[#171717] p-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
              Custom Board
            </p>
            <h2 className="text-2xl font-semibold text-white">Arrange your loadout body</h2>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">
              {hasUnsavedChanges ? "Unsaved changes" : "Board saved"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={previewMode ? "secondary" : "primary"}
              className="px-4 py-2 text-[10px]"
              onClick={() => setPreviewMode(false)}
            >
              Edit Board
            </Button>
            <Button
              type="button"
              variant={previewMode ? "primary" : "secondary"}
              className="px-4 py-2 text-[10px]"
              onClick={() => setPreviewMode(true)}
            >
              Preview
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="px-4 py-2 text-[10px]"
              onClick={resetUnsavedChanges}
              disabled={!hasUnsavedChanges || saving}
            >
              Discard
            </Button>
            <Button
              type="button"
              onClick={saveBoard}
              disabled={saving || !hasUnsavedChanges}
            >
              {saving ? "Saving..." : "Save Board"}
            </Button>
          </div>
        </div>
        <p className="text-sm text-white/70">
          Add text, images, galleries, dividers, and attached products. Drag widgets to move them and use the corner handle to resize.
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">
          {compactMessage(products)}
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="space-y-3 rounded-2xl border border-white/[0.04] bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Add Widget</p>
          <div className="grid gap-2">
            {([
              ["text", "Text block"],
              ["image", "Single image"],
              ["gallery", "Gallery"],
              ["product", "Product card"],
              ["divider", "Divider"],
            ] as Array<[LoadoutWidgetType, string]>).map(([type, label]) => (
              <Button
                key={type}
                type="button"
                variant="secondary"
                onClick={() => addWidget(type)}
                disabled={type === "product" && productOptions.length === 0}
              >
                {label}
              </Button>
            ))}
          </div>
          {layout.widgets.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-white/[0.05] bg-[#111111] p-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">
                Widget Outline
              </p>
              <div className="space-y-2">
                {layout.widgets.map((widget, index) => {
                  const isSelected = widget.id === selectedWidgetId;

                  return (
                    <button
                      key={widget.id}
                      type="button"
                      onClick={() => {
                        setSelectedWidgetId(widget.id);
                        setPreviewMode(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
                        isSelected
                          ? "border-[#d4dd7f]/45 bg-[#1e2113] text-white"
                          : "border-white/[0.05] bg-[#171717] text-white/68 hover:border-white/[0.12]"
                      }`}
                    >
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                          {index + 1}. {widget.type}
                        </p>
                        <p className="mt-1 text-sm">
                          {describeWidget(widget, products)}
                        </p>
                      </div>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-white/38">
                        {widget.w}x{widget.h}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="rounded-2xl border border-white/[0.05] bg-[#111111] px-4 py-3 text-sm text-white/62">
            Desktop-first editor. Public boards still reflow into a single column on mobile.
          </div>
          {!localValidation.ok ? (
            <div className="rounded-2xl border border-[#fda4a4]/30 bg-[#190d0d] px-4 py-3 text-sm text-[#fda4a4]">
              {localValidation.errors[0]}
            </div>
          ) : null}
        </aside>

        <div className="space-y-4">
          {previewMode ? (
            <LoadoutBoardRenderer layout={layout} products={products} />
          ) : (
            <div
              ref={canvasRef}
              className="relative overflow-hidden rounded-[2rem] border border-white/[0.05] bg-[#111111]"
              style={{
                minHeight: `${currentHeight}px`,
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                backgroundSize: `${Math.max(canvasWidth / LOADOUT_GRID_COLUMNS, 24)}px ${ROW_HEIGHT}px`,
              }}
            >
              {layout.widgets.length === 0 ? (
                <div className="flex min-h-[420px] items-center justify-center px-6 text-center text-sm text-white/55">
                  Add your first widget from the left rail.
                </div>
              ) : null}

              {layout.widgets.map((widget) => {
                const isSelected = widget.id === selectedWidgetId;

                return (
                  <article
                    key={widget.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedWidgetId(widget.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedWidgetId(widget.id);
                      }
                    }}
                    className={`absolute overflow-hidden rounded-[1.7rem] border bg-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition ${
                      widget.type === "divider"
                        ? "border-transparent bg-transparent shadow-none"
                        : isSelected
                          ? "border-[#d4dd7f]/45"
                          : "border-white/[0.05]"
                    }`}
                    style={{
                      left: `${(widget.x / LOADOUT_GRID_COLUMNS) * 100}%`,
                      width: `${(widget.w / LOADOUT_GRID_COLUMNS) * 100}%`,
                      top: `${widget.y * ROW_HEIGHT}px`,
                      height: `${widget.h * ROW_HEIGHT}px`,
                    }}
                  >
                    {widget.type !== "divider" ? (
                      <div className="flex items-center justify-between border-b border-white/[0.05] px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-white/45">
                        <button
                          type="button"
                          onPointerDown={(event) => beginInteraction(event, widget, "drag")}
                          className="rounded-full border border-white/[0.08] px-2 py-1 text-white/58 transition hover:border-white/[0.16] hover:text-white"
                        >
                          Move
                        </button>
                        <span>{widget.type}</span>
                      </div>
                    ) : null}

                    <div className={widget.type === "divider" ? "h-full p-2" : "h-[calc(100%-2.5rem)] overflow-auto p-3"}>
                      <LoadoutBoardRenderer
                        layout={{
                          version: layout.version,
                          widgets: [
                            {
                              ...widget,
                              x: 0,
                              y: 0,
                              w: LOADOUT_GRID_COLUMNS,
                            },
                          ],
                        }}
                        products={products}
                      />
                    </div>

                    <button
                      type="button"
                      onPointerDown={(event) => beginInteraction(event, widget, "resize")}
                      className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border text-[10px] ${
                        widget.type === "divider"
                          ? "hidden"
                          : "border-white/[0.08] bg-[#0d0d0d] text-white/55"
                      }`}
                      aria-label="Resize widget"
                    >
                      +
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-4 rounded-2xl border border-white/[0.04] bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Inspector</p>
            {selectedWidget ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1.5 text-[10px]"
                  onClick={() => {
                    const result = duplicateSelectedWidget(layout, selectedWidget.id);
                    setLayout(result.layout);
                    setSelectedWidgetId(result.duplicatedId);
                    setPreviewMode(false);
                    setMessage(null);
                    setErrorMessage(null);
                  }}
                >
                  Duplicate
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1.5 text-[10px] border-[#fda4a4]/40 text-[#fda4a4]"
                  onClick={() => {
                    setLayout((currentLayout) => {
                      const nextLayout = removeWidget(currentLayout, selectedWidget.id);
                      setSelectedWidgetId(
                        nextLayout.widgets.find((widget) => widget.id !== selectedWidget.id)?.id ??
                          null
                      );
                      return nextLayout;
                    });
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : null}
          </div>

          {!selectedWidget ? (
            <p className="text-sm text-white/62">Select a widget to edit its content and grid position.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ["x", selectedWidget.x],
                  ["y", selectedWidget.y],
                  ["w", selectedWidget.w],
                  ["h", selectedWidget.h],
                ] as const).map(([key, value]) => (
                  <label key={key} className="space-y-2 text-xs uppercase tracking-[0.2em] text-white/50">
                    {key}
                    <input
                      type="number"
                      min={0}
                      value={value}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        updateSelectedWidget((widget) => {
                          if (key === "x") {
                            return { ...widget, x: clamp(nextValue, 0, LOADOUT_GRID_COLUMNS - widget.w) };
                          }
                          if (key === "y") {
                            return { ...widget, y: clamp(nextValue, 0, MAX_ROWS - widget.h) };
                          }
                          if (key === "w") {
                            return { ...widget, w: clamp(nextValue, 1, LOADOUT_GRID_COLUMNS - widget.x) };
                          }

                          return { ...widget, h: clamp(nextValue, 1, MAX_ROWS - widget.y) };
                        });
                      }}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white"
                    />
                  </label>
                ))}
              </div>

              {selectedWidget.type === "text" ? (
                <div className="space-y-3">
                  <input
                    value={selectedWidget.title}
                    onChange={(event) =>
                      updateSelectedWidget((widget) =>
                        widget.type === "text"
                          ? { ...widget, title: event.target.value }
                          : widget
                      )
                    }
                    placeholder="Heading"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/35"
                  />
                  <textarea
                    value={selectedWidget.body}
                    onChange={(event) =>
                      updateSelectedWidget((widget) =>
                        widget.type === "text" ? { ...widget, body: event.target.value } : widget
                      )
                    }
                    rows={5}
                    placeholder="Body copy"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/35"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={selectedWidget.style}
                      onChange={(event) =>
                        updateSelectedWidget((widget) =>
                          widget.type === "text"
                            ? {
                                ...widget,
                                style:
                                  event.target.value === "eyebrow" ||
                                  event.target.value === "body"
                                    ? event.target.value
                                    : "headline",
                              }
                            : widget
                        )
                      }
                      className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white"
                    >
                      <option value="headline">Headline</option>
                      <option value="body">Body</option>
                      <option value="eyebrow">Eyebrow</option>
                    </select>
                    <select
                      value={selectedWidget.align}
                      onChange={(event) =>
                        updateSelectedWidget((widget) =>
                          widget.type === "text"
                            ? {
                                ...widget,
                                align:
                                  event.target.value === "center" || event.target.value === "right"
                                    ? event.target.value
                                    : "left",
                              }
                            : widget
                        )
                      }
                      className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              ) : null}

              {selectedWidget.type === "image" ? (
                <div className="space-y-3">
                  <ImageUploadField
                    label="Image"
                    kind="layout-image"
                    value={selectedWidget.imageUrl}
                    onChange={(value) =>
                      updateSelectedWidget((widget) =>
                        widget.type === "image" ? { ...widget, imageUrl: value } : widget
                      )
                    }
                    helpText="Upload board media to the shared media bucket."
                  />
                  <input
                    value={selectedWidget.caption}
                    onChange={(event) =>
                      updateSelectedWidget((widget) =>
                        widget.type === "image"
                          ? { ...widget, caption: event.target.value }
                          : widget
                      )
                    }
                    placeholder="Caption"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/35"
                  />
                  <select
                    value={selectedWidget.aspectRatio}
                    onChange={(event) =>
                      updateSelectedWidget((widget) =>
                        widget.type === "image"
                          ? {
                              ...widget,
                              aspectRatio:
                                event.target.value === "square" ||
                                event.target.value === "portrait"
                                  ? event.target.value
                                  : "landscape",
                            }
                          : widget
                      )
                    }
                    className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white"
                  >
                    <option value="landscape">Landscape</option>
                    <option value="square">Square</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>
              ) : null}

              {selectedWidget.type === "gallery" ? (
                <div className="space-y-3">
                  <select
                    value={selectedWidget.layout}
                    onChange={(event) =>
                      updateSelectedWidget((widget) =>
                        widget.type === "gallery"
                          ? {
                              ...widget,
                              layout: event.target.value === "stack" ? "stack" : "grid",
                            }
                          : widget
                      )
                    }
                    className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white"
                  >
                    <option value="grid">Grid</option>
                    <option value="stack">Stack</option>
                  </select>
                  {selectedWidget.images.map((image) => (
                    <div key={image.id} className="space-y-3 rounded-2xl border border-white/[0.05] bg-[#111111] p-3">
                      <ImageUploadField
                        label="Gallery Image"
                        kind="layout-image"
                        value={image.imageUrl}
                        onChange={(value) =>
                          updateGalleryImage(selectedWidget, image.id, (current) => ({
                            ...current,
                            imageUrl: value,
                          }))
                        }
                      />
                      <input
                        value={image.caption}
                        onChange={(event) =>
                          updateGalleryImage(selectedWidget, image.id, (current) => ({
                            ...current,
                            caption: event.target.value,
                          }))
                        }
                        placeholder="Caption"
                        className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/35"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-1.5 text-[10px] border-[#fda4a4]/40 text-[#fda4a4]"
                        onClick={() =>
                          updateSelectedWidget((widget) => {
                            if (widget.type !== "gallery" || widget.images.length <= 2) {
                              return widget;
                            }

                            return {
                              ...widget,
                              images: widget.images.filter((entry) => entry.id !== image.id),
                            };
                          })
                        }
                      >
                        Remove Image
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      updateSelectedWidget((widget) => {
                        if (widget.type !== "gallery" || widget.images.length >= 6) {
                          return widget;
                        }

                        return {
                          ...widget,
                          images: [
                            ...widget.images,
                            {
                              id: `${widget.id}-image-${widget.images.length + 1}-${Date.now().toString(36)}`,
                              imageUrl: "",
                              caption: "",
                            },
                          ],
                        };
                      })
                    }
                    disabled={selectedWidget.images.length >= 6}
                  >
                    Add Gallery Image
                  </Button>
                </div>
              ) : null}

              {selectedWidget.type === "product" ? (
                <div className="space-y-3">
                  <select
                    value={selectedWidget.attachmentKey}
                    onChange={(event) =>
                      updateSelectedWidget((widget) =>
                        widget.type === "product"
                          ? { ...widget, attachmentKey: event.target.value }
                          : widget
                      )
                    }
                    className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white"
                    disabled={productOptions.length === 0}
                  >
                    <option value="">Select attached product</option>
                    {productOptions.map((product) => (
                      <option key={product.attachmentKey} value={product.attachmentKey}>
                        {product.label}
                      </option>
                    ))}
                  </select>
                  {productOptions.length === 0 ? (
                    <p className="text-sm text-[#fda4a4]">
                      Attach products in the loadout product manager before placing a product widget.
                    </p>
                  ) : null}
                  <label className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-[#111111] px-3 py-3 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={selectedWidget.showDescription}
                      onChange={(event) =>
                        updateSelectedWidget((widget) =>
                          widget.type === "product"
                            ? { ...widget, showDescription: event.target.checked }
                            : widget
                        )
                      }
                    />
                    Show description in the product card.
                  </label>
                </div>
              ) : null}

              {selectedWidget.type === "divider" ? (
                <div className="space-y-3">
                  <input
                    value={selectedWidget.label}
                    onChange={(event) =>
                      updateSelectedWidget((widget) =>
                        widget.type === "divider"
                          ? { ...widget, label: event.target.value }
                          : widget
                      )
                    }
                    placeholder="Optional section label"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/35"
                  />
                  <select
                    value={selectedWidget.tone}
                    onChange={(event) =>
                      updateSelectedWidget((widget) =>
                        widget.type === "divider"
                          ? {
                              ...widget,
                              tone: event.target.value === "accent" ? "accent" : "muted",
                            }
                          : widget
                      )
                    }
                    className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white"
                  >
                    <option value="muted">Muted</option>
                    <option value="accent">Accent</option>
                  </select>
                </div>
              ) : null}
            </div>
          )}
        </aside>
      </div>

      {message ? <p className="text-sm text-[#86efac]">{message}</p> : null}
      {errorMessage ? <p className="text-sm text-[#fda4a4]">{errorMessage}</p> : null}
    </section>
  );
}
