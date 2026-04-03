import { NextResponse } from "next/server";
import { assertOwner, requireCompleteUser } from "../../../../lib/auth/api";
import { getPublicCollectionByIdentifier } from "../../../../lib/data/collections";
import {
  FIXED_CATEGORY_MAX_SLUG,
  FIXED_CATEGORY_MIN_SLUG,
  isFixedCategorySlug,
} from "../../../../lib/data/fixedCategories";
import {
  buildPublishValidation,
  normalizeRequestedStatus,
  slugifyLoadoutTitle,
} from "../../../../lib/loadoutPublishing";
import { getLoadoutAttachmentReferences } from "../../../../lib/loadoutAttachments";
import { normalizeLoadoutLayoutMode } from "../../../../lib/loadoutLayout";
import {
  enforceRateLimit,
  getRequestIdentity,
} from "../../../../lib/server/rateLimit";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

interface RouteContext {
  params: {
    id: string;
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const data = await getPublicCollectionByIdentifier(params.id);

    if (!data) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Collection not found",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch collection";

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

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const { user, profile } = auth;
  const body = await request.json().catch(() => null);

  const supabase = await createSupabaseServerClient();
  let collectionQuery = supabase
    .from("collections")
    .select(
      "id,slug,owner_id,kind,category_id,is_public,cover_image_url,status,published_at,archived_at,layout_mode,body_layout"
    )
    .limit(1);

  collectionQuery = isUuid(params.id)
    ? collectionQuery.eq("id", params.id)
    : collectionQuery.eq("slug", params.id);

  const { data: existingCollection, error: existingCollectionError } =
    await collectionQuery.maybeSingle();

  if (existingCollectionError) {
    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message: existingCollectionError.message,
        },
      },
      { status: 500 }
    );
  }

  if (!existingCollection) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Collection not found",
        },
      },
      { status: 404 }
    );
  }

  const ownershipError = assertOwner(existingCollection.owner_id, user.id);

  if (ownershipError) {
    return ownershipError;
  }

  if (existingCollection.kind !== "loadout") {
    return NextResponse.json(
      {
        error: {
          code: "CATEGORY_EDIT_DISABLED",
          message: "Only loadouts can be updated here.",
        },
      },
      { status: 400 }
    );
  }

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const requestedCategoryId =
    typeof body?.categoryId === "string" ? body.categoryId.trim() : "";
  const requestedCategorySlug =
    typeof body?.categorySlug === "string" ? body.categorySlug.trim() : "";
  const requestedIsPublic =
    typeof body?.isPublic === "boolean" ? body.isPublic : null;
  const coverImageUrl =
    typeof body?.coverImageUrl === "string" ? body.coverImageUrl.trim() : null;
  const requestedStatus = normalizeRequestedStatus(
    body?.status,
    requestedIsPublic === null
      ? existingCollection.is_public
        ? "published"
        : "draft"
      : requestedIsPublic
        ? "published"
        : "draft"
  );
  const requestedLayoutMode = normalizeLoadoutLayoutMode(
    body?.layoutMode,
    normalizeLoadoutLayoutMode(existingCollection.layout_mode, "standard")
  );

  const rateLimitResponse = enforceRateLimit({
    scope: "collections:update",
    identity: getRequestIdentity(request, user.id),
    limit: 30,
    windowMs: 60_000,
    message: "Loadout update limit reached. Try again shortly.",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
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

  const nextSlug = slugifyLoadoutTitle(title) || existingCollection.kind;
  const { data: conflictingLoadout, error: conflictingLoadoutError } =
    await supabase
      .from("collections")
      .select("id")
      .eq("owner_id", user.id)
      .eq("kind", "loadout")
      .eq("slug", nextSlug)
      .neq("id", existingCollection.id)
      .limit(1)
      .maybeSingle();

  if (conflictingLoadoutError) {
    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message: conflictingLoadoutError.message,
        },
      },
      { status: 500 }
    );
  }

  if (conflictingLoadout) {
    return NextResponse.json(
      {
        error: {
          code: "LOADOUT_TITLE_EXISTS",
          message:
            "You already have a loadout with this title. Choose a different title.",
        },
      },
      { status: 409 }
    );
  }

  let categoryId = requestedCategoryId || existingCollection.category_id;

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

  if (!categoryId) {
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

  const nextCoverImageUrl =
    coverImageUrl === null ? existingCollection.cover_image_url : coverImageUrl;

  const isPublishingNow =
    requestedStatus === "published" && existingCollection.status !== "published";

  if (isPublishingNow) {
    let attachments;

    try {
      attachments = await getLoadoutAttachmentReferences(
        supabase,
        existingCollection.id
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to validate loadout products.";

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

    const validation = buildPublishValidation({
      title,
      categoryId: category.id,
      productCount: attachments.length,
      layoutMode: requestedLayoutMode,
      bodyLayout: existingCollection.body_layout ?? null,
      allowedAttachmentKeys: attachments.map((attachment) => attachment.attachmentKey),
    });

    if (!validation.canPublish) {
      return NextResponse.json(
        {
          error: {
            code: "PUBLISH_REQUIREMENTS_NOT_MET",
            message: `Complete the publish checklist: ${validation.missing.join(
              ", "
            )}.`,
          },
        },
        { status: 400 }
      );
    }
  }

  const now = new Date().toISOString();
  let nextPublishedAt = existingCollection.published_at;
  let nextArchivedAt = existingCollection.archived_at;

  if (requestedStatus === "published") {
    nextPublishedAt = existingCollection.published_at ?? now;
    nextArchivedAt = null;
  } else if (requestedStatus === "archived") {
    nextArchivedAt = now;
  } else {
    nextArchivedAt = null;
  }

  const { data: updatedCollection, error: updateError } = await supabase
    .from("collections")
    .update({
      slug: nextSlug,
      title,
      description: description || null,
      category_id: category.id,
      cover_image_url: nextCoverImageUrl || null,
      is_public: requestedStatus === "published",
      status: requestedStatus,
      layout_mode: requestedLayoutMode,
      published_at: nextPublishedAt,
      archived_at: nextArchivedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingCollection.id)
    .eq("owner_id", user.id)
    .select(
      "id,slug,kind,title,description,category_id,is_public,owner_id,status,cover_image_url,published_at,archived_at,layout_mode"
    )
    .single();

  if (updateError) {
    return NextResponse.json(
      {
        error: {
          code: "UPDATE_FAILED",
          message: updateError.message,
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: {
      ...updatedCollection,
      path: `/${profile.handle}/${updatedCollection.slug}`,
    },
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const { user } = auth;
  const supabase = await createSupabaseServerClient();
  let collectionQuery = supabase
    .from("collections")
    .select("id,slug,owner_id,kind,category_id,is_public")
    .limit(1);

  collectionQuery = isUuid(params.id)
    ? collectionQuery.eq("id", params.id)
    : collectionQuery.eq("slug", params.id);

  const { data: existingCollection, error: existingCollectionError } =
    await collectionQuery.maybeSingle();

  if (existingCollectionError) {
    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message: existingCollectionError.message,
        },
      },
      { status: 500 }
    );
  }

  if (!existingCollection) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Collection not found",
        },
      },
      { status: 404 }
    );
  }

  const ownershipError = assertOwner(existingCollection.owner_id, user.id);

  if (ownershipError) {
    return ownershipError;
  }

  const dependencyDeletes = await Promise.all([
    supabase.from("collection_products").delete().eq("collection_id", existingCollection.id),
    supabase.from("comments").delete().eq("collection_id", existingCollection.id),
    supabase.from("likes").delete().eq("collection_id", existingCollection.id),
    supabase.from("saved_items").delete().eq("collection_id", existingCollection.id),
  ]);

  const dependencyError = dependencyDeletes.find((result) => result.error)?.error;

  if (dependencyError) {
    return NextResponse.json(
      {
        error: {
          code: "DELETE_FAILED",
          message: dependencyError.message,
        },
      },
      { status: 500 }
    );
  }

  const { data: deletedCollection, error: deleteError } = await supabase
    .from("collections")
    .delete()
    .eq("id", existingCollection.id)
    .eq("owner_id", user.id)
    .select("id,slug")
    .single();

  if (deleteError) {
    return NextResponse.json(
      {
        error: {
          code: "DELETE_FAILED",
          message: deleteError.message,
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: deletedCollection });
}
