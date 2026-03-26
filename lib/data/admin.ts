import { createSupabaseServerClient } from "../supabase/server";

interface ReportRow {
  id: string;
  entity_type: string;
  entity_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_id: string;
}

interface BrokenImageRow {
  id: string;
  slug: string;
  title: string;
}

interface OperationalFailureRow {
  id: string;
  user_id: string;
  event_name: string;
  context: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function getAdminDashboardData() {
  const supabase = await createSupabaseServerClient();

  const [reportsResult, missingLoadoutImagesResult, failuresResult] = await Promise.all([
    supabase
      .from("reports")
      .select("id,entity_type,entity_id,reason,status,created_at,reporter_id")
      .neq("status", "resolved")
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("collections")
      .select("id,slug,title")
      .eq("kind", "loadout")
      .or("cover_image_url.is.null,cover_image_url.eq.")
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("operational_events")
      .select("id,user_id,event_name,context,metadata,created_at")
      .eq("status", "error")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  if (reportsResult.error) {
    throw new Error(reportsResult.error.message);
  }

  if (missingLoadoutImagesResult.error) {
    throw new Error(missingLoadoutImagesResult.error.message);
  }

  if (
    failuresResult.error &&
    failuresResult.error.code !== "42P01" &&
    failuresResult.error.code !== "PGRST205"
  ) {
    throw new Error(failuresResult.error.message);
  }

  return {
    reports: (reportsResult.data ?? []) as ReportRow[],
    missingLoadoutImages: (missingLoadoutImagesResult.data ?? []) as BrokenImageRow[],
    recentFailures: (failuresResult.data ?? []) as OperationalFailureRow[],
  };
}
