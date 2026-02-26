import { NextResponse } from "next/server";
import { requireCompleteUser } from "../../../lib/auth/api";
import { createNotification } from "../../../lib/data/notifications";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function createErrorResponse(message: string, code?: string) {
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
        code: "CREATE_FAILED",
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
  const text = typeof body?.body === "string" ? body.body.trim() : "";
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

  if (!text) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "Comment cannot be empty.",
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

  const { data: createdComment, error: createError } = await supabase
    .from("comments")
    .insert({
      collection_id: collection.id,
      user_id: auth.user.id,
      body: text,
    })
    .select("id,collection_id,user_id,body,created_at")
    .single();

  if (createError) {
    return createErrorResponse(createError.message, createError.code);
  }

  const { data: authorProfile } = await supabase
    .from("profiles")
    .select("handle,display_name")
    .eq("id", auth.user.id)
    .limit(1)
    .maybeSingle();

  const author =
    authorProfile?.handle
      ? `@${authorProfile.handle}`
      : authorProfile?.display_name ?? "@unknown";

  try {
    await createNotification({
      recipientId: collection.owner_id,
      actorId: auth.user.id,
      type: "comment",
      entityType: "comment",
      entityId: createdComment.id,
      metadata: {
        collectionId: collection.id,
        preview: text.slice(0, 120),
      },
    });
  } catch {
    // Non-blocking for comment create flow.
  }

  return NextResponse.json(
    {
      data: {
        id: createdComment.id,
        collectionId: createdComment.collection_id,
        userId: createdComment.user_id,
        body: createdComment.body,
        createdAt: createdComment.created_at,
        author,
      },
    },
    { status: 201 }
  );
}
