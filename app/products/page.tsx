import Link from "next/link";
import ProductItem from "../../components/ProductItem";
import { getProductCatalog } from "../../lib/data/products";

interface ProductsPageProps {
  searchParams?: {
    q?: string | string[];
    brand?: string | string[];
    category?: string | string[];
  };
}

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const query = getSingleValue(searchParams?.q);
  const brand = getSingleValue(searchParams?.brand);
  const category = getSingleValue(searchParams?.category);

  const catalog = await getProductCatalog({
    query,
    brand,
    category,
    limit: 120,
  });

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          Product Catalog
        </p>
        <h1 className="text-[clamp(2.1rem,4vw,3.2rem)] font-semibold text-white">
          Search products by brand and gear category
        </h1>
        <p className="max-w-3xl text-sm text-white/70">
          Browse the curated catalog of creator tools, official product links, and
          image-backed items available to add into loadouts.
        </p>
      </header>

      <form
        method="GET"
        className="space-y-4 rounded-3xl border border-white/[0.05] bg-[#171717] p-6"
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto] lg:items-end">
          <label className="space-y-2 text-[11px] uppercase tracking-[0.25em] text-white/55">
            <span>Keyword</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Camera, keyboard, editing, Sony..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm normal-case tracking-normal text-white placeholder:text-white/40"
            />
          </label>

          <label className="space-y-2 text-[11px] uppercase tracking-[0.25em] text-white/55">
            <span>Brand</span>
            <select
              name="brand"
              defaultValue={brand}
              className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm normal-case tracking-normal text-white"
            >
              <option value="">All brands</option>
              {catalog.filters.brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-[11px] uppercase tracking-[0.25em] text-white/55">
            <span>Product category</span>
            <select
              name="category"
              defaultValue={category}
              className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm normal-case tracking-normal text-white"
            >
              <option value="">All product categories</option>
              {catalog.filters.categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.label} ({item.count})
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full border border-[#d4dd7f]/70 bg-[#e6ef92] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#111111]"
            >
              Search
            </button>
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-full border border-white/[0.12] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/72 transition hover:border-white/[0.2]"
            >
              Clear
            </Link>
          </div>
        </div>
      </form>

      <section className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">
          Results
        </p>
        <p className="text-sm text-white/72">
          {catalog.totalCount} matched products
          {query ? ` for "${query}"` : ""}.
        </p>
      </section>

      {catalog.items.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {catalog.items.map((item) => (
            <ProductItem
              key={item.id}
              name={item.name}
              brand={item.brand ?? undefined}
              description={item.description}
              imageUrl={item.imageUrl}
              productUrl={item.productUrl}
              sourceUrl={item.sourceUrl}
              categoryLabel={item.categoryLabel}
            />
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-white/[0.05] bg-[#171717] p-8">
          <h2 className="text-xl font-semibold text-white">No products matched</h2>
          <p className="mt-2 text-sm text-white/70">
            Try a different keyword, or switch to another brand or product category.
          </p>
        </section>
      )}
    </div>
  );
}
