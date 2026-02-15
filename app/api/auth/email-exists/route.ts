import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAX_USER_SCAN_PAGES = 50;
const USERS_PER_PAGE = 200;

function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_EMAIL",
          message: "Email is required.",
        },
      },
      { status: 400 }
    );
  }

  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_NOT_CONFIGURED",
          message: "Service role key is missing.",
        },
      },
      { status: 500 }
    );
  }

  let page = 1;

  while (page <= MAX_USER_SCAN_PAGES) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });

    if (error) {
      return NextResponse.json(
        {
          error: {
            code: "CHECK_FAILED",
            message: error.message,
          },
        },
        { status: 500 }
      );
    }

    const users = data.users ?? [];
    const foundUser = users.find((user) => user.email?.toLowerCase() === email);

    if (foundUser) {
      const emailConfirmed =
        Boolean(foundUser.email_confirmed_at) || Boolean(foundUser.confirmed_at);

      return NextResponse.json({
        exists: true,
        emailConfirmed,
      });
    }

    if (users.length < USERS_PER_PAGE) {
      break;
    }

    page += 1;
  }

  return NextResponse.json({
    exists: false,
    emailConfirmed: false,
  });
}
