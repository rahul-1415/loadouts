import { NextResponse } from "next/server";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: RouteContext) {
  const body = await request.json().catch(() => null);

  return NextResponse.json({
    id: params.id,
    message: "TODO: update comment",
    body,
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return NextResponse.json({
    id: params.id,
    message: "TODO: delete comment",
  });
}
