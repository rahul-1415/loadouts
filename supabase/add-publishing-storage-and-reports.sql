begin;

alter table public.collections
  add column if not exists status text not null default 'draft'
  check (status in ('draft', 'published', 'archived'));

alter table public.collections
  add column if not exists published_at timestamptz;

alter table public.collections
  add column if not exists archived_at timestamptz;

update public.collections
set
  status = case when is_public then 'published' else 'draft' end,
  published_at = case when is_public and published_at is null then created_at else published_at end,
  archived_at = null
where status is null
   or status not in ('draft', 'published', 'archived');

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('loadout', 'profile', 'comment')),
  entity_id uuid not null,
  reason text not null check (char_length(trim(reason)) between 8 and 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  admin_note text,
  unique (reporter_id, entity_type, entity_id)
);

create index if not exists idx_reports_status_created
  on public.reports(status, created_at desc);

alter table public.reports enable row level security;

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own
  on public.reports
  for insert
  to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists reports_read_own on public.reports;
create policy reports_read_own
  on public.reports
  for select
  to authenticated
  using (reporter_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update
set public = true;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read
  on storage.objects
  for select
  using (bucket_id = 'media');

drop policy if exists media_owner_insert on storage.objects;
create policy media_owner_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists media_owner_update on storage.objects;
create policy media_owner_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists media_owner_delete on storage.objects;
create policy media_owner_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

commit;
