import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [],
    message: "TODO: fetch saved items for user",
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  return NextResponse.json(
    {
      message: "TODO: save collection or product",
      body,
    },
    { status: 201 }
  );
}
