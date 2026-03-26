import { NextResponse } from "next/server";
import { requireCompleteUser } from "../../../lib/auth/api";
import { enforceRateLimit, getRequestIdentity } from "../../../lib/server/rateLimit";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const rateLimitResponse = enforceRateLimit({
    scope: "reports:create",
    identity: getRequestIdentity(request, auth.user.id),
    limit: 10,
    windowMs: 60_000,
    message: "Report limit reached. Try again later.",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const body = await request.json().catch(() => null);
  const entityType = typeof body?.entityType === "string" ? body.entityType : "";
  const entityId = typeof body?.entityId === "string" ? body.entityId.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!["loadout", "profile", "comment"].includes(entityType)) {
    return NextResponse.json({ error: { code: "INVALID_ENTITY", message: "Entity type is invalid." } }, { status: 400 });
  }

  if (!entityId || reason.length < 8) {
    return NextResponse.json({ error: { code: "INVALID_REPORT", message: "A report reason with at least 8 characters is required." } }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("reports").upsert(
    {
      reporter_id: auth.user.id,
      entity_type: entityType,
      entity_id: entityId,
      reason,
      status: "open",
    },
    { onConflict: "reporter_id,entity_type,entity_id" }
  );

  if (error) {
    return NextResponse.json({ error: { code: "REPORT_FAILED", message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } }, { status: 201 });
}
