import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentCard from "../../../components/ContentCard";
import { getCategoryWithLoadouts } from "../../../lib/data/collections";

interface CategoryDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: CategoryDetailPageProps): Promise<Metadata> {
  const result = await getCategoryWithLoadouts(params.id);

  if (!result) {
    return {
      title: "Category Not Found | Loadouts",
    };
  }

  const description =
    result.category.description ||
    `Explore creator loadouts in ${result.category.title}.`;

  return {
    title: `${result.category.title} | Loadouts`,
    description,
    openGraph: {
      title: result.category.title,
      description,
      images: result.category.coverImageUrl
        ? [{ url: result.category.coverImageUrl }]
        : undefined,
    },
    twitter: {
      card: result.category.coverImageUrl ? "summary_large_image" : "summary",
      title: result.category.title,
      description,
      images: result.category.coverImageUrl
        ? [result.category.coverImageUrl]
        : undefined,
    },
  };
}

export default async function CategoryDetailPage({
  params,
}: CategoryDetailPageProps) {
  const result = await getCategoryWithLoadouts(params.id);

  if (!result) {
    notFound();
  }

  const { category, loadouts } = result;

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          Category
        </p>
        <h1 className="text-[clamp(2.1rem,4vw,3.2rem)] font-semibold text-white">
          {category.title}
        </h1>
        {category.description ? (
          <p className="max-w-2xl text-white/70">{category.description}</p>
        ) : null}
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
            Loadouts In This Category
          </p>
          <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">
            {loadouts.length} total
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loadouts.map((loadout) => (
            <ContentCard
              key={loadout.id}
              id={loadout.slug}
              title={loadout.title}
              author={loadout.author}
              description={loadout.description}
              coverImageUrl={loadout.coverImageUrl}
              coverImageSourceUrl={loadout.coverImageSourceUrl}
              href={`/loadouts/${loadout.slug}`}
            />
          ))}
        </div>
        {loadouts.length === 0 ? (
          <p className="text-sm text-white/70">
            No user loadouts in this category yet.
          </p>
        ) : null}
      </section>
    </div>
  );
}
