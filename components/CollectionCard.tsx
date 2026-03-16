import Link from "next/link";

interface CollectionCardProps {
  id: string;
  title: string;
  author?: string;
  description?: string;
  coverImageUrl?: string | null;
  coverImageSourceUrl?: string | null;
  href?: string;
}

export default function CollectionCard({
  id,
  title,
  author,
  description,
  coverImageUrl,
  coverImageSourceUrl,
  href,
}: CollectionCardProps) {
  const linkHref = href ?? `/categories/${id}`;
  const mediaClassName = coverImageUrl
    ? "h-40 w-full bg-[linear-gradient(180deg,rgba(230,239,146,0.12),transparent_58%),linear-gradient(135deg,#2d301d,#171915_62%,#101010)]"
    : "h-40 w-full bg-[#111111]";
  const showAuthor = Boolean(author && author !== "CATEGORY");
  const showDescription = Boolean(
    description && description !== "Curated category placeholder."
  );

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/[0.04] bg-[#171717] transition duration-200 hover:-translate-y-1 hover:border-white/[0.14] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_24px_44px_rgba(0,0,0,0.22)]">
      <Link
        href={linkHref}
        aria-label={title}
        className="absolute inset-0 z-10 rounded-3xl"
      />
      <div className={mediaClassName}>
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
          {showAuthor ? (
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
              {author}
            </p>
          ) : null}
          <h3 className="text-lg font-semibold text-white transition group-hover:text-[#e6ef92]">
            {title}
          </h3>
        </div>
        {showDescription ? (
          <p className="text-sm text-white/70">{description}</p>
        ) : null}
        {coverImageSourceUrl ? (
          <a
            href={coverImageSourceUrl}
            target="_blank"
            rel="noreferrer"
            className="relative z-20 block text-[11px] uppercase tracking-[0.2em] text-white/45 underline decoration-white/15 underline-offset-4"
          >
            Image source
          </a>
        ) : null}
      </div>
    </article>
  );
}
