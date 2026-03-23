import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server";

export type AnalyticsEventName =
  | "signup_completed"
  | "first_loadout_created"
  | "first_follow"
  | "first_notification_received";

export type OperationalEventStatus = "success" | "error";

export type OperationalEventName =
  | "profile_setup_completed"
  | "profile_setup_failed"
  | "loadout_created"
  | "loadout_create_failed"
  | "saved_item_added"
  | "save_toggle_failed"
  | "comment_added"
  | "comment_create_failed"
  | "like_added"
  | "like_toggle_failed"
  | "follow_created"
  | "follow_failed"
  | "notifications_fetch_failed";

interface MilestoneRow {
  event_name: AnalyticsEventName;
  created_at: string;
}

interface OperationalEventRow {
  event_name: OperationalEventName;
  status: OperationalEventStatus;
  context: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface StudioInsightItem {
  eventName: string;
  context: string;
  status: OperationalEventStatus;
  createdAt: string;
  message: string | null;
}

export interface StudioMilestone {
  eventName: AnalyticsEventName;
  label: string;
  completed: boolean;
  completedAt: string | null;
}

export interface StudioInsights {
  milestones: StudioMilestone[];
  totals: {
    last7dSuccesses: number;
    last7dFailures: number;
  };
  recentSuccesses: StudioInsightItem[];
  recentFailures: StudioInsightItem[];
}

const milestoneLabels: Record<AnalyticsEventName, string> = {
  signup_completed: "Profile onboarding completed",
  first_loadout_created: "First loadout published",
  first_follow: "First follow completed",
  first_notification_received: "First notification received",
};

function isMissingAnalyticsTable(error: { code?: string } | null | undefined) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function formatOperationalMessage(metadata: Record<string, unknown> | null) {
  if (!metadata) {
    return null;
  }

  const message = metadata.message;
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  const code = metadata.code;
  if (typeof code === "string" && code.trim()) {
    return code.trim();
  }

  return null;
}

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

  if (!error || isMissingAnalyticsTable(error)) {
    return;
  }

  throw new Error(error.message);
}

export async function captureOperationalEvent({
  userId,
  eventName,
  status,
  context,
  metadata,
  client,
}: {
  userId: string;
  eventName: OperationalEventName;
  status: OperationalEventStatus;
  context: string;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient;
}) {
  const supabase = client ?? (await createSupabaseServerClient());
  const { error } = await supabase.from("operational_events").insert({
    user_id: userId,
    event_name: eventName,
    status,
    context,
    metadata: metadata ?? {},
  });

  if (!error || isMissingAnalyticsTable(error)) {
    return;
  }

  throw new Error(error.message);
}

export async function getStudioInsights({
  userId,
  client,
}: {
  userId: string;
  client?: SupabaseClient;
}): Promise<StudioInsights> {
  const supabase = client ?? (await createSupabaseServerClient());

  const [milestonesResult, operationalResult] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("event_name,created_at")
      .eq("user_id", userId),
    supabase
      .from("operational_events")
      .select("event_name,status,context,metadata,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const milestoneRows = !milestonesResult.error
    ? ((milestonesResult.data ?? []) as MilestoneRow[])
    : [];
  const operationalRows = !operationalResult.error
    ? ((operationalResult.data ?? []) as OperationalEventRow[])
    : [];

  if (milestonesResult.error && !isMissingAnalyticsTable(milestonesResult.error)) {
    throw new Error(milestonesResult.error.message);
  }

  if (operationalResult.error && !isMissingAnalyticsTable(operationalResult.error)) {
    throw new Error(operationalResult.error.message);
  }

  const milestoneByName = new Map(
    milestoneRows.map((row) => [row.event_name, row.created_at])
  );
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const mappedEvents = operationalRows.map((row) => ({
    eventName: row.event_name,
    context: row.context,
    status: row.status,
    createdAt: row.created_at,
    message: formatOperationalMessage(row.metadata),
  }));

  const recentSuccesses = mappedEvents
    .filter((row) => row.status === "success")
    .slice(0, 5);
  const recentFailures = mappedEvents
    .filter((row) => row.status === "error")
    .slice(0, 5);

  const totals = mappedEvents.reduce(
    (accumulator, row) => {
      const eventTime = Date.parse(row.createdAt);
      if (Number.isNaN(eventTime) || eventTime < cutoff) {
        return accumulator;
      }

      if (row.status === "success") {
        accumulator.last7dSuccesses += 1;
      } else {
        accumulator.last7dFailures += 1;
      }

      return accumulator;
    },
    {
      last7dSuccesses: 0,
      last7dFailures: 0,
    }
  );

  const milestones = (Object.keys(milestoneLabels) as AnalyticsEventName[]).map(
    (eventName) => ({
      eventName,
      label: milestoneLabels[eventName],
      completed: milestoneByName.has(eventName),
      completedAt: milestoneByName.get(eventName) ?? null,
    })
  );

  return {
    milestones,
    totals,
    recentSuccesses,
    recentFailures,
  };
}
