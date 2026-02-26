import { NextResponse } from "next/server";
import { assertOwner, requireCompleteUser } from "../../../../../lib/auth/api";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

interface RouteContext {
  params: {
    id: string;
  };
}

interface CollectionRow {
  id: string;
  slug: string;
  owner_id: string;
  kind: "category" | "loadout";
  is_public: boolean;
}

interface ProductJoinRow {
  sort_order: number | null;
  note: string | null;
  product_id: string;
  products:
    | {
        id: string;
        slug: string | null;
        name: string;
        brand: string | null;
        description: string | null;
        image_url: string | null;
        product_url: string | null;
        source_url: string | null;
      }
    | {
        id: string;
        slug: string | null;
        name: string;
        brand: string | null;
        description: string | null;
        image_url: string | null;
        product_url: string | null;
        source_url: string | null;
      }[]
    | null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function getCollectionByIdentifier(identifier: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("collections")
    .select("id,slug,owner_id,kind,is_public")
    .limit(1);

  query = isUuid(identifier)
    ? query.eq("id", identifier)
    : query.eq("slug", identifier);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as CollectionRow | null;
}

async function getCollectionProducts(collectionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("collection_products")
    .select(
      "product_id,sort_order,note,products:product_id(id,slug,name,brand,description,image_url,product_url,source_url)"
    )
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ProductJoinRow[])
    .map((row) => {
      const product = Array.isArray(row.products)
        ? row.products[0] ?? null
        : row.products;

      if (!product) {
        return null;
      }

      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        description: product.description ?? "",
        imageUrl: product.image_url,
        productUrl: product.product_url,
        sourceUrl: product.source_url,
        note: row.note,
        sortOrder: row.sort_order ?? 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const collection = await getCollectionByIdentifier(params.id);

    if (!collection || collection.kind !== "loadout") {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Loadout not found.",
          },
        },
        { status: 404 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!collection.is_public && user?.id !== collection.owner_id) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Loadout not found.",
          },
        },
        { status: 404 }
      );
    }

    const items = await getCollectionProducts(collection.id);
    return NextResponse.json({ data: { items } });
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

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const collection = await getCollectionByIdentifier(params.id);

    if (!collection || collection.kind !== "loadout") {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Loadout not found.",
          },
        },
        { status: 404 }
      );
    }

    const ownershipError = assertOwner(collection.owner_id, auth.user.id);
    if (ownershipError) {
      return ownershipError;
    }

    const body = await request.json().catch(() => null);
    const existingProductId =
      typeof body?.productId === "string" ? body.productId.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const brand = typeof body?.brand === "string" ? body.brand.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() : "";
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
    const productUrl =
      typeof body?.productUrl === "string" ? body.productUrl.trim() : "";
    const sourceUrl =
      typeof body?.sourceUrl === "string" ? body.sourceUrl.trim() : "";
    const note = typeof body?.note === "string" ? body.note.trim() : "";

    let productId = existingProductId;

    if (!productId) {
      if (!name) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_PRODUCT",
              message: "Select an existing product or provide a new product name.",
            },
          },
          { status: 400 }
        );
      }

      const slugBase = slugify(name) || "product";
      const slug = `${slugBase}-${Date.now().toString(36).slice(-6)}`;
      const { data: createdProduct, error: createProductError } = await supabase
        .from("products")
        .insert({
          slug,
          name,
          brand: brand || null,
          description: description || null,
          image_url: imageUrl || null,
          product_url: productUrl || null,
          source_url: sourceUrl || null,
          created_by: auth.user.id,
        })
        .select("id")
        .single();

      if (createProductError) {
        return NextResponse.json(
          {
            error: {
              code: "PRODUCT_CREATE_FAILED",
              message: createProductError.message,
            },
          },
          { status: 500 }
        );
      }

      productId = createdProduct.id;
    } else {
      const { data: existingProduct, error: existingProductError } = await supabase
        .from("products")
        .select("id")
        .eq("id", productId)
        .limit(1)
        .maybeSingle();

      if (existingProductError) {
        return NextResponse.json(
          {
            error: {
              code: "PRODUCT_LOOKUP_FAILED",
              message: existingProductError.message,
            },
          },
          { status: 500 }
        );
      }

      if (!existingProduct) {
        return NextResponse.json(
          {
            error: {
              code: "PRODUCT_NOT_FOUND",
              message: "Product not found.",
            },
          },
          { status: 404 }
        );
      }
    }

    const { data: latestSortRow } = await supabase
      .from("collection_products")
      .select("sort_order")
      .eq("collection_id", collection.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = (latestSortRow?.sort_order ?? 0) + 1;

    const { error: addToCollectionError } = await supabase
      .from("collection_products")
      .upsert(
        {
          collection_id: collection.id,
          product_id: productId,
          note: note || null,
          sort_order: nextSortOrder,
        },
        { onConflict: "collection_id,product_id" }
      );

    if (addToCollectionError) {
      return NextResponse.json(
        {
          error: {
            code: "ADD_FAILED",
            message: addToCollectionError.message,
          },
        },
        { status: 500 }
      );
    }

    const items = await getCollectionProducts(collection.id);
    return NextResponse.json({ data: { items } }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to add product";

    return NextResponse.json(
      {
        error: {
          code: "ADD_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const collection = await getCollectionByIdentifier(params.id);

    if (!collection || collection.kind !== "loadout") {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Loadout not found.",
          },
        },
        { status: 404 }
      );
    }

    const ownershipError = assertOwner(collection.owner_id, auth.user.id);
    if (ownershipError) {
      return ownershipError;
    }

    const body = await request.json().catch(() => null);
    const items = Array.isArray(body?.items) ? (body.items as unknown[]) : [];

    if (items.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ITEMS",
            message: "Provide at least one product item to reorder.",
          },
        },
        { status: 400 }
      );
    }

    const normalizedItems = items
      .map((item: unknown, index: number) => {
        const itemRecord =
          typeof item === "object" && item
            ? (item as Record<string, unknown>)
            : {};
        const productId =
          typeof itemRecord.productId === "string"
            ? itemRecord.productId.trim()
            : "";
        const note =
          typeof itemRecord.note === "string" ? itemRecord.note.trim() : "";

        return {
          productId,
          note: note || null,
          sortOrder: index + 1,
        };
      })
      .filter(
        (
          item
        ): item is {
          productId: string;
          note: string | null;
          sortOrder: number;
        } => item.productId.length > 0
      );

    const uniqueProductIds = Array.from(
      new Set(normalizedItems.map((item) => item.productId))
    );

    if (uniqueProductIds.length !== normalizedItems.length) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ITEMS",
            message: "Duplicate products are not allowed in reorder payload.",
          },
        },
        { status: 400 }
      );
    }

    const { data: existingRows, error: existingRowsError } = await supabase
      .from("collection_products")
      .select("product_id")
      .eq("collection_id", collection.id)
      .order("sort_order", { ascending: true });

    if (existingRowsError) {
      return NextResponse.json(
        {
          error: {
            code: "UPDATE_FAILED",
            message: existingRowsError.message,
          },
        },
        { status: 500 }
      );
    }

    const existingProductIds = (existingRows ?? []).map(
      (row) => row.product_id as string
    );

    if (existingProductIds.length !== uniqueProductIds.length) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ITEMS",
            message:
              "Reorder payload must include every product currently in this loadout.",
          },
        },
        { status: 400 }
      );
    }

    const existingIdSet = new Set(existingProductIds);
    const hasUnknownProduct = uniqueProductIds.some(
      (productId) => !existingIdSet.has(productId)
    );

    if (hasUnknownProduct) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_ITEMS",
            message: "One or more products are not part of this loadout.",
          },
        },
        { status: 400 }
      );
    }

    for (let index = 0; index < existingProductIds.length; index += 1) {
      const productId = existingProductIds[index];
      const { error: stageError } = await supabase
        .from("collection_products")
        .update({ sort_order: 1000 + index })
        .eq("collection_id", collection.id)
        .eq("product_id", productId);

      if (stageError) {
        return NextResponse.json(
          {
            error: {
              code: "UPDATE_FAILED",
              message: stageError.message,
            },
          },
          { status: 500 }
        );
      }
    }

    for (const item of normalizedItems) {
      const { error: updateItemError } = await supabase
        .from("collection_products")
        .update({
          sort_order: item.sortOrder,
          note: item.note,
        })
        .eq("collection_id", collection.id)
        .eq("product_id", item.productId);

      if (updateItemError) {
        return NextResponse.json(
          {
            error: {
              code: "UPDATE_FAILED",
              message: updateItemError.message,
            },
          },
          { status: 500 }
        );
      }
    }

    const latestItems = await getCollectionProducts(collection.id);
    return NextResponse.json({ data: { items: latestItems } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reorder products";

    return NextResponse.json(
      {
        error: {
          code: "UPDATE_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await requireCompleteUser();

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const collection = await getCollectionByIdentifier(params.id);

    if (!collection || collection.kind !== "loadout") {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Loadout not found.",
          },
        },
        { status: 404 }
      );
    }

    const ownershipError = assertOwner(collection.owner_id, auth.user.id);
    if (ownershipError) {
      return ownershipError;
    }

    const body = await request.json().catch(() => null);
    const productId =
      typeof body?.productId === "string" ? body.productId.trim() : "";

    if (!productId) {
      return NextResponse.json(
        {
          error: {
            code: "PRODUCT_REQUIRED",
            message: "Product id is required.",
          },
        },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("collection_products")
      .delete()
      .eq("collection_id", collection.id)
      .eq("product_id", productId);

    if (deleteError) {
      return NextResponse.json(
        {
          error: {
            code: "DELETE_FAILED",
            message: deleteError.message,
          },
        },
        { status: 500 }
      );
    }

    const latestItems = await getCollectionProducts(collection.id);
    for (let index = 0; index < latestItems.length; index += 1) {
      const item = latestItems[index];
      await supabase
        .from("collection_products")
        .update({ sort_order: index + 1 })
        .eq("collection_id", collection.id)
        .eq("product_id", item.productId);
    }

    const normalizedItems = await getCollectionProducts(collection.id);
    return NextResponse.json({ data: { items: normalizedItems } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete product";

    return NextResponse.json(
      {
        error: {
          code: "DELETE_FAILED",
          message,
        },
      },
      { status: 500 }
    );
  }
}
