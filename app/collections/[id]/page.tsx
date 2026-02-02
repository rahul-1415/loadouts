import Button from "../../../components/Button";
import ProductItem from "../../../components/ProductItem";
import CommentBox from "../../../components/CommentBox";

interface CollectionPageProps {
  params: {
    id: string;
  };
}

const products = [
  { id: "p1", name: "{{PRODUCT_NAME}}", subtitle: "{{BRAND}}" },
  { id: "p2", name: "{{PRODUCT_NAME}}", subtitle: "{{BRAND}}" },
  { id: "p3", name: "{{PRODUCT_NAME}}", subtitle: "{{BRAND}}" },
];

const comments = [
  { id: "cm1", author: "{{USER_HANDLE}}", text: "{{COMMENT_TEXT}}" },
  { id: "cm2", author: "{{USER_HANDLE}}", text: "{{COMMENT_TEXT}}" },
];

export default function CollectionPage({ params }: CollectionPageProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Collection #{params.id}
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          {"{{COLLECTION_TITLE}}"}
        </h1>
        <p className="text-sm text-slate-600">
          by <span className="font-medium">@{"{{USER_HANDLE}}"}</span>
        </p>
        <p className="max-w-2xl text-slate-600">
          {"{{COLLECTION_DESCRIPTION}}"} — placeholder description for this
          loadout.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {products.map((product) => (
          <ProductItem key={product.id} {...product} />
        ))}
      </section>

      <section className="flex flex-wrap gap-3">
        <Button>Like ({"{{LIKE_COUNT}}"})</Button>
        <Button variant="secondary">Save</Button>
        <Button variant="secondary">Share</Button>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Comments</h2>
        <form className="flex flex-wrap gap-3">
          <input
            placeholder="Add a comment..."
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <Button type="submit">Post</Button>
        </form>
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentBox key={comment.id} {...comment} />
          ))}
        </div>
      </section>
    </div>
  );
}
