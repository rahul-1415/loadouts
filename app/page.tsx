import CollectionCard from "../components/CollectionCard";
import Button from "../components/Button";

const collections = [
  {
    id: "c1",
    title: "{{COLLECTION_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Placeholder description for a sample loadout.",
  },
  {
    id: "c2",
    title: "{{COLLECTION_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Another placeholder collection for layout testing.",
  },
  {
    id: "c3",
    title: "{{COLLECTION_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Add real data once the API is wired up.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Home Feed
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Loadouts curated by the community
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Browse curated collections of gear, products, and setups. Everything
            here is placeholder data until the API is connected.
          </p>
        </div>
        <Button>+ Create New</Button>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} {...collection} />
        ))}
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Sidebar</h2>
        <p className="mt-2 text-sm text-slate-600">
          Placeholder area for trending categories, recommended users, or search.
        </p>
      </section>
    </div>
  );
}
