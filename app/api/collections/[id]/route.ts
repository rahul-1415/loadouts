import { NextResponse } from "next/server";
import { assertOwner, requireUser } from "../../../../lib/auth/api";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  return NextResponse.json({
    id: params.id,
    message: "TODO: fetch collection by id",
  });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireUser();

  if ("response" in auth) {
    return auth.response;
  }

  const { user } = auth;
  const body = await request.json().catch(() => null);
  const ownershipError = assertOwner(body?.ownerId ?? null, user.id);

  if (ownershipError) {
    return ownershipError;
  }

  return NextResponse.json({
    id: params.id,
    message: "TODO: update collection",
    userId: user.id,
    body,
  });
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await requireUser();

  if ("response" in auth) {
    return auth.response;
  }

  const { user } = auth;
  const ownershipError = assertOwner(
    request.headers.get("x-owner-id"),
    user.id
  );

  if (ownershipError) {
    return ownershipError;
  }

  return NextResponse.json({
    id: params.id,
    message: "TODO: delete collection",
    userId: user.id,
  });
}
