import { NextResponse } from "next/server";
import { requireCompleteUser } from "../../../lib/auth/api";
import {
  getPublicCollections,
  type CollectionKind,
} from "../../../lib/data/collections";
import {
  FIXED_CATEGORY_MAX_SLUG,
  FIXED_CATEGORY_MIN_SLUG,
  isFixedCategorySlug,
} from "../../../lib/data/fixedCategories";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function parseKind(kind: string | null): CollectionKind | undefined {
  if (kind === "category" || kind === "loadout") {
    return kind;
  }

  return undefined;
}

function normalizeKind(value: unknown): CollectionKind {
  if (value === "category" || value === "loadout") {
    return value;
  }

  return "loadout";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit"));
  const safeLimit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 24;
  const kind = parseKind(url.searchParams.get("kind"));

  try {
    const data = await getPublicCollections({ limit: safeLimit, kind });

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch collections";

    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const { user } = auth;
  const body = await request.json().catch(() => null);

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const kind = normalizeKind(body?.kind);
  const requestedCategoryId =
    typeof body?.categoryId === "string" ? body.categoryId.trim() : "";
  const requestedCategorySlug =
    typeof body?.categorySlug === "string" ? body.categorySlug.trim() : "";
  const isPublic = body?.isPublic !== false;

  if (kind !== "loadout") {
    return NextResponse.json(
      {
        error: {
          code: "CATEGORY_CREATION_DISABLED",
          message:
            "Categories are fixed. Create a loadout and assign one of the 100 categories.",
        },
      },
      { status: 400 }
    );
  }

  if (!title) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_TITLE",
          message: "Title is required.",
        },
      },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  let categoryId: string | null = requestedCategoryId || null;

  if (!categoryId && requestedCategorySlug) {
    if (!isFixedCategorySlug(requestedCategorySlug)) {
      return NextResponse.json(
        {
          error: {
            code: "CATEGORY_NOT_ALLOWED",
            message: "Only the fixed 100 categories are allowed.",
          },
        },
        { status: 400 }
      );
    }

    const { data: categoryBySlug, error: categoryBySlugError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", requestedCategorySlug)
      .eq("is_active", true)
      .gte("slug", FIXED_CATEGORY_MIN_SLUG)
      .lte("slug", FIXED_CATEGORY_MAX_SLUG)
      .limit(1)
      .maybeSingle();

    if (categoryBySlugError) {
      return NextResponse.json(
        {
          error: {
            code: "CATEGORY_LOOKUP_FAILED",
            message: categoryBySlugError.message,
          },
        },
        { status: 500 }
      );
    }

    categoryId = categoryBySlug?.id ?? null;
  }

  if (kind === "loadout" && !categoryId) {
    return NextResponse.json(
      {
        error: {
          code: "CATEGORY_REQUIRED",
          message: "Choose a category for this loadout.",
        },
      },
      { status: 400 }
    );
  }

  if (categoryId) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id,slug")
      .eq("id", categoryId)
      .eq("is_active", true)
      .gte("slug", FIXED_CATEGORY_MIN_SLUG)
      .lte("slug", FIXED_CATEGORY_MAX_SLUG)
      .limit(1)
      .maybeSingle();

    if (categoryError) {
      return NextResponse.json(
        {
          error: {
            code: "CATEGORY_LOOKUP_FAILED",
            message: categoryError.message,
          },
        },
        { status: 500 }
      );
    }

    if (!category || !isFixedCategorySlug(category.slug)) {
      return NextResponse.json(
        {
          error: {
            code: "CATEGORY_NOT_FOUND",
            message: "Choose one of the fixed 100 categories.",
          },
        },
        { status: 400 }
      );
    }
  }

  const slugBase = slugify(title) || kind;
  const slug = `${slugBase}-${Date.now().toString(36).slice(-6)}`;
  const { data, error } = await supabase
    .from("collections")
    .insert({
      owner_id: user.id,
      category_id: categoryId,
      kind,
      slug,
      title,
      description: description || null,
      is_public: isPublic,
    })
    .select("id,slug,kind,title,description,category_id,is_public,owner_id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: {
          code: "CREATE_FAILED",
          message: error.message,
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
