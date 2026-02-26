import { createSupabaseServerClient } from "../supabase/server";
import { getPublicProfileByUserId } from "./profiles";

type SearchType = "loadouts" | "categories" | "products" | "profiles";

interface SearchLoadoutRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  owner_id: string;
}

interface SearchCategoryRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

interface SearchProductRow {
  id: string;
  slug: string | null;
  name: string;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
}

interface SearchProfileRow {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface SearchLoadoutItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  author: string;
}

export interface SearchCategoryItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
}

export interface SearchProductItem {
  id: string;
  slug: string | null;
  name: string;
  brand: string | null;
  description: string;
  imageUrl: string | null;
  productUrl: string | null;
}

export interface SearchProfileItem {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
}

export interface SearchResults {
  query: string;
  types: SearchType[];
  loadouts: SearchLoadoutItem[];
  categories: SearchCategoryItem[];
  products: SearchProductItem[];
  profiles: SearchProfileItem[];
}

const allSearchTypes: SearchType[] = [
  "loadouts",
  "categories",
  "products",
  "profiles",
];

export function normalizeSearchTypes(rawTypes: string | null | undefined) {
  if (!rawTypes) {
    return allSearchTypes;
  }

  const parts = rawTypes
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part): part is SearchType =>
      allSearchTypes.includes(part as SearchType)
    );

  if (parts.length === 0) {
    return allSearchTypes;
  }

  return Array.from(new Set(parts));
}

function buildTextFilter(query: string) {
  if (!query) {
    return null;
  }

  return `%${query.replace(/%/g, "")}%`;
}

export async function searchSiteContent({
  query,
  types,
  categorySlug,
  limitPerType = 12,
}: {
  query: string;
  types: SearchType[];
  categorySlug?: string | null;
  limitPerType?: number;
}): Promise<SearchResults> {
  const supabase = await createSupabaseServerClient();
  const safeLimit = Math.min(Math.max(limitPerType, 1), 24);
  const textFilter = buildTextFilter(query.trim().toLowerCase());
  let categoryId: string | null = null;

  if (categorySlug?.trim()) {
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug.trim().toLowerCase())
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    categoryId = categoryData?.id ?? null;
  }

  let loadouts: SearchLoadoutItem[] = [];
  let categories: SearchCategoryItem[] = [];
  let products: SearchProductItem[] = [];
  let profiles: SearchProfileItem[] = [];

  if (types.includes("loadouts")) {
    let loadoutQuery = supabase
      .from("collections")
      .select("id,slug,title,description,cover_image_url,owner_id")
      .eq("kind", "loadout")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (categoryId) {
      loadoutQuery = loadoutQuery.eq("category_id", categoryId);
    }

    if (textFilter) {
      loadoutQuery = loadoutQuery.or(
        `title.ilike.${textFilter},description.ilike.${textFilter}`
      );
    }

    const { data: loadoutRows } = await loadoutQuery;
    const rows = (loadoutRows ?? []) as SearchLoadoutRow[];

    const ownerIds = Array.from(new Set(rows.map((row) => row.owner_id)));
    const ownerProfiles = await Promise.all(
      ownerIds.map((ownerId) => getPublicProfileByUserId(ownerId, supabase))
    );
    const handleByOwner = new Map<string, string>();
    ownerProfiles.forEach((profile) => {
      if (profile) {
        handleByOwner.set(profile.id, `@${profile.handle}`);
      }
    });

    loadouts = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description ?? "",
      coverImageUrl: row.cover_image_url,
      author: handleByOwner.get(row.owner_id) ?? "@unknown",
    }));
  }

  if (types.includes("categories")) {
    let categoriesQuery = supabase
      .from("categories")
      .select("id,slug,title,description,cover_image_url")
      .eq("is_active", true)
      .order("title", { ascending: true })
      .limit(safeLimit);

    if (textFilter) {
      categoriesQuery = categoriesQuery.or(
        `title.ilike.${textFilter},description.ilike.${textFilter}`
      );
    }

    const { data: categoryRows } = await categoriesQuery;
    categories = ((categoryRows ?? []) as SearchCategoryRow[]).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description ?? "",
      coverImageUrl: row.cover_image_url,
    }));
  }

  if (types.includes("products")) {
    let productsQuery = supabase
      .from("products")
      .select("id,slug,name,brand,description,image_url,product_url")
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (textFilter) {
      productsQuery = productsQuery.or(
        `name.ilike.${textFilter},brand.ilike.${textFilter},description.ilike.${textFilter}`
      );
    }

    const { data: productRows } = await productsQuery;
    products = ((productRows ?? []) as SearchProductRow[]).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      description: row.description ?? "",
      imageUrl: row.image_url,
      productUrl: row.product_url,
    }));
  }

  if (types.includes("profiles")) {
    let profilesQuery = supabase
      .from("profiles")
      .select("id,handle,display_name,avatar_url,bio")
      .not("handle", "is", null)
      .not("display_name", "is", null)
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (textFilter) {
      profilesQuery = profilesQuery.or(
        `handle.ilike.${textFilter},display_name.ilike.${textFilter},bio.ilike.${textFilter}`
      );
    }

    const { data: profileRows } = await profilesQuery;
    profiles = ((profileRows ?? []) as SearchProfileRow[])
      .filter((row) => Boolean(row.handle && row.display_name))
      .map((row) => ({
        id: row.id,
        handle: row.handle as string,
        displayName: row.display_name as string,
        avatarUrl: row.avatar_url,
        bio: row.bio ?? "",
      }));
  }

  return {
    query: query.trim(),
    types,
    loadouts,
    categories,
    products,
    profiles,
  };
}
