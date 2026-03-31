"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "./Button";
import ImageUploadField from "./ImageUploadField";
import LoadoutProductsManager from "./LoadoutProductsManager";
import type { LoadoutStatus } from "../lib/data/collections";
import { slugifyLoadoutTitle } from "../lib/loadoutPublishing";

interface CategoryOption {
  id: string;
  slug: string;
  title: string;
}

interface NewLoadoutFormProps {
  categories: CategoryOption[];
  mode?: "create" | "edit";
  identifier?: string;
  existingLoadoutSlugs?: string[];
  initialValues?: {
    title: string;
    description: string;
    categoryId: string;
    coverImageUrl: string;
    status: LoadoutStatus;
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
    path?: string;
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
  existingLoadoutSlugs = [],
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
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialValues?.coverImageUrl ?? ""
  );
  const [status] = useState<LoadoutStatus>(initialValues?.status ?? "draft");
  const [createdLoadout, setCreatedLoadout] =
    useState<CreatedLoadoutState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finalizingStatus, setFinalizingStatus] = useState<LoadoutStatus | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const totalSteps = isEditMode ? 2 : 3;

  const selectedCategoryLabel = useMemo(
    () => categories.find((category) => category.id === categoryId)?.title ?? "",
    [categories, categoryId]
  );
  const normalizedTitleSlug = useMemo(
    () => slugifyLoadoutTitle(title),
    [title]
  );
  const hasDuplicateTitle = useMemo(() => {
    if (!normalizedTitleSlug) {
      return false;
    }

    return existingLoadoutSlugs.some((slug) => slug === normalizedTitleSlug);
  }, [existingLoadoutSlugs, normalizedTitleSlug]);

  function goToDetailsStep() {
    if (!categoryId) {
      setErrorMessage("Select a category before continuing.");
      return;
    }

    setErrorMessage(null);
    setStep(2);
  }

  async function saveLoadout(nextStatus: LoadoutStatus) {
    if (!categoryId) {
      setErrorMessage("Select a category before saving.");
      setStep(1);
      return null;
    }

    if (!title.trim()) {
      setErrorMessage("Title is required.");
      setStep(2);
      return null;
    }

    if (!isEditMode && hasDuplicateTitle) {
      setErrorMessage(
        "You already have a loadout with this title. Choose a different title."
      );
      setStep(2);
      return null;
    }

    const activeIdentifier = isEditMode
      ? identifier
      : createdLoadout?.slug ?? null;

    if (isEditMode && !activeIdentifier) {
      setErrorMessage("Missing loadout identifier.");
      return null;
    }

    const endpoint = activeIdentifier
      ? `/api/collections/${encodeURIComponent(activeIdentifier)}`
      : "/api/collections";
    const method = activeIdentifier ? "PUT" : "POST";

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
        coverImageUrl: coverImageUrl.trim(),
        status: nextStatus,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | null;
      setErrorMessage(payload?.error?.message ?? "Unable to save loadout.");
      return null;
    }

    const payload = (await response.json().catch(() => null)) as
      | ApiLoadoutResponse
      | null;

    return payload?.data ?? null;
  }

  async function handleStepTwoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    if (isEditMode) {
      const savedLoadout = await saveLoadout(status);
      setSubmitting(false);

      if (!savedLoadout?.slug) {
        return;
      }

      router.push(savedLoadout.path ?? `/loadouts/${savedLoadout.slug}`);
      router.refresh();
      return;
    }

    const savedDraft = await saveLoadout("draft");
    setSubmitting(false);

    if (!savedDraft?.slug || !savedDraft.id) {
      return;
    }

    setCreatedLoadout({
      id: savedDraft.id,
      slug: savedDraft.slug,
      title: title.trim(),
    });
    setStep(3);
    router.refresh();
  }

  async function finalizeCreate(nextStatus: LoadoutStatus) {
    if (!createdLoadout?.slug) {
      setErrorMessage("Complete step 2 before finishing the loadout.");
      setStep(2);
      return;
    }

    setFinalizingStatus(nextStatus);
    setErrorMessage(null);

    const savedLoadout = await saveLoadout(nextStatus);
    setFinalizingStatus(null);

    if (!savedLoadout?.slug) {
      return;
    }

    if (nextStatus === "published") {
      router.push(savedLoadout.path ?? `/loadouts/${savedLoadout.slug}`);
    } else {
      router.push("/studio");
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

    router.push("/studio");
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
        <form className="space-y-4" onSubmit={handleStepTwoSubmit}>
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
              onChange={(event) => {
                setTitle(event.target.value);
                if (errorMessage) {
                  setErrorMessage(null);
                }
              }}
              placeholder="My Creator Loadout"
              required
              className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
            />
            {hasDuplicateTitle && !isEditMode ? (
              <p className="mt-2 text-xs text-[#fda4a4]">
                You already used this title on your page. Pick a different one.
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-white" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description"
              className="mt-2 w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
              rows={4}
            />
          </div>

          <ImageUploadField
            label="Cover Image"
            kind="loadout-cover"
            value={coverImageUrl}
            onChange={setCoverImageUrl}
            helpText="Optional. You can add a cover image now or later."
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? isEditMode
                    ? "Saving..."
                    : "Continuing..."
                  : isEditMode
                    ? "Save Changes"
                    : "Continue"}
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
              Add products and finish your loadout
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Add the products first, then choose whether to save this loadout as a draft or publish it.
            </p>
          </div>

          <LoadoutProductsManager
            collectionIdentifier={createdLoadout.slug}
            initialItems={[]}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => finalizeCreate("draft")}
              disabled={finalizingStatus !== null}
            >
              {finalizingStatus === "draft" ? "Saving Draft..." : "Draft"}
            </Button>
            <Button
              type="button"
              onClick={() => finalizeCreate("published")}
              disabled={finalizingStatus !== null}
            >
              {finalizingStatus === "published" ? "Creating..." : "Create Loadout"}
            </Button>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="text-sm text-[#fda4a4]">{errorMessage}</p>
      ) : null}
    </div>
  );
}
