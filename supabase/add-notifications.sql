begin;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('follow', 'like', 'comment', 'loadout_published')),
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_recipient_created
  on public.notifications(recipient_id, created_at desc);

create index if not exists idx_notifications_recipient_unread
  on public.notifications(recipient_id, is_read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own
  on public.notifications
  for select
  to authenticated
  using (recipient_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

drop policy if exists notifications_insert_auth on public.notifications;
create policy notifications_insert_auth
  on public.notifications
  for insert
  to authenticated
  with check (actor_id = auth.uid());

commit;
