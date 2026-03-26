import { createSupabaseServerClient } from "../supabase/server";
import {
  FIXED_CATEGORY_MAX_SLUG,
  FIXED_CATEGORY_MIN_SLUG,
  isFixedCategorySlug,
} from "./fixedCategories";

export type CollectionKind = "category" | "loadout";
export type LoadoutStatus = "draft" | "published" | "archived";

interface CollectionRow {
  id: string;
  slug: string;
  kind: CollectionKind;
  owner_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_public?: boolean | null;
  status: LoadoutStatus | null;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
}

interface OwnedCollectionRow extends CollectionRow {
  is_public: boolean;
  category_id: string | null;
}

interface CategoryRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

interface HomepageCategoryRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

interface CategoryCardRow {
  slug: string;
  description: string | null;
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

interface SavedCollectionRow {
  id: string;
  slug: string;
  kind: CollectionKind;
  owner_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  status: LoadoutStatus | null;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  is_public: boolean;
}

interface SavedItemJoinRow {
  created_at: string;
  collections: SavedCollectionRow | SavedCollectionRow[] | null;
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
  ownerId: string;
  title: string;
  description: string;
  author: string;
  coverImageUrl: string | null;
  coverImageSourceUrl: string | null;
  status: LoadoutStatus;
  publishedAt: string | null;
  archivedAt: string | null;
}

export interface OwnedLoadoutListItem extends CollectionListItem {
  isPublic: boolean;
  categoryId: string | null;
  createdAt: string;
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
  userId: string;
  author: string;
  body: string;
  createdAt: string;
}

export interface CollectionDetail extends CollectionListItem {
  isPublic: boolean;
  categoryId: string | null;
  viewerHasLiked: boolean;
  viewerHasSaved: boolean;
  likeCount: number;
  products: CollectionProductItem[];
  comments: CollectionCommentItem[];
  publishChecklist: PublishChecklist | null;
}

export interface SavedCollectionListItem extends CollectionListItem {
  isPublic: boolean;
  savedAt: string;
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

export interface CategoryCardFields {
  description: string | null;
  coverImageUrl: string | null;
  coverImageSourceUrl: string | null;
}

export interface PublishChecklist {
  items: Array<{
    key: "title" | "description" | "category" | "cover" | "products";
    label: string;
    complete: boolean;
  }>;
  canPublish: boolean;
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

function normalizeLoadoutStatus(
  status: string | null | undefined,
  isPublic?: boolean
): LoadoutStatus {
  if (status === "draft" || status === "published" || status === "archived") {
    return status;
  }

  return isPublic ? "published" : "draft";
}

function buildPublishChecklist({
  title,
  description,
  categoryId,
  coverImageUrl,
  productCount,
}: {
  title: string;
  description: string | null;
  categoryId?: string | null;
  coverImageUrl?: string | null;
  productCount: number;
}): PublishChecklist {
  const items: PublishChecklist["items"] = [
    {
      key: "title",
      label: "Add a title",
      complete: title.trim().length > 0,
    },
    {
      key: "description",
      label: "Write a description",
      complete: Boolean(description?.trim()),
    },
    {
      key: "category",
      label: "Choose a category",
      complete: Boolean(categoryId),
    },
    {
      key: "cover",
      label: "Upload a cover image",
      complete: Boolean(coverImageUrl),
    },
    {
      key: "products",
      label: "Add at least one product",
      complete: productCount > 0,
    },
  ];

  return {
    items,
    canPublish: items.every((item) => item.complete),
  };
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
    ownerId: row.owner_id,
    title: row.title,
    description: row.description ?? "",
    author: formatAuthor(profile),
    coverImageUrl: row.cover_image_url,
    coverImageSourceUrl: null,
    status: normalizeLoadoutStatus(row.status, row.is_public ?? undefined),
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
  };
}

function toOwnedLoadoutListItem(
  row: OwnedCollectionRow,
  profileById: Map<string, ProfileRow>
): OwnedLoadoutListItem {
  const base = toListItem(row, profileById);

  return {
    ...base,
    isPublic: row.is_public,
    categoryId: row.category_id,
    createdAt: row.created_at,
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

function normalizeSavedCollection(
  collection: SavedCollectionRow | SavedCollectionRow[] | null
) {
  if (!collection) {
    return null;
  }

  return Array.isArray(collection) ? collection[0] ?? null : collection;
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
      "id,slug,kind,owner_id,title,description,cover_image_url,is_public,status,published_at,archived_at,created_at"
    )
    .eq("is_public", true)
    .or("status.eq.published,status.is.null")
    .order("published_at", { ascending: false, nullsFirst: false })
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
  kind?: CollectionKind,
  viewerUserId?: string | null
): Promise<CollectionDetail | null> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("collections")
    .select(
      "id,slug,kind,owner_id,title,description,cover_image_url,is_public,status,published_at,archived_at,created_at,category_id"
    )
    .limit(1);

  if (kind) {
    query = query.eq("kind", kind);
  }

  if (viewerUserId) {
    query = query.or(`is_public.eq.true,owner_id.eq.${viewerUserId}`);
  } else {
    query = query.eq("is_public", true);
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

  const collection = collectionData as CollectionRow & {
    is_public: boolean;
    category_id: string | null;
  };
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
    userId: row.user_id,
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

  let viewerHasLiked = false;
  let viewerHasSaved = false;

  if (viewerUserId) {
    const { data: viewerLikeRow, error: viewerLikeError } = await supabase
      .from("likes")
      .select("user_id")
      .eq("collection_id", collection.id)
      .eq("user_id", viewerUserId)
      .limit(1)
      .maybeSingle();

    if (viewerLikeError) {
      throw new Error(viewerLikeError.message);
    }

    viewerHasLiked = Boolean(viewerLikeRow);

    const { data: viewerSavedRow, error: viewerSavedError } = await supabase
      .from("saved_items")
      .select("user_id")
      .eq("collection_id", collection.id)
      .eq("user_id", viewerUserId)
      .limit(1)
      .maybeSingle();

    if (viewerSavedError) {
      throw new Error(viewerSavedError.message);
    }

    viewerHasSaved = Boolean(viewerSavedRow);
  }

  return {
    ...listItem,
    isPublic: collectionData.is_public,
    categoryId: collection.category_id,
    viewerHasLiked,
    viewerHasSaved,
    likeCount: likeCount ?? 0,
    products,
    comments,
    publishChecklist:
      collection.kind === "loadout"
        ? buildPublishChecklist({
            title: collection.title,
            description: collection.description,
            categoryId: collection.category_id,
            coverImageUrl: collection.cover_image_url,
            productCount: products.length,
          })
        : null,
  };
}

export async function getOwnedLoadoutsByUserId(userId: string, limit = 100) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("collections")
    .select(
      "id,slug,kind,owner_id,title,description,cover_image_url,status,published_at,archived_at,created_at,is_public,category_id"
    )
    .eq("owner_id", userId)
    .eq("kind", "loadout")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as OwnedCollectionRow[];
  const profileById = await loadProfilesByIds([userId]);

  return rows.map((row) => toOwnedLoadoutListItem(row, profileById));
}

export async function getOwnedLoadoutByIdentifier(
  ownerId: string,
  identifier: string
): Promise<OwnedCollectionRow | null> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("collections")
    .select(
      "id,slug,kind,owner_id,title,description,cover_image_url,status,published_at,archived_at,created_at,is_public,category_id"
    )
    .eq("owner_id", ownerId)
    .eq("kind", "loadout")
    .limit(1);

  query = isUuid(identifier)
    ? query.eq("id", identifier)
    : query.eq("slug", identifier);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as OwnedCollectionRow | null;
}

export async function getSavedCollectionsByUserId(userId: string, limit = 120) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_items")
    .select(
      "created_at,collections:collection_id(id,slug,kind,owner_id,title,description,cover_image_url,status,published_at,archived_at,created_at,is_public)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SavedItemJoinRow[];
  const collections = rows
    .map((row) => normalizeSavedCollection(row.collections))
    .filter((row): row is SavedCollectionRow => row !== null);
  const ownerIds = Array.from(new Set(collections.map((row) => row.owner_id)));
  const profileById = await loadProfilesByIds(ownerIds);

  return rows
    .map((row) => {
      const collection = normalizeSavedCollection(row.collections);

      if (!collection) {
        return null;
      }

      return {
        ...toListItem(collection, profileById),
        isPublic: collection.is_public,
        savedAt: row.created_at,
      } satisfies SavedCollectionListItem;
    })
    .filter((row): row is SavedCollectionListItem => row !== null);
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

export async function getActiveCategoriesBySlugs(slugs: string[]) {
  const normalizedSlugs = Array.from(
    new Set(
      slugs
        .map((slug) => slug.trim().toLowerCase())
        .filter((slug) => isFixedCategorySlug(slug))
    )
  );

  if (normalizedSlugs.length === 0) {
    return [] as Array<{
      id: string;
      slug: string;
      title: string;
      description: string;
      coverImageUrl: string | null;
    }>;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,slug,title,description,cover_image_url")
    .eq("is_active", true)
    .in("slug", normalizedSlugs);

  if (error) {
    throw new Error(error.message);
  }

  const rowBySlug = new Map<string, HomepageCategoryRow>(
    ((data ?? []) as HomepageCategoryRow[]).map((row) => [
      row.slug.toLowerCase(),
      row,
    ])
  );

  return normalizedSlugs
    .map((slug) => rowBySlug.get(slug))
    .filter((row): row is HomepageCategoryRow => row !== undefined)
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description ?? "",
      coverImageUrl: row.cover_image_url,
    }));
}

export async function getCategoryCardFieldsBySlugs(slugs: string[]) {
  const fieldsBySlug = new Map<string, CategoryCardFields>();
  const uniqueSlugs = Array.from(
    new Set(
      slugs
        .map((slug) => slug.trim().toLowerCase())
        .filter((slug) => slug.length > 0)
    )
  );

  if (uniqueSlugs.length === 0) {
    return fieldsBySlug;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug,description,cover_image_url,cover_image_source_url")
    .eq("is_active", true)
    .in("slug", uniqueSlugs);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CategoryCardRow[];

  rows.forEach((row) => {
    fieldsBySlug.set(row.slug.toLowerCase(), {
      description: row.description ?? "",
      coverImageUrl: row.cover_image_url,
      coverImageSourceUrl: row.cover_image_source_url,
    });
  });

  return fieldsBySlug;
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
      "id,slug,kind,owner_id,title,description,cover_image_url,is_public,status,published_at,archived_at,created_at"
    )
    .eq("is_public", true)
    .or("status.eq.published,status.is.null")
    .eq("kind", "loadout")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false, nullsFirst: false })
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

export async function getRecommendedLoadoutsForCollection({
  collectionId,
  categoryId,
  ownerId,
  viewerUserId,
  limit = 3,
}: {
  collectionId: string;
  categoryId: string | null;
  ownerId: string;
  viewerUserId?: string | null;
  limit?: number;
}) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("collections")
    .select(
      "id,slug,kind,owner_id,title,description,cover_image_url,is_public,status,published_at,archived_at,created_at"
    )
    .eq("is_public", true)
    .or("status.eq.published,status.is.null")
    .eq("kind", "loadout")
    .neq("id", collectionId)
    .limit(limit);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  } else {
    query = query.neq("owner_id", ownerId);
  }

  if (viewerUserId) {
    query = query.or(`is_public.eq.true,owner_id.eq.${viewerUserId}`);
  }

  const { data, error } = await query
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CollectionRow[];
  const ownerIds = Array.from(new Set(rows.map((row) => row.owner_id)));
  const profileById = await loadProfilesByIds(ownerIds);

  return rows.map((row) => toListItem(row, profileById));
}
