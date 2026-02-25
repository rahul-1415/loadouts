begin;

alter table public.profiles
  add column if not exists interests text[] not null default '{}'::text[];

update public.profiles
set handle = lower(handle)
where handle is not null;

alter table public.profiles
  drop constraint if exists handle_format;

alter table public.profiles
  add constraint handle_format
  check (handle ~ '^[a-z0-9_]{3,30}$');

alter table public.profiles
  drop constraint if exists interests_limit;

alter table public.profiles
  add constraint interests_limit
  check (coalesce(array_length(interests, 1), 0) <= 10);

create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists idx_follows_following_created
  on public.follows(following_id, created_at desc, follower_id);

create index if not exists idx_follows_follower_created
  on public.follows(follower_id, created_at desc, following_id);

alter table public.follows enable row level security;

drop policy if exists follows_read_all on public.follows;
create policy follows_read_all
  on public.follows
  for select
  using (true);

drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own
  on public.follows
  for insert
  to authenticated
  with check (follower_id = auth.uid());

drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own
  on public.follows
  for delete
  to authenticated
  using (follower_id = auth.uid());

commit;
