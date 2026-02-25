import { NextResponse } from "next/server";
import { requireCompleteUser } from "../../../lib/auth/api";

export async function GET() {
  return NextResponse.json({
    data: [],
    message: "TODO: fetch saved items for user",
  });
}

export async function POST(request: Request) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  const { user } = auth;
  const body = await request.json().catch(() => null);

  return NextResponse.json(
    {
      message: "TODO: save collection or product",
      userId: user.id,
      body,
    },
    { status: 201 }
  );
}
