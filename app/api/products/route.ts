import { NextResponse } from "next/server";
import { getProductCatalog } from "../../../lib/data/products";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const brand = (url.searchParams.get("brand") ?? "").trim();
  const category = (url.searchParams.get("category") ?? "").trim();
  const requestedLimit = Number(url.searchParams.get("limit"));
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 240)
      : 60;

  try {
    const result = await getProductCatalog({
      query,
      brand,
      category,
      limit,
    });

    return NextResponse.json({
      data: result.items,
      meta: {
        totalCount: result.totalCount,
        brands: result.filters.brands,
        categories: result.filters.categories,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch products";

    return NextResponse.json(
      {
        error: {
          code: "FETCH_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}
