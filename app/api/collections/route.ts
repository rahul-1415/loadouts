import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [],
    message: "TODO: fetch collections from DB",
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  return NextResponse.json(
    {
      message: "TODO: create collection",
      body,
    },
    { status: 201 }
  );
}
