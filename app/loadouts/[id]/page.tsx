import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "../../../components/Button";
import CollectionEngagement from "../../../components/CollectionEngagement";
import ContentCard from "../../../components/ContentCard";
import CopyLinkButton from "../../../components/CopyLinkButton";
import DraftLoadoutActions from "../../../components/DraftLoadoutActions";
import ProductItem from "../../../components/ProductItem";
import ReportButton from "../../../components/ReportButton";
import {
  getPublicCollectionByIdentifier,
  getRecommendedLoadoutsForCollection,
} from "../../../lib/data/collections";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

interface LoadoutPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: LoadoutPageProps): Promise<Metadata> {
  const loadout = await getPublicCollectionByIdentifier(params.id, "loadout");

  if (!loadout) {
    return {
      title: "Loadout Not Found | Loadouts",
    };
  }

  const description =
    loadout.description || `Explore ${loadout.title} on Loadouts.`;

  return {
    title: `${loadout.title} | Loadouts`,
    description,
    openGraph: {
      title: loadout.title,
      description,
      images: loadout.coverImageUrl ? [{ url: loadout.coverImageUrl }] : undefined,
    },
    twitter: {
      card: loadout.coverImageUrl ? "summary_large_image" : "summary",
      title: loadout.title,
      description,
      images: loadout.coverImageUrl ? [loadout.coverImageUrl] : undefined,
    },
  };
}

export default async function LoadoutPage({ params }: LoadoutPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loadout = await getPublicCollectionByIdentifier(
    params.id,
    "loadout",
    user?.id ?? null
  );

  if (!loadout) {
    notFound();
  }

  const isOwner = user?.id === loadout.ownerId;
  const relatedLoadouts = await getRecommendedLoadoutsForCollection({
    collectionId: loadout.id,
    categoryId: loadout.categoryId,
    ownerId: loadout.ownerId,
    viewerUserId: user?.id ?? null,
    limit: 3,
  });

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
              Loadout #{loadout.slug}
            </p>
            {loadout.category ? (
              <a
                href={`/categories/${loadout.category.slug}`}
                className="inline-flex items-center rounded-full border border-[#d4dd7f]/20 bg-[#10120d] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[#e6ef92] transition hover:border-[#d4dd7f]/40 hover:bg-[#15190f]"
              >
                {loadout.category.title}
              </a>
            ) : null}
            <h1 className="text-[clamp(2.1rem,4vw,3.2rem)] font-semibold text-white">
              {loadout.title}
            </h1>
            <p className="text-sm text-white/70">
              by <span className="font-medium text-white">{loadout.author}</span>
            </p>
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
            <CopyLinkButton path={`/loadouts/${loadout.slug}`} />
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

      <section className="grid gap-4 md:grid-cols-2">
        {loadout.products.map((product) => (
          <ProductItem
            key={product.id}
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

      <CollectionEngagement
        collectionId={loadout.id}
        collectionSlug={loadout.slug}
        initialLikeCount={loadout.likeCount}
        initialViewerHasLiked={loadout.viewerHasLiked}
        initialViewerHasSaved={loadout.viewerHasSaved}
        initialComments={loadout.comments}
        viewerUserId={user?.id ?? null}
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
                href={`/loadouts/${item.slug}`}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
