import CollectionCard from "../components/CollectionCard";
import Button, { ButtonLink } from "../components/Button";

const categories = [
  {
    id: "c1",
    title: "{{CATEGORY_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Placeholder description for a sample category.",
  },
  {
    id: "c2",
    title: "{{CATEGORY_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Another placeholder category for layout testing.",
  },
  {
    id: "c3",
    title: "{{CATEGORY_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Add real data once the API is wired up.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ink/50">
            Home Feed
          </p>
          <h1 className="text-[clamp(2.6rem,6vw,4.75rem)] font-semibold text-ink">
            Build and share the loadouts that power your best work.
          </h1>
          <p className="max-w-2xl text-base text-ink/70">
            A curated hub for tools, workflows, and product stacks. Everything
            shown here is placeholder content until the API is connected.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button>Get access</Button>
            <Button variant="secondary">Watch demo</Button>
          </div>
          <div className="flex flex-wrap gap-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-ink/50">
            <span>Created daily</span>
            <span>Curated by creators</span>
            <span>Save &amp; revisit</span>
          </div>
        </div>
        <div className="rounded-3xl border border-ink/20 bg-ink p-6 text-paper shadow-[0_30px_60px_rgba(27,29,38,0.2)]">
          <h2 className="mt-4 text-3xl font-semibold">
            {"{{CATEGORY_TITLE}}"}
          </h2>
          <p className="mt-3 text-sm text-paper/70">
            Short hero summary. Use this area to highlight a signature loadout
            or featured creator.
          </p>
          <div className="mt-6 grid gap-4 rounded-2xl border border-paper/20 bg-paper/10 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.3em] text-paper/60">
                Items
              </span>
              <span className="text-xl font-semibold">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.3em] text-paper/60">
                Saves
              </span>
              <span className="text-xl font-semibold">3.4k</span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ink/50">
            Latest categories
          </p>
          <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-semibold text-ink">
            Browse curated categories
          </h2>
        </div>
        <ButtonLink href="/categories/new" variant="secondary">
          + New Category
        </ButtonLink>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <CollectionCard key={category.id} {...category} />
        ))}
      </section>

      <section className="rounded-3xl border border-dashed border-ink/20 bg-paper/70 p-6">
        <h2 className="text-lg font-semibold text-ink">Sidebar</h2>
        <p className="mt-2 text-sm text-ink/70">
          Placeholder area for trending categories, recommended users, or
          search.
        </p>
      </section>
    </div>
  );
}
