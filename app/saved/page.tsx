import CollectionCard from "../../components/CollectionCard";

const savedCollections = [
  {
    id: "s1",
    title: "{{COLLECTION_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Saved collection placeholder.",
  },
  {
    id: "s2",
    title: "{{COLLECTION_NAME}}",
    author: "{{USER_HANDLE}}",
    description: "Another saved collection placeholder.",
  },
];

export default function SavedPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Saved Items
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Collections you bookmarked
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Placeholder content for the saved collections page.
        </p>
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        {savedCollections.map((collection) => (
          <CollectionCard key={collection.id} {...collection} />
        ))}
      </section>
    </div>
  );
}
