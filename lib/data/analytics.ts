import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";

export type AnalyticsEventName =
  | "signup_completed"
  | "first_loadout_created"
  | "first_follow"
  | "first_notification_received";

export async function trackMilestoneEvent({
  userId,
  eventName,
  metadata,
  client,
}: {
  userId: string;
  eventName: AnalyticsEventName;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient;
}) {
  const supabase = client ?? (await createSupabaseServerClient());
  const { error } = await supabase.from("analytics_events").upsert(
    {
      user_id: userId,
      event_name: eventName,
      metadata: metadata ?? {},
    },
    {
      onConflict: "user_id,event_name",
      ignoreDuplicates: true,
    }
  );

  if (!error) {
    return;
  }

  // No-op when migration has not been applied yet.
  if (error.code === "42P01" || error.code === "PGRST205") {
    return;
  }

  throw new Error(error.message);
}
