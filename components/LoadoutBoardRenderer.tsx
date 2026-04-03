import ProductItem from "./ProductItem";
import {
  LOADOUT_GRID_COLUMNS,
  sortWidgetsForMobile,
  type DividerWidget,
  type GalleryWidget,
  type ImageWidget,
  type LoadoutLayout,
  type LoadoutWidget,
  type ProductWidget,
  type TextWidget,
} from "../lib/loadoutLayout";

interface BoardRenderableProduct {
  attachmentKey: string;
  name: string;
  brand: string | null;
  description: string;
  note: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  sourceUrl: string | null;
}

interface LoadoutBoardRendererProps {
  layout: LoadoutLayout;
  products: BoardRenderableProduct[];
  className?: string;
}

function findProduct(
  widget: ProductWidget,
  products: BoardRenderableProduct[]
): BoardRenderableProduct | null {
  return products.find((product) => product.attachmentKey === widget.attachmentKey) ?? null;
}

function renderTextWidget(widget: TextWidget) {
  const alignmentClass =
    widget.align === "center"
      ? "text-center"
      : widget.align === "right"
        ? "text-right"
        : "text-left";
  const titleClass =
    widget.style === "eyebrow"
      ? "text-[11px] uppercase tracking-[0.35em] text-[#e6ef92]"
      : widget.style === "body"
        ? "text-xl font-semibold text-white"
        : "text-3xl font-semibold text-white sm:text-4xl";

  return (
    <div className={`flex h-full flex-col justify-center gap-3 ${alignmentClass}`}>
      {widget.title ? <p className={titleClass}>{widget.title}</p> : null}
      {widget.body ? <p className="text-sm leading-7 text-white/72">{widget.body}</p> : null}
    </div>
  );
}

function renderImageWidget(widget: ImageWidget) {
  const aspectClass =
    widget.aspectRatio === "portrait"
      ? "aspect-[4/5]"
      : widget.aspectRatio === "square"
        ? "aspect-square"
        : "aspect-[16/10]";

  return (
    <div className="space-y-3">
      <div className={`overflow-hidden rounded-[1.4rem] border border-white/[0.06] bg-[#111111] ${aspectClass}`}>
        <img src={widget.imageUrl} alt={widget.caption || "Loadout media"} className="h-full w-full object-cover" />
      </div>
      {widget.caption ? <p className="text-xs uppercase tracking-[0.2em] text-white/48">{widget.caption}</p> : null}
    </div>
  );
}

function renderGalleryWidget(widget: GalleryWidget) {
  const gridClass = widget.layout === "stack" ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className={`grid gap-3 ${gridClass}`}>
      {widget.images.map((image) => (
        <figure key={image.id} className="space-y-2">
          <div className="aspect-[4/3] overflow-hidden rounded-[1.3rem] border border-white/[0.06] bg-[#111111]">
            <img src={image.imageUrl} alt={image.caption || "Loadout gallery media"} className="h-full w-full object-cover" />
          </div>
          {image.caption ? <figcaption className="text-[11px] uppercase tracking-[0.18em] text-white/45">{image.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}

function renderProductWidget(widget: ProductWidget, products: BoardRenderableProduct[]) {
  const product = findProduct(widget, products);

  if (!product) {
    return (
      <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-[#fda4a4]/35 bg-[#190d0d] px-4 py-6 text-center text-sm text-[#fda4a4]">
        Attached product missing.
      </div>
    );
  }

  return (
    <ProductItem
      name={product.name}
      brand={product.brand ?? undefined}
      description={widget.showDescription ? product.note || product.description : product.note || ""}
      imageUrl={product.imageUrl}
      productUrl={product.productUrl}
      sourceUrl={product.sourceUrl}
    />
  );
}

function renderDividerWidget(widget: DividerWidget) {
  return (
    <div className="flex h-full items-center gap-4">
      <div className={`h-px flex-1 ${widget.tone === "accent" ? "bg-[#d4dd7f]/45" : "bg-white/[0.10]"}`} />
      {widget.label ? (
        <span className={`text-[11px] uppercase tracking-[0.28em] ${widget.tone === "accent" ? "text-[#e6ef92]" : "text-white/42"}`}>
          {widget.label}
        </span>
      ) : null}
      <div className={`h-px flex-1 ${widget.tone === "accent" ? "bg-[#d4dd7f]/45" : "bg-white/[0.10]"}`} />
    </div>
  );
}

function renderWidget(widget: LoadoutWidget, products: BoardRenderableProduct[]) {
  switch (widget.type) {
    case "text":
      return renderTextWidget(widget);
    case "image":
      return renderImageWidget(widget);
    case "gallery":
      return renderGalleryWidget(widget);
    case "product":
      return renderProductWidget(widget, products);
    case "divider":
      return renderDividerWidget(widget);
  }
}

function widgetShellClass(widget: LoadoutWidget) {
  if (widget.type === "divider") {
    return "rounded-[1.3rem] border border-transparent bg-transparent p-0 shadow-none";
  }

  return "rounded-[1.8rem] border border-white/[0.05] bg-[#171717] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-5";
}

export default function LoadoutBoardRenderer({
  layout,
  products,
  className,
}: LoadoutBoardRendererProps) {
  const sortedMobileWidgets = sortWidgetsForMobile(layout.widgets);

  return (
    <div className={className}>
      <div className="grid gap-4 md:hidden">
        {sortedMobileWidgets.map((widget) => (
          <article key={widget.id} className={widgetShellClass(widget)}>
            {renderWidget(widget, products)}
          </article>
        ))}
      </div>

      <div
        className="hidden gap-4 md:grid"
        style={{
          gridTemplateColumns: `repeat(${LOADOUT_GRID_COLUMNS}, minmax(0, 1fr))`,
          gridAutoRows: "minmax(48px, auto)",
        }}
      >
        {layout.widgets.map((widget) => (
          <article
            key={widget.id}
            className={widgetShellClass(widget)}
            style={{
              gridColumn: `${widget.x + 1} / span ${widget.w}`,
              gridRow: `${widget.y + 1} / span ${widget.h}`,
            }}
          >
            {renderWidget(widget, products)}
          </article>
        ))}
      </div>
    </div>
  );
}
