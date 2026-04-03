import { NextResponse } from "next/server";
import { assertOwner, requireCompleteUser } from "../../../../../lib/auth/api";
import { getLoadoutAttachmentReferences } from "../../../../../lib/loadoutAttachments";
import {
  normalizeLoadoutLayoutMode,
  validateLoadoutLayout,
} from "../../../../../lib/loadoutLayout";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

interface RouteContext {
  params: {
    id: string;
  };
}

interface CollectionRow {
  id: string;
  slug: string;
  owner_id: string;
  kind: "category" | "loadout";
  layout_mode: "standard" | "custom" | null;
  body_layout: unknown | null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const supabase = await createSupabaseServerClient();
  let collectionQuery = supabase
    .from("collections")
    .select("id,slug,owner_id,kind,layout_mode,body_layout")
    .limit(1);

  collectionQuery = isUuid(params.id)
    ? collectionQuery.eq("id", params.id)
    : collectionQuery.eq("slug", params.id);

  const { data: existingCollection, error: collectionError } =
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

  if (!existingCollection) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Loadout not found.",
        },
      },
      { status: 404 }
    );
  }

  const ownershipError = assertOwner(existingCollection.owner_id, auth.user.id);

  if (ownershipError) {
    return ownershipError;
  }

  if (existingCollection.kind !== "loadout") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_LOADOUT",
          message: "Only loadouts can use custom boards.",
        },
      },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const layoutMode = normalizeLoadoutLayoutMode(
    body?.layoutMode,
    normalizeLoadoutLayoutMode(existingCollection.layout_mode, "standard")
  );
  const hasBodyLayout = Boolean(
    body && Object.prototype.hasOwnProperty.call(body, "bodyLayout")
  );

  let nextBodyLayout = existingCollection.body_layout ?? null;

  if (hasBodyLayout || layoutMode === "custom") {
    let attachments;

    try {
      attachments = await getLoadoutAttachmentReferences(
        supabase,
        existingCollection.id
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to validate attached products.";

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

    const validation = validateLoadoutLayout(
      hasBodyLayout ? body?.bodyLayout : existingCollection.body_layout,
      {
        allowEmpty: true,
        allowedAttachmentKeys: attachments.map((attachment) => attachment.attachmentKey),
      }
    );

    if (!validation.ok || !validation.layout) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_LAYOUT",
            message: validation.errors[0] ?? "Custom board is invalid.",
            details: validation.errors,
          },
        },
        { status: 400 }
      );
    }

    nextBodyLayout = validation.layout;
  }

  const { data: updatedCollection, error: updateError } = await supabase
    .from("collections")
    .update({
      layout_mode: layoutMode,
      body_layout: nextBodyLayout,
      body_layout_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingCollection.id)
    .eq("owner_id", auth.user.id)
    .select("id,slug,layout_mode,body_layout,body_layout_updated_at")
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
      id: updatedCollection.id,
      slug: updatedCollection.slug,
      layoutMode: normalizeLoadoutLayoutMode(updatedCollection.layout_mode, "standard"),
      bodyLayout: updatedCollection.body_layout,
      bodyLayoutUpdatedAt: updatedCollection.body_layout_updated_at,
    },
  });
}
