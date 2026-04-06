import LoadoutBoardRenderer from "./LoadoutBoardRenderer";
import ProductItem from "./ProductItem";
import type { LoadoutProductItem } from "./LoadoutProductsManager";
import {
  getReferencedAttachmentKeys,
  type LoadoutLayout,
  type LoadoutLayoutMode,
} from "../lib/loadoutLayout";

interface LoadoutPostPreviewProps {
  title: string;
  description: string;
  coverImageUrl: string;
  categoryLabel: string;
  authorLabel?: string;
  statusLabel?: string;
  layoutMode: LoadoutLayoutMode;
  layout: LoadoutLayout | null;
  products: LoadoutProductItem[];
  className?: string;
  heading?: string;
  subheading?: string;
}

export default function LoadoutPostPreview({
  title,
  description,
  coverImageUrl,
  categoryLabel,
  authorLabel = "You",
  statusLabel = "draft",
  layoutMode,
  layout,
  products,
  className = "",
  heading,
  subheading,
}: LoadoutPostPreviewProps) {
  const referencedAttachmentKeys =
    layoutMode === "custom" && layout
      ? new Set(getReferencedAttachmentKeys(layout))
      : new Set<string>();
  const unplacedProducts =
    layoutMode === "custom"
      ? products.filter(
          (product) => !referencedAttachmentKeys.has(product.attachmentKey)
        )
      : products;

  return (
    <section className={`space-y-4 ${className}`}>
      {heading || subheading ? (
        <div className="space-y-2">
          {heading ? (
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
              {heading}
            </p>
          ) : null}
          {subheading ? <p className="text-sm text-white/68">{subheading}</p> : null}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/[0.05] bg-[#171717] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {categoryLabel ? (
                <span className="inline-flex items-center rounded-full border border-[#d4dd7f]/20 bg-[#10120d] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[#e6ef92]">
                  {categoryLabel}
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-full border border-white/[0.08] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/68">
                {authorLabel}
              </span>
            </div>
            <h3 className="text-[clamp(2rem,4vw,3rem)] font-semibold text-white">
              {title.trim() || "Untitled loadout"}
            </h3>
            {description.trim() ? (
              <p className="max-w-2xl text-white/70">{description}</p>
            ) : null}
          </div>
          <span className="rounded-full border border-white/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/70">
            {statusLabel}
          </span>
        </div>
      </section>

      {coverImageUrl.trim() ? (
        <section className="overflow-hidden rounded-3xl border border-white/[0.05] bg-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <img
            src={coverImageUrl}
            alt={title || "Loadout cover"}
            className="aspect-[16/7] w-full object-cover"
          />
        </section>
      ) : null}

      {layoutMode === "custom" && layout?.widgets.length ? (
        <section className="rounded-3xl border border-white/[0.05] bg-[#171717] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <LoadoutBoardRenderer layout={layout} products={products} />
        </section>
      ) : layoutMode === "custom" ? (
        <section className="rounded-3xl border border-dashed border-white/[0.08] bg-[#171717] p-8 text-center text-sm text-white/58">
          Add widgets in the layout step to build the custom post body.
        </section>
      ) : null}

      {unplacedProducts.length > 0 ? (
        <section className="space-y-4 rounded-3xl border border-white/[0.05] bg-[#171717] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
                {layoutMode === "custom" ? "Fallback Products" : "Products"}
              </p>
              <p className="mt-2 text-sm text-white/68">
                {layoutMode === "custom"
                  ? "Attached products that are not currently placed as widgets still render below the board."
                  : "These products will appear in the final published loadout."}
              </p>
            </div>
            <span className="rounded-full border border-white/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/55">
              {unplacedProducts.length} item
              {unplacedProducts.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {unplacedProducts.map((product) => (
              <ProductItem
                key={product.attachmentKey}
                name={product.name}
                brand={product.brand ?? undefined}
                description={product.note || product.description}
                imageUrl={product.imageUrl}
                productUrl={product.productUrl}
                sourceUrl={product.sourceUrl}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-white/[0.08] bg-[#171717] p-8 text-center text-sm text-white/58">
          Add at least one product before publishing this loadout.
        </section>
      )}
    </section>
  );
}
