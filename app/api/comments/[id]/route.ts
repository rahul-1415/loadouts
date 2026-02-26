import { NextResponse } from "next/server";
import { assertOwner, requireCompleteUser } from "../../../../lib/auth/api";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";

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
  const { data: existingComment, error: existingCommentError } = await supabase
    .from("comments")
    .select("id,user_id")
    .eq("id", params.id)
    .limit(1)
    .maybeSingle();

  if (existingCommentError) {
    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message: existingCommentError.message,
        },
      },
      { status: 500 }
    );
  }

  if (!existingComment) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Comment not found.",
        },
      },
      { status: 404 }
    );
  }

  const ownershipError = assertOwner(existingComment.user_id, auth.user.id);
  if (ownershipError) {
    return ownershipError;
  }

  const { data: updatedComment, error: updateError } = await supabase
    .from("comments")
    .update({
      body: text,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingComment.id)
    .eq("user_id", auth.user.id)
    .select("id,user_id,body,created_at")
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
      id: updatedComment.id,
      userId: updatedComment.user_id,
      body: updatedComment.body,
      createdAt: updatedComment.created_at,
    },
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingComment, error: existingCommentError } = await supabase
    .from("comments")
    .select("id,user_id")
    .eq("id", params.id)
    .limit(1)
    .maybeSingle();

  if (existingCommentError) {
    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message: existingCommentError.message,
        },
      },
      { status: 500 }
    );
  }

  if (!existingComment) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Comment not found.",
        },
      },
      { status: 404 }
    );
  }

  const ownershipError = assertOwner(existingComment.user_id, auth.user.id);
  if (ownershipError) {
    return ownershipError;
  }

  const { error: deleteError } = await supabase
    .from("comments")
    .delete()
    .eq("id", existingComment.id)
    .eq("user_id", auth.user.id);

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

  return NextResponse.json({ data: { id: existingComment.id } });
}
