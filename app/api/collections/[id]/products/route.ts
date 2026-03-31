import { NextResponse } from "next/server";
import { assertOwner, requireCompleteUser } from "../../../../../lib/auth/api";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";

interface RouteContext {
  params: {
    id: string;
  };
}

type AttachmentType = "product" | "submission";

interface CollectionRow {
  id: string;
  slug: string;
  owner_id: string;
  kind: "category" | "loadout";
  is_public: boolean;
}

interface ProductRecordRow {
  id: string;
  slug: string | null;
  name: string;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  source_url: string | null;
}

interface ProductSubmissionRow {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  source_url: string | null;
  review_status: "pending" | "approved" | "rejected" | null;
}

interface ProductJoinRow {
  sort_order: number | null;
  note: string | null;
  product_id: string;
  products: ProductRecordRow | ProductRecordRow[] | null;
}

interface ProductSubmissionJoinRow {
  sort_order: number | null;
  note: string | null;
  product_submission_id: string;
  product_submissions: ProductSubmissionRow | ProductSubmissionRow[] | null;
}

interface LoadoutProductItem {
  attachmentType: AttachmentType;
  attachmentId: string;
  productId: string | null;
  submissionId: string | null;
  slug: string | null;
  name: string;
  brand: string | null;
  description: string;
  imageUrl: string | null;
  productUrl: string | null;
  sourceUrl: string | null;
  note: string | null;
  sortOrder: number;
  reviewStatus: "pending" | "approved" | "rejected" | null;
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizeProductRecord(product: ProductRecordRow | ProductRecordRow[] | null) {
  if (!product) {
    return null;
  }

  return Array.isArray(product) ? product[0] ?? null : product;
}

function normalizeSubmissionRecord(
  product: ProductSubmissionRow | ProductSubmissionRow[] | null
) {
  if (!product) {
    return null;
  }

  return Array.isArray(product) ? product[0] ?? null : product;
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

async function getCollectionProducts(collectionId: string): Promise<LoadoutProductItem[]> {
  const supabase = await createSupabaseServerClient();
  const [existingProductsResult, submittedProductsResult] = await Promise.all([
    supabase
      .from("collection_products")
      .select(
        "product_id,sort_order,note,products:product_id(id,slug,name,brand,description,image_url,product_url,source_url)"
      )
      .eq("collection_id", collectionId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("collection_product_submissions")
      .select(
        "product_submission_id,sort_order,note,product_submissions:product_submission_id(id,name,brand,description,image_url,product_url,source_url,review_status)"
      )
      .eq("collection_id", collectionId)
      .order("sort_order", { ascending: true }),
  ]);

  if (existingProductsResult.error) {
    throw new Error(existingProductsResult.error.message);
  }

  if (submittedProductsResult.error) {
    throw new Error(submittedProductsResult.error.message);
  }

  const approvedItems = ((existingProductsResult.data ?? []) as ProductJoinRow[])
    .map((row) => {
      const product = normalizeProductRecord(row.products);

      if (!product) {
        return null;
      }

      return {
        attachmentType: "product" as const,
        attachmentId: product.id,
        productId: product.id,
        submissionId: null,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        description: product.description ?? "",
        imageUrl: product.image_url,
        productUrl: product.product_url,
        sourceUrl: product.source_url,
        note: row.note,
        sortOrder: row.sort_order ?? 0,
        reviewStatus: "approved" as const,
      } satisfies LoadoutProductItem;
    })
    .filter(isDefined);

  const submittedItems = ((submittedProductsResult.data ?? []) as ProductSubmissionJoinRow[])
    .map((row) => {
      const product = normalizeSubmissionRecord(row.product_submissions);

      if (!product) {
        return null;
      }

      return {
        attachmentType: "submission" as const,
        attachmentId: product.id,
        productId: null,
        submissionId: product.id,
        slug: null,
        name: product.name,
        brand: product.brand,
        description: product.description ?? "",
        imageUrl: product.image_url,
        productUrl: product.product_url,
        sourceUrl: product.source_url,
        note: row.note,
        sortOrder: row.sort_order ?? 0,
        reviewStatus: product.review_status ?? "pending",
      } satisfies LoadoutProductItem;
    })
    .filter(isDefined);

  return [...approvedItems, ...submittedItems].sort(
    (left, right) => left.sortOrder - right.sortOrder
  );
}

async function getNextSortOrder(collectionId: string) {
  const items = await getCollectionProducts(collectionId);

  if (items.length === 0) {
    return 1;
  }

  return Math.max(...items.map((item) => item.sortOrder)) + 1;
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

    const nextSortOrder = await getNextSortOrder(collection.id);

    if (existingProductId) {
      const { data: existingProduct, error: existingProductError } = await supabase
        .from("products")
        .select("id")
        .eq("id", existingProductId)
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

      const { error: addToCollectionError } = await supabase
        .from("collection_products")
        .upsert(
          {
            collection_id: collection.id,
            product_id: existingProductId,
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
    }

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

    const { data: createdSubmission, error: createSubmissionError } = await supabase
      .from("product_submissions")
      .insert({
        created_by: auth.user.id,
        name,
        brand: brand || null,
        description: description || null,
        image_url: imageUrl || null,
        product_url: productUrl || null,
        source_url: sourceUrl || null,
        review_status: "pending",
      })
      .select("id")
      .single();

    if (createSubmissionError) {
      return NextResponse.json(
        {
          error: {
            code: "PRODUCT_SUBMISSION_FAILED",
            message: createSubmissionError.message,
          },
        },
        { status: 500 }
      );
    }

    const { error: attachSubmissionError } = await supabase
      .from("collection_product_submissions")
      .insert({
        collection_id: collection.id,
        product_submission_id: createdSubmission.id,
        note: note || null,
        sort_order: nextSortOrder,
      });

    if (attachSubmissionError) {
      return NextResponse.json(
        {
          error: {
            code: "ADD_FAILED",
            message: attachSubmissionError.message,
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
        const attachmentId =
          typeof itemRecord.attachmentId === "string"
            ? itemRecord.attachmentId.trim()
            : "";
        const attachmentType =
          itemRecord.attachmentType === "submission" ? "submission" : "product";
        const note =
          typeof itemRecord.note === "string" ? itemRecord.note.trim() : "";

        return {
          attachmentId,
          attachmentType,
          note: note || null,
          sortOrder: index + 1,
        };
      })
      .filter(
        (
          item
        ): item is {
          attachmentId: string;
          attachmentType: AttachmentType;
          note: string | null;
          sortOrder: number;
        } => item.attachmentId.length > 0
      );

    const uniqueAttachmentKeys = Array.from(
      new Set(
        normalizedItems.map(
          (item) => `${item.attachmentType}:${item.attachmentId}`
        )
      )
    );

    if (uniqueAttachmentKeys.length !== normalizedItems.length) {
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

    const [existingProductsResult, existingSubmissionsResult] = await Promise.all([
      supabase
        .from("collection_products")
        .select("product_id")
        .eq("collection_id", collection.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("collection_product_submissions")
        .select("product_submission_id")
        .eq("collection_id", collection.id)
        .order("sort_order", { ascending: true }),
    ]);

    if (existingProductsResult.error) {
      return NextResponse.json(
        {
          error: {
            code: "UPDATE_FAILED",
            message: existingProductsResult.error.message,
          },
        },
        { status: 500 }
      );
    }

    if (existingSubmissionsResult.error) {
      return NextResponse.json(
        {
          error: {
            code: "UPDATE_FAILED",
            message: existingSubmissionsResult.error.message,
          },
        },
        { status: 500 }
      );
    }

    const existingProductIds = (existingProductsResult.data ?? []).map(
      (row) => row.product_id as string
    );
    const existingSubmissionIds = (existingSubmissionsResult.data ?? []).map(
      (row) => row.product_submission_id as string
    );
    const existingAttachmentKeys = [
      ...existingProductIds.map((id) => `product:${id}`),
      ...existingSubmissionIds.map((id) => `submission:${id}`),
    ];

    if (existingAttachmentKeys.length !== uniqueAttachmentKeys.length) {
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

    const existingKeySet = new Set(existingAttachmentKeys);
    const hasUnknownAttachment = uniqueAttachmentKeys.some(
      (key) => !existingKeySet.has(key)
    );

    if (hasUnknownAttachment) {
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

    for (let index = 0; index < existingSubmissionIds.length; index += 1) {
      const submissionId = existingSubmissionIds[index];
      const { error: stageError } = await supabase
        .from("collection_product_submissions")
        .update({ sort_order: 2000 + index })
        .eq("collection_id", collection.id)
        .eq("product_submission_id", submissionId);

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
      const tableName =
        item.attachmentType === "submission"
          ? "collection_product_submissions"
          : "collection_products";
      const idColumn =
        item.attachmentType === "submission"
          ? "product_submission_id"
          : "product_id";

      const { error: updateItemError } = await supabase
        .from(tableName)
        .update({
          sort_order: item.sortOrder,
          note: item.note,
        })
        .eq("collection_id", collection.id)
        .eq(idColumn, item.attachmentId);

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
    const attachmentId =
      typeof body?.attachmentId === "string"
        ? body.attachmentId.trim()
        : typeof body?.productId === "string"
          ? body.productId.trim()
          : "";
    const attachmentType =
      body?.attachmentType === "submission" ? "submission" : "product";

    if (!attachmentId) {
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

    const deleteQuery =
      attachmentType === "submission"
        ? supabase
            .from("collection_product_submissions")
            .delete()
            .eq("collection_id", collection.id)
            .eq("product_submission_id", attachmentId)
        : supabase
            .from("collection_products")
            .delete()
            .eq("collection_id", collection.id)
            .eq("product_id", attachmentId);

    const { error: deleteError } = await deleteQuery;

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

    for (const item of latestItems) {
      const tableName =
        item.attachmentType === "submission"
          ? "collection_product_submissions"
          : "collection_products";
      const idColumn =
        item.attachmentType === "submission"
          ? "product_submission_id"
          : "product_id";

      await supabase
        .from(tableName)
        .update({ sort_order: item.sortOrder })
        .eq("collection_id", collection.id)
        .eq(idColumn, item.attachmentId);
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
