import { NextResponse } from "next/server";
import { requireCompleteUser } from "../../../lib/auth/api";
import { createSupabaseAdminClient } from "../../../lib/supabase/admin";
import { buildUploadPath, uploadBucket, validateUploadFile, validateUploadKind } from "../../../lib/uploads";
import { enforceRateLimit, getRequestIdentity } from "../../../lib/server/rateLimit";

export async function POST(request: Request) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const rateLimitResponse = enforceRateLimit({
    scope: "uploads:create",
    identity: getRequestIdentity(request, auth.user.id),
    limit: 20,
    windowMs: 60_000,
    message: "Upload limit reached. Try again in a minute.",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return NextResponse.json(
      {
        error: {
          code: "UPLOADS_NOT_CONFIGURED",
          message: "Uploads are not configured on this deployment.",
        },
      },
      { status: 500 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const kind = formData?.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        error: {
          code: "FILE_REQUIRED",
          message: "Choose an image to upload.",
        },
      },
      { status: 400 }
    );
  }

  if (!validateUploadKind(kind)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_KIND",
          message: "Upload kind is invalid.",
        },
      },
      { status: 400 }
    );
  }

  const validation = validateUploadFile(file);
  if (!validation.ok) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_FILE",
          message: validation.message,
        },
      },
      { status: 400 }
    );
  }

  const filePath = buildUploadPath({
    userId: auth.user.id,
    kind,
    fileName: file.name,
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await adminClient.storage
    .from(uploadBucket)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    return NextResponse.json(
      {
        error: {
          code: "UPLOAD_FAILED",
          message: error.message,
        },
      },
      { status: 500 }
    );
  }

  const { data } = adminClient.storage.from(uploadBucket).getPublicUrl(filePath);

  return NextResponse.json({
    data: {
      path: filePath,
      publicUrl: data.publicUrl,
    },
  });
}
