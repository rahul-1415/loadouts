begin;

-- 1) Ensure notification de-duplication is enforced at DB level.
alter table public.notifications
add column if not exists entity_key text
generated always as (coalesce(entity_id::text, '')) stored;

with ranked as (
  select
    id,
    row_number() over (
      partition by recipient_id, actor_id, type, entity_type, entity_key
      order by created_at desc, id desc
    ) as rn
  from public.notifications
)
delete from public.notifications n
using ranked r
where n.id = r.id
  and r.rn > 1;

create unique index if not exists idx_notifications_unique_event
  on public.notifications(recipient_id, actor_id, type, entity_type, entity_key);

-- 2) Lightweight analytics milestones.
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (
    event_name in (
      'signup_completed',
      'first_loadout_created',
      'first_follow',
      'first_notification_received'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_name)
);

create index if not exists idx_analytics_events_user_created
  on public.analytics_events(user_id, created_at desc);

create index if not exists idx_analytics_events_name_created
  on public.analytics_events(event_name, created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists analytics_events_read_own on public.analytics_events;
create policy analytics_events_read_own
  on public.analytics_events
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists analytics_events_insert_own on public.analytics_events;
create policy analytics_events_insert_own
  on public.analytics_events
  for insert
  to authenticated
  with check (user_id = auth.uid());

commit;
