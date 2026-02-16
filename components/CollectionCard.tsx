import Link from "next/link";

interface CollectionCardProps {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImageUrl?: string | null;
  coverImageSourceUrl?: string | null;
  href?: string;
  ctaLabel?: string;
}

export default function CollectionCard({
  id,
  title,
  author,
  description,
  coverImageUrl,
  coverImageSourceUrl,
  href,
  ctaLabel = "View category",
}: CollectionCardProps) {
  const linkHref = href ?? `/categories/${id}`;

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#11131a] shadow-[0_22px_48px_rgba(0,0,0,0.3)]">
      <div className="h-40 w-full bg-gradient-to-br from-white/5 via-white/[0.08] to-[#1a2230]">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="space-y-3 p-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
            {author}
          </p>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="text-sm text-white/70">{description}</p>
        <Link
          className="text-sm font-semibold uppercase tracking-[0.2em] text-white underline decoration-white/35 underline-offset-4"
          href={linkHref}
        >
          {ctaLabel}
        </Link>
        {coverImageSourceUrl ? (
          <a
            href={coverImageSourceUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-[11px] uppercase tracking-[0.2em] text-white/45 underline decoration-white/20 underline-offset-4"
          >
            Image source
          </a>
        ) : null}
      </div>
    </article>
  );
}
