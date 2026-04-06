"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "./Button";
import ImageUploadField from "./ImageUploadField";

export type AttachmentType = "product" | "submission";
type ComposerMode = "existing" | "custom";

export interface LoadoutProductItem {
  attachmentType: AttachmentType;
  attachmentId: string;
  attachmentKey: string;
  productId: string | null;
  submissionId: string | null;
  slug: string | null;
  name: string;
  brand: string | null;
  description: string;
  imageUrl: string | null;
  productUrl: string | null;
  sourceUrl: string | null;
  note: string | null;
  sortOrder: number;
  reviewStatus: "pending" | "approved" | "rejected" | null;
}

interface ProductOption {
  id: string;
  slug: string | null;
  name: string;
  brand: string | null;
  description: string;
  imageUrl: string | null;
  productUrl: string | null;
  categorySlug: string | null;
  categoryLabel: string | null;
}

interface ProductCategoryOption {
  slug: string;
  label: string;
  count: number;
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
  defaultComposerOpen?: boolean;
  defaultComposerMode?: ComposerMode;
  showComposerCloseButton?: boolean;
  stickyComposer?: boolean;
  onItemsChange?: (items: LoadoutProductItem[]) => void;
}

function normalizeSort(items: LoadoutProductItem[]) {
  return [...items]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));
}

function serializeManagedItems(items: LoadoutProductItem[]) {
  return JSON.stringify(
    normalizeSort(items).map((item) => ({
      attachmentId: item.attachmentId,
      attachmentType: item.attachmentType,
      sortOrder: item.sortOrder,
      note: item.note ?? "",
    }))
  );
}

function ProductThumb({
  imageUrl,
  name,
  className = "h-16 w-16",
}: {
  imageUrl: string | null;
  name: string;
  className?: string;
}) {
  return (
    <div
      className={`${className} shrink-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111111]`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : null}
    </div>
  );
}

export default function LoadoutProductsManager({
  collectionIdentifier,
  initialItems,
  defaultComposerOpen = false,
  defaultComposerMode = "existing",
  showComposerCloseButton = true,
  stickyComposer = false,
  onItemsChange,
}: LoadoutProductsManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<LoadoutProductItem[]>(
    normalizeSort(initialItems)
  );
  const [savedItemsSignature, setSavedItemsSignature] = useState(() =>
    serializeManagedItems(initialItems)
  );
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<
    ProductCategoryOption[]
  >([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [newProductUrl, setNewProductUrl] = useState("");
  const [newProductImageUrl, setNewProductImageUrl] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [composerOpen, setComposerOpen] = useState(defaultComposerOpen);
  const [composerMode, setComposerMode] = useState<ComposerMode>(defaultComposerMode);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<
    "load" | "add" | "save" | "delete" | null
  >(null);

  useEffect(() => {
    onItemsChange?.(items);
  }, [items, onItemsChange]);

  useEffect(() => {
    setSavedItemsSignature(serializeManagedItems(initialItems));
  }, [initialItems]);

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setBusyAction("load");
      const response = await fetch("/api/products?limit=240", {
        cache: "no-store",
      });

      if (!response.ok) {
        setBusyAction(null);
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | {
            data?: ProductOption[];
            meta?: {
              brands?: string[];
              categories?: ProductCategoryOption[];
            };
          }
        | null;

      if (active) {
        setAvailableProducts(payload?.data ?? []);
        setAvailableBrands(payload?.meta?.brands ?? []);
        setAvailableCategories(payload?.meta?.categories ?? []);
        setBusyAction(null);
      }
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadExistingItems = async () => {
      const response = await fetch(
        `/api/collections/${encodeURIComponent(collectionIdentifier)}/products`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { data?: { items?: LoadoutProductItem[] } }
        | null;

      if (active && payload?.data?.items) {
        const normalizedItems = normalizeSort(payload.data.items);
        setItems(normalizedItems);
        setSavedItemsSignature(serializeManagedItems(normalizedItems));
      }
    };

    void loadExistingItems();

    return () => {
      active = false;
    };
  }, [collectionIdentifier]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = productQuery.trim().toLowerCase();
    const normalizedBrand = selectedBrandFilter.trim().toLowerCase();
    const normalizedCategory = selectedCategoryFilter.trim().toLowerCase();

    return availableProducts.filter((item) => {
      if (normalizedBrand && item.brand?.trim().toLowerCase() !== normalizedBrand) {
        return false;
      }

      if (normalizedCategory && item.categorySlug !== normalizedCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        item.name,
        item.brand ?? "",
        item.description,
        item.categoryLabel ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [availableProducts, productQuery, selectedBrandFilter, selectedCategoryFilter]);

  const selectedProduct = useMemo(
    () => availableProducts.find((item) => item.id === selectedProductId) ?? null,
    [availableProducts, selectedProductId]
  );
  const hasUnsavedProductChanges = useMemo(
    () => serializeManagedItems(items) !== savedItemsSignature,
    [items, savedItemsSignature]
  );

  const resetComposer = () => {
    setComposerOpen(stickyComposer ? true : false);
    setComposerMode("existing");
    setSelectedProductId("");
    setProductQuery("");
    setSelectedBrandFilter("");
    setSelectedCategoryFilter("");
    setNewProductName("");
    setNewProductBrand("");
    setNewProductUrl("");
    setNewProductImageUrl("");
    setNewProductDescription("");
  };

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
    const normalizedItems = normalizeSort(payload?.data?.items ?? []);
    setItems(normalizedItems);
    setSavedItemsSignature(serializeManagedItems(normalizedItems));
    setMessage("Product added.");
    setBusyAction(null);
    resetComposer();
    router.refresh();
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
    const normalizedItems = normalizeSort(payload?.data?.items ?? []);
    setItems(normalizedItems);
    setSavedItemsSignature(serializeManagedItems(normalizedItems));
    setMessage("Custom product submitted for review and added to this loadout.");
    setBusyAction(null);
    resetComposer();
    router.refresh();
  };

  const removeProduct = async (item: LoadoutProductItem) => {
    setErrorMessage(null);
    setMessage(null);
    setBusyAction("delete");

    const response = await fetch(
      `/api/collections/${encodeURIComponent(collectionIdentifier)}/products`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attachmentId: item.attachmentId,
          attachmentType: item.attachmentType,
        }),
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
    const normalizedItems = normalizeSort(payload?.data?.items ?? []);
    setItems(normalizedItems);
    setSavedItemsSignature(serializeManagedItems(normalizedItems));
    setMessage("Product removed.");
    setBusyAction(null);
    router.refresh();
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
      setErrorMessage("Add at least one product before saving changes.");
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
            attachmentId: item.attachmentId,
            attachmentType: item.attachmentType,
            note: item.note ?? "",
          })),
        }),
      }
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | ApiErrorResponse
        | null;
      setErrorMessage(payload?.error?.message ?? "Unable to save product changes.");
      setBusyAction(null);
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { data?: { items?: LoadoutProductItem[] } }
      | null;
    const normalizedItems = normalizeSort(payload?.data?.items ?? []);
    setItems(normalizedItems);
    setSavedItemsSignature(serializeManagedItems(normalizedItems));
    setMessage("Product changes saved.");
    setBusyAction(null);
    router.refresh();
  };

  return (
    <section className="space-y-5 rounded-3xl border border-white/[0.05] bg-[#171717] p-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.45em] text-white/50">
          Products
        </p>
        <h2 className="text-2xl font-semibold text-white">
          Build the product stack
        </h2>
        <p className="text-sm text-white/70">
          Search the approved catalog on the left, then refine the products that are attached to this loadout on the right.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4 rounded-2xl border border-white/[0.04] bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">
                Catalog
              </p>
              <p className="mt-2 text-sm text-white/68">
                Search by product name, brand, or category and add approved products directly into the loadout.
              </p>
            </div>
            <Button
              type="button"
              variant={composerMode === "custom" ? "primary" : "secondary"}
              className="px-4 py-2 text-[10px]"
              onClick={() => {
                setComposerOpen(true);
                setComposerMode((currentMode) =>
                  currentMode === "custom" ? "existing" : "custom"
                );
                setErrorMessage(null);
                setMessage(null);
              }}
            >
              {composerMode === "custom" ? "Use Existing Product" : "Submit a Custom Product"}
            </Button>
          </div>

          {composerMode === "custom" && composerOpen ? (
            <div className="space-y-3 rounded-2xl border border-[#d4dd7f]/18 bg-[#12150d] p-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-[#e6ef92]">
                  Custom Product Submission
                </p>
                <p className="mt-2 text-sm text-white/68">
                  This creates a product submission for review and attaches it only to this loadout for now.
                </p>
              </div>
              <input
                value={newProductName}
                onChange={(event) => setNewProductName(event.target.value)}
                placeholder="Product name"
                className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={newProductBrand}
                  onChange={(event) => setNewProductBrand(event.target.value)}
                  placeholder="Brand (optional)"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
                />
                <input
                  value={newProductUrl}
                  onChange={(event) => setNewProductUrl(event.target.value)}
                  placeholder="Product URL (optional)"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
                />
              </div>
              <ImageUploadField
                label="Product Image"
                kind="product-image"
                value={newProductImageUrl}
                onChange={setNewProductImageUrl}
                helpText="Upload a custom image if the product is not in the approved catalog yet."
              />
              <textarea
                value={newProductDescription}
                onChange={(event) => setNewProductDescription(event.target.value)}
                placeholder="Description (optional)"
                rows={3}
                className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={addCustomProduct}
                  disabled={busyAction !== null}
                >
                  Submit Custom Product
                </Button>
                {showComposerCloseButton || stickyComposer ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setComposerMode("existing");
                      if (!stickyComposer) {
                        resetComposer();
                      }
                    }}
                  >
                    Back to Catalog
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3">
                <input
                  value={productQuery}
                  onChange={(event) => setProductQuery(event.target.value)}
                  placeholder="Search the product catalog"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-3 text-sm text-white placeholder:text-white/40"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={selectedBrandFilter}
                    onChange={(event) => setSelectedBrandFilter(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white"
                  >
                    <option value="">All brands</option>
                    {availableBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(event) => setSelectedCategoryFilter(event.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white"
                  >
                    <option value="">All product categories</option>
                    {availableCategories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.label} ({category.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">
                  {filteredProducts.length} matching products
                </p>
                {selectedProduct ? (
                  <Button
                    type="button"
                    onClick={addExistingProduct}
                    disabled={busyAction !== null}
                  >
                    Add Selected Product
                  </Button>
                ) : null}
              </div>

              {selectedProduct ? (
                <div className="flex gap-3 rounded-2xl border border-[#d4dd7f]/22 bg-[#11140d] p-3">
                  <ProductThumb
                    imageUrl={selectedProduct.imageUrl}
                    name={selectedProduct.name}
                  />
                  <div className="min-w-0 space-y-1 text-xs text-white/60">
                    <p className="text-sm font-semibold text-white">
                      {selectedProduct.name}
                      {selectedProduct.brand ? ` — ${selectedProduct.brand}` : ""}
                    </p>
                    <p>{selectedProduct.description || "No description."}</p>
                    {selectedProduct.categoryLabel ? (
                      <p className="uppercase tracking-[0.2em] text-white/45">
                        {selectedProduct.categoryLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-2">
                {filteredProducts.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.05] bg-[#111111] px-4 py-6 text-sm text-white/55">
                    No products match this search yet.
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const isSelected = product.id === selectedProductId;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setSelectedProductId(product.id)}
                        className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                          isSelected
                            ? "border-[#d4dd7f]/55 bg-[#1f2117]"
                            : "border-white/[0.05] bg-[#171717] hover:border-white/[0.14]"
                        }`}
                      >
                        <ProductThumb imageUrl={product.imageUrl} name={product.name} />
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {product.brand ? (
                              <span className="text-[10px] uppercase tracking-[0.22em] text-white/50">
                                {product.brand}
                              </span>
                            ) : null}
                            {product.categoryLabel ? (
                              <span className="rounded-full border border-white/[0.08] bg-[#111111] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/45">
                                {product.categoryLabel}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm font-semibold text-white">
                            {product.name}
                          </p>
                          <p className="line-clamp-2 text-xs text-white/62">
                            {product.description || "No description"}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4 rounded-2xl border border-white/[0.04] bg-white/[0.03] p-4 xl:sticky xl:top-24 xl:self-start">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">
                  In This Loadout
                </p>
                <p className="mt-2 text-sm text-white/68">
                  Review the attached products and optionally add notes that can surface in review or on the published loadout.
                </p>
              </div>
              <span className="rounded-full border border-white/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/60">
                {items.length}
              </span>
            </div>

            {hasUnsavedProductChanges ? (
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#e6ef92]">
                Unsaved product changes
              </p>
            ) : (
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                Product order saved
              </p>
            )}
          </div>

          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#111111] px-4 py-8 text-center text-sm text-white/55">
                Add at least one product to continue the publishing flow.
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={`${item.attachmentType}:${item.attachmentId}`}
                  className="space-y-3 rounded-2xl border border-white/[0.04] bg-[#111111] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <ProductThumb imageUrl={item.imageUrl} name={item.name} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">
                            #{index + 1}
                          </p>
                          {item.attachmentType === "submission" ? (
                            <span className="rounded-full border border-[#d4dd7f]/25 bg-[#10120d] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[#e6ef92]">
                              {item.reviewStatus === "rejected"
                                ? "Rejected"
                                : item.reviewStatus === "approved"
                                  ? "Approved"
                                  : "Pending review"}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm font-semibold text-white">
                          {item.name}
                          {item.brand ? ` — ${item.brand}` : ""}
                        </p>
                        <p className="text-xs text-white/65">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-1.5 text-[10px] border-[#fda4a4]/45 text-[#fda4a4]"
                        onClick={() => removeProduct(item)}
                        disabled={busyAction !== null}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <textarea
                    value={item.note ?? ""}
                    onChange={(event) => updateNote(index, event.target.value)}
                    placeholder="Optional note for this loadout entry"
                    rows={2}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3 py-2 text-sm text-white placeholder:text-white/40"
                  />
                </div>
              ))
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={saveOrderAndNotes}
              disabled={busyAction !== null || items.length === 0 || !hasUnsavedProductChanges}
            >
              {busyAction === "save" ? "Saving..." : "Save Product Changes"}
            </Button>
            {busyAction === "load" ? (
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">
                Loading catalog...
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      {message ? <p className="text-sm text-[#86efac]">{message}</p> : null}
      {errorMessage ? (
        <p className="text-sm text-[#fda4a4]">{errorMessage}</p>
      ) : null}
    </section>
  );
}
