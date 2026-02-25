import { NextResponse } from "next/server";
import { requireCompleteUser } from "../../../lib/auth/api";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

function sanitizeInterests(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0)
    .slice(0, 10);

  return Array.from(new Set(normalized));
}

export async function GET() {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  return NextResponse.json({ data: auth.profile });
}

export async function PUT(request: Request) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const displayName =
    typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const bio = typeof body?.bio === "string" ? body.bio.trim() : "";
  const avatarUrl =
    typeof body?.avatarUrl === "string" ? body.avatarUrl.trim() : "";
  const interests = sanitizeInterests(body?.interests);

  if (!displayName) {
    return NextResponse.json(
      {
        error: {
          code: "DISPLAY_NAME_REQUIRED",
          message: "Display name is required.",
        },
      },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio: bio || null,
      avatar_url: avatarUrl || null,
      interests,
    })
    .eq("id", auth.user.id)
    .select("id,handle,display_name,avatar_url,bio,interests")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: {
          code: "UPDATE_FAILED",
          message: error.message,
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
