import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  return NextResponse.json({
    message: "TODO: toggle like on collection",
    body,
  });
}
