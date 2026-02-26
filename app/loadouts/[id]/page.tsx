import { ButtonLink } from "../../../components/Button";
import ProductItem from "../../../components/ProductItem";
import CollectionEngagement from "../../../components/CollectionEngagement";
import { notFound } from "next/navigation";
import { getPublicCollectionByIdentifier } from "../../../lib/data/collections";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

interface LoadoutPageProps {
  params: {
    id: string;
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

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          Loadout #{loadout.slug}
        </p>
        <h1 className="text-[clamp(2.1rem,4vw,3.2rem)] font-semibold text-white">
          {loadout.title}
        </h1>
        <p className="text-sm text-white/70">
          by <span className="font-medium text-white">{loadout.author}</span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/70">
            {loadout.isPublic ? "Public" : "Draft"}
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
        </div>
        {loadout.description ? (
          <p className="max-w-2xl text-white/70">{loadout.description}</p>
        ) : null}
      </header>

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
        initialComments={loadout.comments}
        viewerUserId={user?.id ?? null}
      />
    </div>
  );
}
