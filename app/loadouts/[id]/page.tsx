import Button from "../../../components/Button";
import ProductItem from "../../../components/ProductItem";
import CommentBox from "../../../components/CommentBox";

interface LoadoutPageProps {
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

export default function LoadoutPage({ params }: LoadoutPageProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.45em] text-ink/50">
          Loadout #{params.id}
        </p>
        <h1 className="text-[clamp(2.1rem,4vw,3.2rem)] font-semibold text-ink">
          {"{{LOADOUT_TITLE}}"}
        </h1>
        <p className="text-sm text-ink/70">
          by <span className="font-medium text-ink">@{"{{USER_HANDLE}}"}</span>
        </p>
        <p className="max-w-2xl text-ink/70">
          {"{{LOADOUT_DESCRIPTION}}"} — placeholder description for this
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
        <h2 className="text-xl font-semibold text-ink">Comments</h2>
        <form className="flex flex-wrap gap-3">
          <input
            placeholder="Add a comment..."
            className="flex-1 rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink/40"
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
