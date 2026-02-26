"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "./Button";

interface CategoryOption {
  id: string;
  slug: string;
  title: string;
}

interface NewLoadoutFormProps {
  categories: CategoryOption[];
  mode?: "create" | "edit";
  identifier?: string;
  initialValues?: {
    title: string;
    description: string;
    categoryId: string;
    isPublic: boolean;
  };
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

interface ApiLoadoutResponse {
  data?: {
    id: string;
    slug: string;
  };
}

export default function NewLoadoutForm({
  categories,
  mode = "create",
  identifier,
  initialValues,
}: NewLoadoutFormProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";
  const [step, setStep] = useState<1 | 2>(
    initialValues?.categoryId ? 2 : 1
  );
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [isPublic, setIsPublic] = useState(initialValues?.isPublic ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCategoryLabel = useMemo(
    () => categories.find((category) => category.id === categoryId)?.title ?? "",
    [categories, categoryId]
  );

  function goToDetailsStep() {
    if (!categoryId) {
      setErrorMessage("Select a category before continuing.");
      return;
    }

    setErrorMessage(null);
    setStep(2);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoryId) {
      setErrorMessage("Select a category before saving.");
      setStep(1);
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Title is required.");
      setStep(2);
      return;
    }

    if (isEditMode && !identifier) {
      setErrorMessage("Missing loadout identifier.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const endpoint = isEditMode
      ? `/api/collections/${encodeURIComponent(identifier ?? "")}`
      : "/api/collections";
    const method = isEditMode ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "loadout",
        title: title.trim(),
        description: description.trim(),
        categoryId,
        isPublic,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | null;
      setErrorMessage(payload?.error?.message ?? "Unable to save loadout.");
      setSubmitting(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | ApiLoadoutResponse
      | null;
    const updatedSlug = payload?.data?.slug;

    if (updatedSlug) {
      router.push(`/loadouts/${updatedSlug}`);
    } else {
      router.push("/saved");
    }

    router.refresh();
  }

  async function handleDelete() {
    if (!isEditMode || !identifier) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this loadout? This action cannot be undone."
    );

    if (!shouldDelete) {
      return;
    }

    setDeleting(true);
    setErrorMessage(null);

    const response = await fetch(
      `/api/collections/${encodeURIComponent(identifier)}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | null;
      setErrorMessage(payload?.error?.message ?? "Unable to delete loadout.");
      setDeleting(false);
      return;
    }

    router.push("/saved");
    router.refresh();
  }

  return (
    <form
      className="space-y-5 rounded-3xl border border-white/12 bg-[#11131a] p-6"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-white/55">
        <span>{isEditMode ? "Edit Loadout" : "Create Loadout"}</span>
        <span>
          Step {step} / 2
        </span>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-white/20 bg-[#0f1218] px-3 py-2 text-sm text-white"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/70">
            Pick one of the fixed 100 categories. You can move this loadout to a
            different category later.
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={goToDetailsStep}
              disabled={categories.length === 0}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs uppercase tracking-[0.25em] text-white/60">
            Category: <span className="text-white">{selectedCategoryLabel || "None"}</span>
          </div>

          <div>
            <label className="text-sm font-medium text-white" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="My Creator Loadout"
              required
              className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a short description"
              className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-white" htmlFor="visibility">
              Visibility
            </label>
            <select
              id="visibility"
              value={isPublic ? "public" : "draft"}
              onChange={(event) => setIsPublic(event.target.value === "public")}
              className="mt-2 w-full rounded-xl border border-white/20 bg-[#0f1218] px-3 py-2 text-sm text-white"
            >
              <option value="public">Public (visible to everyone)</option>
              <option value="draft">Draft (only you can access)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Loadout"}
              </Button>
            </div>

            {isEditMode ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleDelete}
                disabled={deleting}
                className="border-[#fda4a4]/45 text-[#fda4a4] hover:border-[#fca5a5]"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {errorMessage ? (
        <p className="text-sm text-[#fda4a4]">{errorMessage}</p>
      ) : null}
    </form>
  );
}
