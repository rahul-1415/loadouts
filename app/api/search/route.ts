import { NextResponse } from "next/server";
import { normalizeSearchTypes, searchSiteContent } from "../../../lib/data/search";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const types = normalizeSearchTypes(url.searchParams.get("types"));
  const category = url.searchParams.get("category");
  const requestedLimit = Number(url.searchParams.get("limit"));
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 24)
      : 12;

  try {
    const data = await searchSiteContent({
      query,
      types,
      categorySlug: category,
      limitPerType: limit,
    });

    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search request failed";

    return NextResponse.json(
      {
        error: {
          code: "SEARCH_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}
