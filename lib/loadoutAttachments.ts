import { createSupabaseServerClient } from "./supabase/server";
import { getAttachmentKey } from "./loadoutLayout";

export type LoadoutAttachmentType = "product" | "submission";

export interface LoadoutAttachmentReference {
  attachmentType: LoadoutAttachmentType;
  attachmentId: string;
  attachmentKey: string;
}

interface ProductJoinRow {
  product_id: string;
}

interface SubmissionJoinRow {
  product_submission_id: string;
}

export async function getLoadoutAttachmentReferences(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  collectionId: string
): Promise<LoadoutAttachmentReference[]> {
  const [approvedResult, submissionResult] = await Promise.all([
    supabase
      .from("collection_products")
      .select("product_id")
      .eq("collection_id", collectionId),
    supabase
      .from("collection_product_submissions")
      .select("product_submission_id")
      .eq("collection_id", collectionId),
  ]);

  if (approvedResult.error) {
    throw new Error(approvedResult.error.message);
  }

  if (submissionResult.error) {
    throw new Error(submissionResult.error.message);
  }

  const approved = ((approvedResult.data ?? []) as ProductJoinRow[]).map((row) => ({
    attachmentType: "product" as const,
    attachmentId: row.product_id,
    attachmentKey: getAttachmentKey("product", row.product_id),
  }));

  const submissions = ((submissionResult.data ?? []) as SubmissionJoinRow[]).map((row) => ({
    attachmentType: "submission" as const,
    attachmentId: row.product_submission_id,
    attachmentKey: getAttachmentKey("submission", row.product_submission_id),
  }));

  return [...approved, ...submissions];
}
