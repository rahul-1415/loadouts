"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Button from "./Button";

interface CategoryOption {
  id: string;
  slug: string;
  title: string;
}

interface NewLoadoutFormProps {
  categories: CategoryOption[];
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

interface ApiCreateResponse {
  data?: {
    id: string;
    slug: string;
  };
}

export default function NewLoadoutForm({ categories }: NewLoadoutFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoryId) {
      setErrorMessage("Select a category before creating a loadout.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const response = await fetch("/api/collections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "loadout",
        title,
        description,
        categoryId,
        isPublic: true,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | null;
      setErrorMessage(
        payload?.error?.message ?? "Unable to create loadout right now."
      );
      setSubmitting(false);
      return;
    }

    const payload = (await response.json()) as ApiCreateResponse;
    const createdSlug = payload.data?.slug;

    if (createdSlug) {
      router.push(`/loadouts/${createdSlug}`);
      router.refresh();
      return;
    }

    router.push("/saved");
    router.refresh();
  }

  return (
    <form
      className="space-y-4 rounded-3xl border border-white/12 bg-[#11131a] p-6"
      onSubmit={handleSubmit}
    >
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

      {errorMessage ? (
        <p className="text-sm text-[#fda4a4]">{errorMessage}</p>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Creating..." : "Create Loadout"}
      </Button>
    </form>
  );
}
