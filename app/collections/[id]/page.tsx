import ProductItem from "../../../components/ProductItem";
import CollectionEngagement from "../../../components/CollectionEngagement";
import { notFound } from "next/navigation";
import { getPublicCollectionByIdentifier } from "../../../lib/data/collections";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

interface CollectionPageProps {
  params: {
    id: string;
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const collection = await getPublicCollectionByIdentifier(
    params.id,
    undefined,
    user?.id ?? null
  );

  if (!collection) {
    notFound();
  }

  const collectionLabel =
    collection.kind === "loadout" ? "Loadout" : "Category";

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          {collectionLabel} #{collection.slug}
        </p>
        <h1 className="text-[clamp(2.1rem,4vw,3.2rem)] font-semibold text-white">
          {collection.title}
        </h1>
        <p className="text-sm text-white/70">
          by <span className="font-medium text-white">{collection.author}</span>
        </p>
        {collection.description ? (
          <p className="max-w-2xl text-white/70">{collection.description}</p>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {collection.products.map((product) => (
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
        {collection.products.length === 0 ? (
          <p className="text-sm text-white/70">
            No products added to this collection yet.
          </p>
        ) : null}
      </section>

      <CollectionEngagement
        collectionId={collection.id}
        collectionSlug={collection.slug}
        initialLikeCount={collection.likeCount}
        initialViewerHasLiked={collection.viewerHasLiked}
        initialComments={collection.comments}
        viewerUserId={user?.id ?? null}
      />
    </div>
  );
}
