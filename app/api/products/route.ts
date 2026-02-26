import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

interface ProductRow {
  id: string;
  slug: string | null;
  name: string;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const requestedLimit = Number(url.searchParams.get("limit"));
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 40;

  try {
    const supabase = await createSupabaseServerClient();
    let productsQuery = supabase
      .from("products")
      .select("id,slug,name,brand,description,image_url,product_url")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query) {
      const textFilter = `%${query.replace(/%/g, "")}%`;
      productsQuery = productsQuery.or(
        `name.ilike.${textFilter},brand.ilike.${textFilter},description.ilike.${textFilter}`
      );
    }

    const { data, error } = await productsQuery;

    if (error) {
      return NextResponse.json(
        {
          error: {
            code: "FETCH_FAILED",
            message: error.message,
          },
        },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as ProductRow[];
    const results = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: row.brand,
      description: row.description ?? "",
      imageUrl: row.image_url,
      productUrl: row.product_url,
    }));

    return NextResponse.json({ data: results });
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
