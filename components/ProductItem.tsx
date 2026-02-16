interface ProductItemProps {
  name: string;
  brand?: string;
  imageUrl?: string | null;
  productUrl?: string | null;
  sourceUrl?: string | null;
  description?: string;
}

export default function ProductItem({
  name,
  brand,
  imageUrl,
  productUrl,
  sourceUrl,
  description,
}: ProductItemProps) {
  return (
    <article className="flex gap-4 rounded-2xl border border-white/12 bg-[#141821] p-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/8">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="min-w-0 space-y-1">
        {brand ? (
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">
            {brand}
          </p>
        ) : null}
        {productUrl ? (
          <a
            href={productUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-white underline decoration-white/30 underline-offset-4"
          >
            {name}
          </a>
        ) : (
          <p className="text-sm font-semibold text-white">{name}</p>
        )}
        {description ? <p className="text-sm text-white/68">{description}</p> : null}
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] uppercase tracking-[0.2em] text-white/45 underline decoration-white/20 underline-offset-4"
          >
            Source
          </a>
        ) : null}
      </div>
    </article>
  );
}
