import { NextResponse } from "next/server";
import { requireAdminUser } from "../../../../lib/auth/admin";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdminUser();

  if ("response" in auth) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : "";

  if (!["open", "reviewed", "resolved", "dismissed"].includes(status)) {
    return NextResponse.json({ error: { code: "INVALID_STATUS", message: "Status is invalid." } }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("reports")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.user.id,
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: { code: "UPDATE_FAILED", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } });
}
