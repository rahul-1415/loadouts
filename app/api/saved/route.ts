import { NextResponse } from "next/server";
import { requireCompleteUser, requireUser } from "../../../lib/auth/api";
import { getSavedCollectionsByUserId } from "../../../lib/data/collections";
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

export async function GET(request: Request) {
  const auth = await requireUser();

  if ("response" in auth) {
    return auth.response;
  }

  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 120)
    : 60;

  const items = await getSavedCollectionsByUserId(auth.user.id, limit);

  return NextResponse.json({
    data: {
      items,
    },
  });
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

  const { data: existingSave, error: existingSaveError } = await supabase
    .from("saved_items")
    .select("user_id")
    .eq("collection_id", collection.id)
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle();

  if (existingSaveError) {
    return writeErrorResponse(existingSaveError.message, existingSaveError.code);
  }

  let saved = false;

  if (existingSave) {
    const { error: unsaveError } = await supabase
      .from("saved_items")
      .delete()
      .eq("collection_id", collection.id)
      .eq("user_id", auth.user.id);

    if (unsaveError) {
      return writeErrorResponse(unsaveError.message, unsaveError.code);
    }
  } else {
    const { error: saveError } = await supabase.from("saved_items").insert({
      user_id: auth.user.id,
      collection_id: collection.id,
    });

    if (saveError) {
      return writeErrorResponse(saveError.message, saveError.code);
    }

    saved = true;
  }

  return NextResponse.json({
    data: {
      saved,
      collectionId: collection.id,
    },
  });
}
