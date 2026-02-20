import { createSupabaseServerClient } from "../supabase/server";
import {
  FIXED_CATEGORY_MAX_SLUG,
  FIXED_CATEGORY_MIN_SLUG,
  isFixedCategorySlug,
} from "./fixedCategories";

export type CollectionKind = "category" | "loadout";

interface CollectionRow {
  id: string;
  slug: string;
  kind: CollectionKind;
  owner_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
}

interface CategoryRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

interface CategoryImageRow {
  slug: string;
  cover_image_url: string | null;
  cover_image_source_url: string | null;
}

interface ProfileRow {
  id: string;
  handle: string | null;
  display_name: string | null;
}

interface CommentRow {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
}

interface CollectionProductJoinRow {
  sort_order: number | null;
  note: string | null;
  products: ProductRow | ProductRow[] | null;
}

interface ProductRow {
  id: string;
  slug: string | null;
  name: string;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  source_url: string | null;
}

export interface CollectionListItem {
  id: string;
  slug: string;
  kind: CollectionKind;
  title: string;
  description: string;
  author: string;
  coverImageUrl: string | null;
  coverImageSourceUrl: string | null;
}

export interface CollectionProductItem {
  id: string;
  slug: string | null;
  name: string;
  brand: string;
  description: string;
  imageUrl: string | null;
  productUrl: string | null;
  sourceUrl: string | null;
  note: string | null;
  sortOrder: number;
}

export interface CollectionCommentItem {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface CollectionDetail extends CollectionListItem {
  likeCount: number;
  products: CollectionProductItem[];
  comments: CollectionCommentItem[];
}

export interface CategoryOption {
  id: string;
  slug: string;
  title: string;
}

export interface CategoryDetailItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
}

export interface CategoryWithLoadouts {
  category: CategoryDetailItem;
  loadouts: CollectionListItem[];
}

export interface CategoryImageFields {
  coverImageUrl: string | null;
  coverImageSourceUrl: string | null;
}

function formatAuthor(profile: ProfileRow | undefined) {
  if (profile?.handle) {
    return `@${profile.handle}`;
  }

  if (profile?.display_name) {
    return profile.display_name;
  }

  return "@unknown";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function loadProfilesByIds(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, ProfileRow>();
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,handle,display_name")
    .in("id", userIds);

  const rows = (data ?? []) as ProfileRow[];
  return new Map(rows.map((profile) => [profile.id, profile]));
}

function toListItem(
  row: CollectionRow,
  profileById: Map<string, ProfileRow>
): CollectionListItem {
  const profile = profileById.get(row.owner_id);

  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    title: row.title,
    description: row.description ?? "",
    author: formatAuthor(profile),
    coverImageUrl: row.cover_image_url,
    coverImageSourceUrl: null,
  };
}

function toCategoryDetail(row: CategoryRow): CategoryDetailItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    coverImageUrl: row.cover_image_url,
  };
}

function normalizeProduct(product: ProductRow | ProductRow[] | null) {
  if (!product) {
    return null;
  }

  return Array.isArray(product) ? product[0] ?? null : product;
}

export async function getPublicCollections({
  limit = 24,
  kind,
}: {
  limit?: number;
  kind?: CollectionKind;
} = {}) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("collections")
    .select(
      "id,slug,kind,owner_id,title,description,cover_image_url,created_at"
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (kind) {
    query = query.eq("kind", kind);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CollectionRow[];
  const ownerIds = Array.from(new Set(rows.map((row) => row.owner_id)));
  const profileById = await loadProfilesByIds(ownerIds);

  return rows.map((row) => toListItem(row, profileById));
}

export async function getPublicCollectionByIdentifier(
  identifier: string,
  kind?: CollectionKind
): Promise<CollectionDetail | null> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("collections")
    .select(
      "id,slug,kind,owner_id,title,description,cover_image_url,created_at,is_public"
    )
    .eq("is_public", true)
    .limit(1);

  if (kind) {
    query = query.eq("kind", kind);
  }

  query = isUuid(identifier)
    ? query.eq("id", identifier)
    : query.eq("slug", identifier);

  const { data: collectionData, error: collectionError } =
    await query.maybeSingle();

  if (collectionError) {
    throw new Error(collectionError.message);
  }

  if (!collectionData) {
    return null;
  }

  const collection = collectionData as CollectionRow;
  const ownerProfiles = await loadProfilesByIds([collection.owner_id]);
  const listItem = toListItem(collection, ownerProfiles);

  const { data: joinedProducts, error: productsError } = await supabase
    .from("collection_products")
    .select(
      "sort_order,note,products:product_id(id,slug,name,brand,description,image_url,product_url,source_url)"
    )
    .eq("collection_id", collection.id)
    .order("sort_order", { ascending: true });

  if (productsError) {
    throw new Error(productsError.message);
  }

  const products = ((joinedProducts ?? []) as CollectionProductJoinRow[])
    .map((row) => {
      const product = normalizeProduct(row.products);

      if (!product) {
        return null;
      }

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand ?? "",
        description: product.description ?? "",
        imageUrl: product.image_url,
        productUrl: product.product_url,
        sourceUrl: product.source_url,
        note: row.note,
        sortOrder: row.sort_order ?? 0,
      } as CollectionProductItem;
    })
    .filter((row): row is CollectionProductItem => row !== null);

  const { data: commentsData, error: commentsError } = await supabase
    .from("comments")
    .select("id,user_id,body,created_at")
    .eq("collection_id", collection.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (commentsError) {
    throw new Error(commentsError.message);
  }

  const commentsRows = (commentsData ?? []) as CommentRow[];
  const commentProfiles = await loadProfilesByIds(
    Array.from(new Set(commentsRows.map((row) => row.user_id)))
  );

  const comments = commentsRows.map((row) => ({
    id: row.id,
    author: formatAuthor(commentProfiles.get(row.user_id)),
    body: row.body,
    createdAt: row.created_at,
  }));

  const { count: likeCount, error: likesError } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("collection_id", collection.id);

  if (likesError) {
    throw new Error(likesError.message);
  }

  return {
    ...listItem,
    likeCount: likeCount ?? 0,
    products,
    comments,
  };
}

export async function getActiveCategoryOptions(limit = 200) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,slug,title")
    .eq("is_active", true)
    .gte("slug", FIXED_CATEGORY_MIN_SLUG)
    .lte("slug", FIXED_CATEGORY_MAX_SLUG)
    .order("title", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CategoryOption[];
  return rows;
}

export async function getCategoryImageMapBySlugs(slugs: string[]) {
  const imageBySlug = new Map<string, CategoryImageFields>();
  const uniqueSlugs = Array.from(
    new Set(
      slugs
        .map((slug) => slug.trim().toLowerCase())
        .filter((slug) => slug.length > 0)
    )
  );

  if (uniqueSlugs.length === 0) {
    return imageBySlug;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug,cover_image_url,cover_image_source_url")
    .eq("is_active", true)
    .in("slug", uniqueSlugs);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CategoryImageRow[];

  rows.forEach((row) => {
    imageBySlug.set(row.slug.toLowerCase(), {
      coverImageUrl: row.cover_image_url,
      coverImageSourceUrl: row.cover_image_source_url,
    });
  });

  return imageBySlug;
}

export async function getCategoryWithLoadouts(
  identifier: string,
  loadoutLimit = 60
): Promise<CategoryWithLoadouts | null> {
  if (!isUuid(identifier) && !isFixedCategorySlug(identifier)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  let categoryQuery = supabase
    .from("categories")
    .select("id,slug,title,description,cover_image_url")
    .eq("is_active", true)
    .limit(1);

  categoryQuery = isUuid(identifier)
    ? categoryQuery.eq("id", identifier)
    : categoryQuery.eq("slug", identifier);

  const { data: categoryData, error: categoryError } =
    await categoryQuery.maybeSingle();

  if (categoryError) {
    throw new Error(categoryError.message);
  }

  if (!categoryData) {
    return null;
  }

  const category = categoryData as CategoryRow;

  if (!isFixedCategorySlug(category.slug)) {
    return null;
  }

  const { data: loadoutData, error: loadoutError } = await supabase
    .from("collections")
    .select(
      "id,slug,kind,owner_id,title,description,cover_image_url,created_at"
    )
    .eq("is_public", true)
    .eq("kind", "loadout")
    .eq("category_id", category.id)
    .order("created_at", { ascending: false })
    .limit(loadoutLimit);

  if (loadoutError) {
    throw new Error(loadoutError.message);
  }

  const loadoutRows = (loadoutData ?? []) as CollectionRow[];
  const ownerIds = Array.from(new Set(loadoutRows.map((row) => row.owner_id)));
  const profileById = await loadProfilesByIds(ownerIds);
  const loadouts = loadoutRows.map((row) => toListItem(row, profileById));

  return {
    category: toCategoryDetail(category),
    loadouts,
  };
}
