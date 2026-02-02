import { NextResponse } from "next/server";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  return NextResponse.json({
    id: params.id,
    message: "TODO: fetch user profile and collections",
  });
}
