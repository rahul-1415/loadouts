"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "./Button";

interface LoadoutProductItem {
  productId: string;
  slug: string | null;
  name: string;
  brand: string | null;
  description: string;
  imageUrl: string | null;
  productUrl: string | null;
  sourceUrl: string | null;
  note: string | null;
  sortOrder: number;
}

interface ProductOption {
  id: string;
  slug: string | null;
  name: string;
  brand: string | null;
  description: string;
  imageUrl: string | null;
  productUrl: string | null;
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

interface LoadoutProductsManagerProps {
  collectionIdentifier: string;
  initialItems: LoadoutProductItem[];
}

function normalizeSort(items: LoadoutProductItem[]) {
  return items.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
  }));
}

export default function LoadoutProductsManager({
  collectionIdentifier,
  initialItems,
}: LoadoutProductsManagerProps) {
  const [items, setItems] = useState<LoadoutProductItem[]>(
    normalizeSort(initialItems)
  );
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>(
    []
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const [addNote, setAddNote] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [newProductUrl, setNewProductUrl] = useState("");
  const [newProductImageUrl, setNewProductImageUrl] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<
    "load" | "add" | "save" | "delete" | null
  >(null);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setBusyAction("load");
      const response = await fetch("/api/products?limit=120", {
        cache: "no-store",
      });

      if (!response.ok) {
        setBusyAction(null);
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { data?: ProductOption[] }
        | null;

      if (active) {
        setAvailableProducts(payload?.data ?? []);
        setBusyAction(null);
      }
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const selectedProduct = useMemo(
    () => availableProducts.find((item) => item.id === selectedProductId) ?? null,
    [availableProducts, selectedProductId]
  );

  const addExistingProduct = async () => {
    if (!selectedProductId) {
      setErrorMessage("Select a product before adding.");
      return;
    }

    setErrorMessage(null);
    setMessage(null);
    setBusyAction("add");

    const response = await fetch(
      `/api/collections/${encodeURIComponent(collectionIdentifier)}/products`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          note: addNote,
        }),
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | null;
      setErrorMessage(payload?.error?.message ?? "Unable to add product.");
      setBusyAction(null);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { data?: { items?: LoadoutProductItem[] } }
      | null;
    setItems(normalizeSort(payload?.data?.items ?? []));
    setSelectedProductId("");
    setAddNote("");
    setMessage("Product added.");
    setBusyAction(null);
  };

  const addCustomProduct = async () => {
    if (!newProductName.trim()) {
      setErrorMessage("New product name is required.");
      return;
    }

    setErrorMessage(null);
    setMessage(null);
    setBusyAction("add");

    const response = await fetch(
      `/api/collections/${encodeURIComponent(collectionIdentifier)}/products`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductName,
          brand: newProductBrand,
          productUrl: newProductUrl,
          imageUrl: newProductImageUrl,
          description: newProductDescription,
          note: addNote,
        }),
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | null;
      setErrorMessage(payload?.error?.message ?? "Unable to add custom product.");
      setBusyAction(null);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { data?: { items?: LoadoutProductItem[] } }
      | null;
    setItems(normalizeSort(payload?.data?.items ?? []));
    setNewProductName("");
    setNewProductBrand("");
    setNewProductUrl("");
    setNewProductImageUrl("");
    setNewProductDescription("");
    setAddNote("");
    setMessage("Custom product created and added.");
    setBusyAction(null);
  };

  const removeProduct = async (productId: string) => {
    setErrorMessage(null);
    setMessage(null);
    setBusyAction("delete");

    const response = await fetch(
      `/api/collections/${encodeURIComponent(collectionIdentifier)}/products`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | null;
      setErrorMessage(payload?.error?.message ?? "Unable to remove product.");
      setBusyAction(null);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { data?: { items?: LoadoutProductItem[] } }
      | null;
    setItems(normalizeSort(payload?.data?.items ?? []));
    setMessage("Product removed.");
    setBusyAction(null);
  };

  const moveProduct = (index: number, direction: "up" | "down") => {
    setItems((current) => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const cloned = [...current];
      const [item] = cloned.splice(index, 1);
      cloned.splice(nextIndex, 0, item);
      return normalizeSort(cloned);
    });
  };

  const updateNote = (index: number, note: string) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              note: note || null,
            }
          : item
      )
    );
  };

  const saveOrderAndNotes = async () => {
    if (items.length === 0) {
      setErrorMessage("Add at least one product before saving order.");
      return;
    }

    setErrorMessage(null);
    setMessage(null);
    setBusyAction("save");

    const response = await fetch(
      `/api/collections/${encodeURIComponent(collectionIdentifier)}/products`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            note: item.note ?? "",
          })),
        }),
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | null;
      setErrorMessage(payload?.error?.message ?? "Unable to save order.");
      setBusyAction(null);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { data?: { items?: LoadoutProductItem[] } }
      | null;
    setItems(normalizeSort(payload?.data?.items ?? []));
    setMessage("Order and notes saved.");
    setBusyAction(null);
  };

  return (
    <section className="space-y-5 rounded-3xl border border-white/12 bg-[#11131a] p-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          Products
        </p>
        <h2 className="text-2xl font-semibold text-white">
          Manage loadout products
        </h2>
        <p className="text-sm text-white/70">
          Add existing or custom products, then reorder and save notes.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">
            Add Existing Product
          </p>
          <select
            value={selectedProductId}
            onChange={(event) => setSelectedProductId(event.target.value)}
            className="w-full rounded-xl border border-white/20 bg-[#0f1218] px-3 py-2 text-sm text-white"
          >
            <option value="">Select product</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
                {product.brand ? ` — ${product.brand}` : ""}
              </option>
            ))}
          </select>
          {selectedProduct ? (
            <p className="text-xs text-white/60">
              {selectedProduct.description || "No description"}
            </p>
          ) : null}
          <Button
            type="button"
            onClick={addExistingProduct}
            disabled={busyAction !== null}
          >
            Add Existing
          </Button>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">
            Add New Product
          </p>
          <input
            value={newProductName}
            onChange={(event) => setNewProductName(event.target.value)}
            placeholder="Product name"
            className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <input
            value={newProductBrand}
            onChange={(event) => setNewProductBrand(event.target.value)}
            placeholder="Brand (optional)"
            className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <input
            value={newProductUrl}
            onChange={(event) => setNewProductUrl(event.target.value)}
            placeholder="Product URL (optional)"
            className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <input
            value={newProductImageUrl}
            onChange={(event) => setNewProductImageUrl(event.target.value)}
            placeholder="Image URL (optional)"
            className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <textarea
            value={newProductDescription}
            onChange={(event) => setNewProductDescription(event.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
          <Button
            type="button"
            onClick={addCustomProduct}
            disabled={busyAction !== null}
          >
            Add Custom
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <label className="text-[11px] uppercase tracking-[0.25em] text-white/55">
          Note for next add
        </label>
        <input
          value={addNote}
          onChange={(event) => setAddNote(event.target.value)}
          placeholder="Optional note for added product"
          className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
        />
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.productId}
            className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">
                  #{index + 1}
                </p>
                <p className="text-sm font-semibold text-white">
                  {item.name}
                  {item.brand ? ` — ${item.brand}` : ""}
                </p>
                <p className="text-xs text-white/65">{item.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1.5 text-[10px]"
                  onClick={() => moveProduct(index, "up")}
                  disabled={index === 0}
                >
                  Up
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1.5 text-[10px]"
                  onClick={() => moveProduct(index, "down")}
                  disabled={index === items.length - 1}
                >
                  Down
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3 py-1.5 text-[10px] border-[#fda4a4]/45 text-[#fda4a4]"
                  onClick={() => removeProduct(item.productId)}
                  disabled={busyAction !== null}
                >
                  Remove
                </Button>
              </div>
            </div>

            <textarea
              value={item.note ?? ""}
              onChange={(event) => updateNote(index, event.target.value)}
              placeholder="Product note in this loadout"
              rows={2}
              className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={saveOrderAndNotes} disabled={busyAction !== null}>
          {busyAction === "save" ? "Saving..." : "Save Product Order"}
        </Button>
        {busyAction === "load" ? (
          <p className="text-xs uppercase tracking-[0.2em] text-white/55">
            Loading products...
          </p>
        ) : null}
      </div>

      {message ? <p className="text-sm text-[#86efac]">{message}</p> : null}
      {errorMessage ? (
        <p className="text-sm text-[#fda4a4]">{errorMessage}</p>
      ) : null}
    </section>
  );
}
