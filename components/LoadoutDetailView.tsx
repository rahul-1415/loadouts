import Link from "next/link";
import { ButtonLink } from "./Button";
import CollectionEngagement from "./CollectionEngagement";
import ContentCard from "./ContentCard";
import CopyLinkButton from "./CopyLinkButton";
import DraftLoadoutActions from "./DraftLoadoutActions";
import LoadoutBoardRenderer from "./LoadoutBoardRenderer";
import ProductItem from "./ProductItem";
import ReportButton from "./ReportButton";
import type { CollectionDetail, CollectionListItem } from "../lib/data/collections";

interface LoadoutDetailViewProps {
  loadout: CollectionDetail;
  viewerUserId: string | null;
  isOwner: boolean;
  relatedLoadouts: CollectionListItem[];
}

export default function LoadoutDetailView({
  loadout,
  viewerUserId,
  isOwner,
  relatedLoadouts,
}: LoadoutDetailViewProps) {
  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
              Loadout #{loadout.slug}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {loadout.category ? (
                <Link
                  href={`/categories/${loadout.category.slug}`}
                  className="inline-flex items-center rounded-full border border-[#d4dd7f]/20 bg-[#10120d] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[#e6ef92] transition hover:border-[#d4dd7f]/40 hover:bg-[#15190f]"
                >
                  {loadout.category.title}
                </Link>
              ) : null}
              {loadout.authorHandle ? (
                <Link
                  href={`/profile/${loadout.authorHandle}`}
                  className="inline-flex items-center rounded-full border border-white/[0.08] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/68 transition hover:border-white/[0.16] hover:text-white"
                >
                  {loadout.author}
                </Link>
              ) : null}
            </div>
            <h1 className="text-[clamp(2.1rem,4vw,3.2rem)] font-semibold text-white">
              {loadout.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/70">
              {loadout.status}
            </span>
            {isOwner ? (
              <ButtonLink
                href={`/loadouts/${loadout.slug}/edit`}
                variant="secondary"
                className="px-4 py-2 text-[10px]"
              >
                Edit
              </ButtonLink>
            ) : null}
            <CopyLinkButton path={loadout.path} />
            {!isOwner ? <ReportButton entityType="loadout" entityId={loadout.id} /> : null}
          </div>
        </div>

        {loadout.description ? (
          <p className="max-w-2xl text-white/70">{loadout.description}</p>
        ) : null}
      </header>

      {loadout.coverImageUrl ? (
        <section className="overflow-hidden rounded-3xl border border-white/[0.05] bg-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_36px_rgba(0,0,0,0.16)]">
          <img
            src={loadout.coverImageUrl}
            alt={loadout.title}
            className="aspect-[16/7] w-full object-cover"
          />
        </section>
      ) : null}

      {isOwner && loadout.publishChecklist && loadout.status !== "published" ? (
        <section className="rounded-3xl border border-white/[0.05] bg-[#171717] p-6">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
            Publish Checklist
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {loadout.publishChecklist.items.map((item) => (
              <div
                key={item.key}
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  item.complete
                    ? "border-[#d4dd7f]/20 bg-[#10120d] text-white/80"
                    : "border-white/[0.06] bg-[#111111] text-white/62"
                }`}
              >
                {item.label}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {loadout.layoutMode === "custom" && loadout.bodyLayout ? (
        <div className="space-y-6">
          <LoadoutBoardRenderer
            layout={loadout.bodyLayout}
            products={loadout.products}
          />

          {loadout.unplacedProducts.length > 0 ? (
            <section className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
                Products
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {loadout.unplacedProducts.map((product) => (
                  <ProductItem
                    key={product.attachmentKey}
                    name={product.name}
                    brand={product.brand}
                    description={product.note || product.description}
                    imageUrl={product.imageUrl}
                    productUrl={product.productUrl}
                    sourceUrl={product.sourceUrl}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {loadout.products.map((product) => (
            <ProductItem
              key={product.attachmentKey}
              name={product.name}
              brand={product.brand}
              description={product.note || product.description}
              imageUrl={product.imageUrl}
              productUrl={product.productUrl}
              sourceUrl={product.sourceUrl}
            />
          ))}
          {loadout.products.length === 0 ? (
            <p className="text-sm text-white/70">No products added yet.</p>
          ) : null}
        </section>
      )}

      <CollectionEngagement
        collectionId={loadout.id}
        collectionSlug={loadout.slug}
        initialLikeCount={loadout.likeCount}
        initialViewerHasLiked={loadout.viewerHasLiked}
        initialViewerHasSaved={loadout.viewerHasSaved}
        initialComments={loadout.comments}
        viewerUserId={viewerUserId}
      />

      {isOwner && loadout.status === "draft" ? (
        <DraftLoadoutActions
          loadoutSlug={loadout.slug}
          title={loadout.title}
          description={loadout.description}
          categoryId={loadout.categoryId}
          coverImageUrl={loadout.coverImageUrl}
        />
      ) : null}

      {relatedLoadouts.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
              Related Loadouts
            </p>
            <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">
              {loadout.category ? `More in ${loadout.category.title}` : "More in discovery"}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relatedLoadouts.map((item) => (
              <ContentCard
                key={item.id}
                id={item.slug}
                title={item.title}
                author={item.author}
                description={item.description}
                coverImageUrl={item.coverImageUrl}
                href={item.path}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
