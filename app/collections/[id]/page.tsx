import Button from "../../../components/Button";
import ProductItem from "../../../components/ProductItem";
import CommentBox from "../../../components/CommentBox";
import { notFound } from "next/navigation";
import { getPublicCollectionByIdentifier } from "../../../lib/data/collections";

interface CollectionPageProps {
  params: {
    id: string;
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const collection = await getPublicCollectionByIdentifier(params.id);

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

      <section className="flex flex-wrap gap-3">
        <Button>Like ({collection.likeCount})</Button>
        <Button variant="secondary">Save</Button>
        <Button variant="secondary">Share</Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Comments</h2>
        <form className="flex flex-wrap gap-3">
          <input
            placeholder="Add a comment..."
            className="flex-1 rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <Button type="submit">Post</Button>
        </form>
        <div className="space-y-3">
          {collection.comments.map((comment) => (
            <CommentBox key={comment.id} author={comment.author} text={comment.body} />
          ))}
          {collection.comments.length === 0 ? (
            <p className="text-sm text-white/70">No comments yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
