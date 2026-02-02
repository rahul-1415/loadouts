import Link from "next/link";

interface CollectionCardProps {
  id: string;
  title: string;
  author: string;
  description: string;
  href?: string;
  ctaLabel?: string;
}

export default function CollectionCard({
  id,
  title,
  author,
  description,
  href,
  ctaLabel = "View category",
}: CollectionCardProps) {
  const linkHref = href ?? `/categories/${id}`;

  return (
    <article className="overflow-hidden rounded-3xl border border-ink/10 bg-paper/70 shadow-[0_20px_40px_rgba(27,29,38,0.08)]">
      <div className="h-40 w-full bg-gradient-to-br from-ink/5 via-ink/10 to-ink/20" />
      <div className="space-y-3 p-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-ink/50">
            {author}
          </p>
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
        </div>
        <p className="text-sm text-ink/70">{description}</p>
        <Link
          className="text-sm font-semibold uppercase tracking-[0.2em] text-ink underline decoration-ink/40 underline-offset-4"
          href={linkHref}
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}
