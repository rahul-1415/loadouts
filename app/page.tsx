import CollectionCard from "../components/CollectionCard";
import Button from "../components/Button";
import { getPublicCollections } from "../lib/data/collections";

export default async function HomePage() {
  const collections = await getPublicCollections({ limit: 6 });

  return (
    <div className="space-y-8 text-[#f4f5f7]">
      <section className="grid gap-10 rounded-3xl border border-white/10 bg-[#0d0f14] p-6 shadow-[0_36px_70px_rgba(0,0,0,0.35)] sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-10">
        <div className="space-y-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/50">
            Home Feed
          </p>
          <h1 className="text-[clamp(2.6rem,6vw,4.75rem)] font-semibold leading-[0.95] text-white">
            Build and share the loadouts that power your best work.
          </h1>
          <p className="max-w-2xl text-base text-white/68">
            A curated hub for tools, workflows, and product stacks.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button>Get access</Button>
          </div>
          <div className="flex flex-wrap gap-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/48">
            <span>Created daily</span>
            <span>Curated by creators</span>
            <span>Save &amp; revisit</span>
          </div>
        </div>
        <div className="rounded-3xl border border-white/12 bg-[#11141a] p-6 shadow-[0_24px_56px_rgba(0,0,0,0.28)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/55">
            Demo Preview
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
            App Walkthrough Video
          </h2>
          <p className="mt-3 text-sm text-white/65">
            Placeholder area for a demo video that shows how the app works.
          </p>
          <div className="mt-6 aspect-video rounded-2xl border border-dashed border-white/25 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(165deg,#1a1f28,#0f1218)] p-4">
            <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-black/20">
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/35 bg-white/10">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                    <path d="M8 6.5v11l9-5.5-9-5.5Z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-white/88">Demo video placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/50">
            Latest categories
          </p>
          <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-semibold text-white">
            Browse curated categories
          </h2>
        </div>
        <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">
          Fixed set: 100
        </span>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            id={collection.slug}
            title={collection.title}
            author={collection.author}
            description={collection.description}
            coverImageUrl={collection.coverImageUrl}
            coverImageSourceUrl={collection.coverImageSourceUrl}
            href={`/${
              collection.kind === "loadout" ? "loadouts" : "categories"
            }/${collection.slug}`}
            ctaLabel={
              collection.kind === "loadout" ? "View loadout" : "View category"
            }
          />
        ))}
        {collections.length === 0 ? (
          <p className="text-sm text-white/70">
            No collections found yet. Seed your database and refresh.
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-dashed border-white/15 bg-[#11131a] p-6">
        <h2 className="text-lg font-semibold text-white">Sidebar</h2>
        <p className="mt-2 text-sm text-white/70">
          Placeholder area for trending categories, recommended users, or
          search.
        </p>
      </section>
    </div>
  );
}
