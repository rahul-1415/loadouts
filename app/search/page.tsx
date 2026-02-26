import Link from "next/link";
import { getActiveCategoryOptions } from "../../lib/data/collections";
import { normalizeSearchTypes, searchSiteContent } from "../../lib/data/search";

interface SearchPageProps {
  searchParams?: {
    q?: string | string[];
    types?: string | string[];
    type?: string | string[];
    category?: string | string[];
  };
}

const typeOptions = [
  { value: "loadouts", label: "Loadouts" },
  { value: "categories", label: "Categories" },
  { value: "products", label: "Products" },
  { value: "profiles", label: "Profiles" },
] as const;

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getTypeParam(
  type: string | string[] | undefined,
  types: string | string[] | undefined
) {
  const repeatedTypeValues = Array.isArray(type)
    ? type
    : type
      ? [type]
      : [];
  const commaTypes = getSingleValue(types);

  const combined = repeatedTypeValues.length
    ? repeatedTypeValues
    : commaTypes
      ? commaTypes.split(",")
      : [];

  return combined.join(",");
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = getSingleValue(searchParams?.q);
  const category = getSingleValue(searchParams?.category);
  const types = normalizeSearchTypes(
    getTypeParam(searchParams?.type, searchParams?.types)
  );

  const [results, categories] = await Promise.all([
    searchSiteContent({
      query,
      types,
      categorySlug: category || null,
      limitPerType: 16,
    }),
    getActiveCategoryOptions(120),
  ]);

  const totalResults =
    results.loadouts.length +
    results.categories.length +
    results.products.length +
    results.profiles.length;

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          Search
        </p>
        <h1 className="text-[clamp(2.1rem,4vw,3.2rem)] font-semibold text-white">
          Discover loadouts, products, and creators
        </h1>
        <p className="text-sm text-white/70">
          Search across loadouts, categories, products, and profiles with
          category filters.
        </p>
      </header>

      <form
        className="space-y-4 rounded-3xl border border-white/12 bg-[#11131a] p-6"
        method="GET"
      >
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search keyword"
            className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <select
            name="category"
            defaultValue={category}
            className="w-full rounded-xl border border-white/20 bg-[#0f1218] px-3 py-2 text-sm text-white"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          {typeOptions.map((item) => (
            <label
              key={item.value}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/70"
            >
              <input
                type="checkbox"
                name="type"
                value={item.value}
                defaultChecked={types.includes(item.value)}
                className="h-3.5 w-3.5 accent-white"
              />
              {item.label}
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full border border-white/25 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#f4f5f7] transition hover:border-white/45"
        >
          Search
        </button>
      </form>

      <section className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/45">
          Results
        </p>
        <p className="text-sm text-white/72">
          {totalResults} total matches
          {results.query ? ` for "${results.query}"` : ""}.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Loadouts</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {results.loadouts.map((item) => (
            <Link
              key={item.id}
              href={`/loadouts/${item.slug}`}
              className="rounded-2xl border border-white/12 bg-[#11131a] p-4 transition hover:border-white/28"
            >
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">
                {item.author}
              </p>
              <h3 className="mt-1 text-base font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-white/70">{item.description}</p>
            </Link>
          ))}
        </div>
        {results.loadouts.length === 0 ? (
          <p className="text-sm text-white/60">No loadout matches.</p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Products</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {results.products.map((item) => (
            <a
              key={item.id}
              href={item.productUrl ?? "#"}
              target={item.productUrl ? "_blank" : undefined}
              rel={item.productUrl ? "noreferrer" : undefined}
              className="rounded-2xl border border-white/12 bg-[#11131a] p-4 transition hover:border-white/28"
            >
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">
                {item.brand ?? "Product"}
              </p>
              <h3 className="mt-1 text-base font-semibold text-white">
                {item.name}
              </h3>
              <p className="mt-1 text-sm text-white/70">{item.description}</p>
            </a>
          ))}
        </div>
        {results.products.length === 0 ? (
          <p className="text-sm text-white/60">No product matches.</p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Profiles</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {results.profiles.map((item) => (
            <Link
              key={item.id}
              href={`/profile/${item.handle}`}
              className="rounded-2xl border border-white/12 bg-[#11131a] p-4 transition hover:border-white/28"
            >
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">
                @{item.handle}
              </p>
              <h3 className="mt-1 text-base font-semibold text-white">
                {item.displayName}
              </h3>
              <p className="mt-1 text-sm text-white/70">{item.bio}</p>
            </Link>
          ))}
        </div>
        {results.profiles.length === 0 ? (
          <p className="text-sm text-white/60">No profile matches.</p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Categories</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {results.categories.map((item) => (
            <Link
              key={item.id}
              href={`/categories/${item.slug}`}
              className="rounded-2xl border border-white/12 bg-[#11131a] p-4 transition hover:border-white/28"
            >
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">
                Category
              </p>
              <h3 className="mt-1 text-base font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-white/70">{item.description}</p>
            </Link>
          ))}
        </div>
        {results.categories.length === 0 ? (
          <p className="text-sm text-white/60">No category matches.</p>
        ) : null}
      </section>
    </div>
  );
}
