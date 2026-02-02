import Link from "next/link";

interface CollectionCardProps {
  id: string;
  title: string;
  author: string;
  description: string;
}

export default function CollectionCard({
  id,
  title,
  author,
  description,
}: CollectionCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-40 w-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300" />
      <div className="space-y-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {author}
          </p>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
        <p className="text-sm text-slate-600">{description}</p>
        <Link
          className="text-sm font-medium text-slate-900 underline decoration-slate-300 underline-offset-4"
          href={`/collections/${id}`}
        >
          View collection
        </Link>
      </div>
    </article>
  );
}
