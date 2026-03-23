"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button, { ButtonLink } from "./Button";
import LoadoutProductsManager from "./LoadoutProductsManager";

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

interface CreatedLoadoutState {
  id: string;
  slug: string;
  title: string;
}

export default function NewLoadoutForm({
  categories,
  mode = "create",
  identifier,
  initialValues,
}: NewLoadoutFormProps) {
  const router = useRouter();
  const isEditMode = mode === "edit";
  const [step, setStep] = useState<1 | 2 | 3>(
    initialValues?.categoryId ? 2 : 1
  );
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [isPublic, setIsPublic] = useState(initialValues?.isPublic ?? true);
  const [addProductsNow, setAddProductsNow] = useState(true);
  const [createdLoadout, setCreatedLoadout] =
    useState<CreatedLoadoutState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const totalSteps = isEditMode ? 2 : 3;

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
    const updatedId = payload?.data?.id;

    if (!isEditMode && addProductsNow && updatedSlug && updatedId) {
      setCreatedLoadout({
        id: updatedId,
        slug: updatedSlug,
        title: title.trim(),
      });
      setSubmitting(false);
      setErrorMessage(null);
      setStep(3);
      router.refresh();
      return;
    }

    if (updatedSlug) {
      router.push(`/loadouts/${updatedSlug}`);
    } else {
      router.push("/my-loadouts");
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

    router.push("/my-loadouts");
    router.refresh();
  }

  return (
    <div className="space-y-5 rounded-3xl border border-white/[0.05] bg-[#171717] p-6">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-white/55">
        <span>{isEditMode ? "Edit Loadout" : "Create Loadout"}</span>
        <span>
          Step {step} / {totalSteps}
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
              className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] px-4 py-3 text-sm text-white/70">
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
      ) : null}

      {step === 2 ? (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] px-4 py-3 text-xs uppercase tracking-[0.25em] text-white/60">
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
              className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
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
              className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
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
              className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white"
            >
              <option value="public">Public (visible to everyone)</option>
              <option value="draft">Draft (only you can access)</option>
            </select>
          </div>

          {!isEditMode ? (
            <label className="flex items-start gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.03] px-4 py-3">
              <input
                type="checkbox"
                checked={addProductsNow}
                onChange={(event) => setAddProductsNow(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border border-white/[0.16] bg-[#181818] accent-[#e6ef92]"
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-white">
                  Add products right after creating
                </span>
                <span className="block text-xs text-white/60">
                  Stay on this page for one more step so you can attach products
                  to the loadout immediately.
                </span>
              </span>
            </label>
          ) : null}

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
        </form>
      ) : null}

      {step === 3 && createdLoadout ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">
              Step 3
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Add products to your loadout
            </h2>
            <p className="mt-2 text-sm text-white/70">
              <span className="text-white">{createdLoadout.title}</span> has been
              created. Add products now or finish and manage them later from the
              loadout editor.
            </p>
          </div>

          <LoadoutProductsManager
            collectionIdentifier={createdLoadout.slug}
            initialItems={[]}
          />

          <div className="flex flex-wrap gap-3">
            <ButtonLink href={`/loadouts/${createdLoadout.slug}`}>
              View Loadout
            </ButtonLink>
            <ButtonLink
              href={`/loadouts/${createdLoadout.slug}/edit`}
              variant="secondary"
            >
              Open Editor
            </ButtonLink>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="text-sm text-[#fda4a4]">{errorMessage}</p>
      ) : null}
    </div>
  );
}
