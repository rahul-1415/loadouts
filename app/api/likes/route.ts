import { NextResponse } from "next/server";
import { requireCompleteUser } from "../../../lib/auth/api";
import { createNotification } from "../../../lib/data/notifications";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function writeErrorResponse(message: string, code?: string) {
  if (code === "42501") {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Not allowed",
        },
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "TOGGLE_FAILED",
        message,
      },
    },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const collectionIdentifier =
    typeof body?.collectionId === "string" ? body.collectionId.trim() : "";
  const collectionSlug =
    typeof body?.collectionSlug === "string" ? body.collectionSlug.trim() : "";
  const identifier = collectionIdentifier || collectionSlug;

  if (!identifier) {
    return NextResponse.json(
      {
        error: {
          code: "COLLECTION_REQUIRED",
          message: "Collection id or slug is required.",
        },
      },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  let collectionQuery = supabase
    .from("collections")
    .select("id,owner_id,is_public")
    .limit(1);

  collectionQuery = isUuid(identifier)
    ? collectionQuery.eq("id", identifier)
    : collectionQuery.eq("slug", identifier);

  const { data: collection, error: collectionError } =
    await collectionQuery.maybeSingle();

  if (collectionError) {
    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message: collectionError.message,
        },
      },
      { status: 500 }
    );
  }

  if (!collection) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Collection not found.",
        },
      },
      { status: 404 }
    );
  }

  if (!collection.is_public && collection.owner_id !== auth.user.id) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Collection not found.",
        },
      },
      { status: 404 }
    );
  }

  const { data: existingLike, error: existingLikeError } = await supabase
    .from("likes")
    .select("user_id")
    .eq("collection_id", collection.id)
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle();

  if (existingLikeError) {
    return writeErrorResponse(existingLikeError.message, existingLikeError.code);
  }

  let liked = false;

  if (existingLike) {
    const { error: unlikeError } = await supabase
      .from("likes")
      .delete()
      .eq("collection_id", collection.id)
      .eq("user_id", auth.user.id);

    if (unlikeError) {
      return writeErrorResponse(unlikeError.message, unlikeError.code);
    }
  } else {
    const { error: likeError } = await supabase.from("likes").insert({
      user_id: auth.user.id,
      collection_id: collection.id,
    });

    if (likeError) {
      return writeErrorResponse(likeError.message, likeError.code);
    }

    liked = true;

    try {
      await createNotification({
        recipientId: collection.owner_id,
        actorId: auth.user.id,
        type: "like",
        entityType: "collection",
        entityId: collection.id,
        metadata: {
          collectionId: collection.id,
        },
      });
    } catch {
      // Non-blocking for like flow.
    }
  }

  const { count, error: countError } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("collection_id", collection.id);

  if (countError) {
    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message: countError.message,
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: {
      liked,
      likeCount: count ?? 0,
      collectionId: collection.id,
    },
  });
}
