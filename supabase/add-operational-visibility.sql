begin;

create table if not exists public.operational_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  status text not null check (status in ('success', 'error')),
  context text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_operational_events_user_created
  on public.operational_events(user_id, created_at desc);

create index if not exists idx_operational_events_status_created
  on public.operational_events(status, created_at desc);

create index if not exists idx_operational_events_name_created
  on public.operational_events(event_name, created_at desc);

alter table public.operational_events enable row level security;

drop policy if exists operational_events_read_own on public.operational_events;
create policy operational_events_read_own
  on public.operational_events
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists operational_events_insert_own on public.operational_events;
create policy operational_events_insert_own
  on public.operational_events
  for insert
  to authenticated
  with check (user_id = auth.uid());

commit;
