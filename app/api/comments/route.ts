import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth/api";

export async function POST(request: Request) {
  const auth = await requireUser();

  if ("response" in auth) {
    return auth.response;
  }

  const { user } = auth;
  const body = await request.json().catch(() => null);

  return NextResponse.json(
    {
      message: "TODO: create comment",
      userId: user.id,
      body,
    },
    { status: 201 }
  );
}
