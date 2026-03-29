import productCatalog from "../../data/curated-product-catalog.json";
import { createSupabaseServerClient } from "../supabase/server";

interface ProductRow {
  id: string;
  slug: string | null;
  name: string;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  image_source_url: string | null;
  product_url: string | null;
  source_url: string | null;
  created_at: string;
}

interface ProductCatalogCategoryDefinition {
  slug: string;
  label: string;
}

interface ProductCatalogProductDefinition {
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  productUrl: string;
}

export interface ProductCategoryOption {
  slug: string;
  label: string;
  count: number;
}

export interface ProductCatalogItem {
  id: string;
  slug: string | null;
  name: string;
  brand: string | null;
  description: string;
  imageUrl: string | null;
  imageSourceUrl: string | null;
  productUrl: string | null;
  sourceUrl: string | null;
  categorySlug: string | null;
  categoryLabel: string | null;
}

export interface ProductCatalogResult {
  items: ProductCatalogItem[];
  totalCount: number;
  filters: {
    brands: string[];
    categories: ProductCategoryOption[];
  };
}

const catalogCategories = productCatalog.categories as ProductCatalogCategoryDefinition[];
const catalogProducts = productCatalog.products as ProductCatalogProductDefinition[];

const categoryLabelBySlug = new Map(
  catalogCategories.map((category) => [category.slug, category.label])
);

const catalogEntryBySlug = new Map(
  catalogProducts.map((product) => [product.slug, product])
);

function normalizeFilterValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function decorateProduct(row: ProductRow): ProductCatalogItem {
  const catalogEntry = row.slug ? catalogEntryBySlug.get(row.slug) ?? null : null;
  const categorySlug = catalogEntry?.categorySlug ?? null;
  const categoryLabel = categorySlug
    ? categoryLabelBySlug.get(categorySlug) ?? null
    : null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    description: row.description ?? "",
    imageUrl: row.image_url,
    imageSourceUrl: row.image_source_url,
    productUrl: row.product_url,
    sourceUrl: row.source_url,
    categorySlug,
    categoryLabel,
  };
}

function sortBrands(items: string[]) {
  return [...items].sort((left, right) => left.localeCompare(right));
}

function buildFilterOptions(items: ProductCatalogItem[]) {
  const brandSet = new Set<string>();
  const categoryCounts = new Map<string, number>();

  items.forEach((item) => {
    if (item.brand?.trim()) {
      brandSet.add(item.brand.trim());
    }

    if (item.categorySlug && item.categoryLabel) {
      categoryCounts.set(
        item.categorySlug,
        (categoryCounts.get(item.categorySlug) ?? 0) + 1
      );
    }
  });

  const categories = catalogCategories
    .filter((category) => categoryCounts.has(category.slug))
    .map((category) => ({
      slug: category.slug,
      label: category.label,
      count: categoryCounts.get(category.slug) ?? 0,
    }));

  return {
    brands: sortBrands(Array.from(brandSet)),
    categories,
  };
}

function matchesProductFilters(
  item: ProductCatalogItem,
  {
    query,
    brand,
    category,
  }: {
    query: string;
    brand: string;
    category: string;
  }
) {
  if (
    brand &&
    normalizeFilterValue(item.brand) !== brand
  ) {
    return false;
  }

  if (category && item.categorySlug !== category) {
    return false;
  }

  if (!query) {
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

  return haystack.includes(query);
}

export function getCatalogCategoryBySlug(slug: string | null | undefined) {
  if (!slug) {
    return null;
  }

  const label = categoryLabelBySlug.get(slug);

  if (!label) {
    return null;
  }

  return {
    slug,
    label,
  };
}

export function getCatalogCategoryByProductSlug(productSlug: string | null | undefined) {
  if (!productSlug) {
    return null;
  }

  const catalogEntry = catalogEntryBySlug.get(productSlug);

  if (!catalogEntry) {
    return null;
  }

  return getCatalogCategoryBySlug(catalogEntry.categorySlug);
}

export async function getProductCatalog({
  query = "",
  brand = "",
  category = "",
  limit = 60,
}: {
  query?: string;
  brand?: string;
  category?: string;
  limit?: number;
} = {}): Promise<ProductCatalogResult> {
  const supabase = await createSupabaseServerClient();
  const safeLimit = Math.min(Math.max(limit, 1), 240);

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,slug,name,brand,description,image_url,image_source_url,product_url,source_url,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(400);

  if (error) {
    throw new Error(error.message);
  }

  const decoratedItems = ((data ?? []) as ProductRow[]).map(decorateProduct);
  const filters = buildFilterOptions(decoratedItems);
  const normalizedQuery = normalizeFilterValue(query);
  const normalizedBrand = normalizeFilterValue(brand);
  const normalizedCategory = normalizeFilterValue(category);

  const filteredItems = decoratedItems.filter((item) =>
    matchesProductFilters(item, {
      query: normalizedQuery,
      brand: normalizedBrand,
      category: normalizedCategory,
    })
  );

  return {
    items: filteredItems.slice(0, safeLimit),
    totalCount: filteredItems.length,
    filters,
  };
}
