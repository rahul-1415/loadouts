import Button from "../../../components/Button";

export default function NewCollectionPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          New Collection
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Create a new loadout
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This form is a placeholder until the API and database are wired up.
        </p>
      </header>

      <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label className="text-sm font-medium text-slate-700" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            placeholder="{{COLLECTION_TITLE}}"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            id="description"
            placeholder="Add a short description"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            rows={4}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">
            Products
          </label>
          <div className="mt-2 grid gap-3">
            <input
              placeholder="{{PRODUCT_URL}}"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="{{IMAGE_URL}}"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <Button type="submit">Create Collection</Button>
      </form>
    </div>
  );
}
