# Supabase Content Schema

Run this in Supabase SQL Editor to create the content tables, indexes, triggers, and RLS policies used by the app.

```sql
begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'collection_kind') then
    create type public.collection_kind as enum ('category', 'loadout');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle citext unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint handle_format check (handle ~ '^[a-zA-Z0-9_]{3,30}$')
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug citext unique not null,
  title text not null,
  description text,
  cover_image_url text,
  cover_image_source_url text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  kind public.collection_kind not null default 'category',
  slug citext unique not null,
  title text not null,
  description text,
  cover_image_url text,
  cover_image_source_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug citext unique,
  name text not null,
  brand text,
  description text,
  image_url text,
  image_source_url text,
  product_url text,
  source_url text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  note text,
  created_at timestamptz not null default now(),
  primary key (collection_id, product_id),
  unique (collection_id, sort_order)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, collection_id)
);

create table if not exists public.saved_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, collection_id)
);

create index if not exists idx_collections_owner on public.collections(owner_id);
create index if not exists idx_collections_category on public.collections(category_id);
create index if not exists idx_collections_public_created on public.collections(is_public, created_at desc);
create index if not exists idx_collection_products_product on public.collection_products(product_id);
create index if not exists idx_comments_collection_created on public.comments(collection_id, created_at desc);
create index if not exists idx_likes_collection on public.likes(collection_id);
create index if not exists idx_saved_items_user_created on public.saved_items(user_id, created_at desc);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_collections_updated_at on public.collections;
create trigger trg_collections_updated_at before update on public.collections
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_comments_updated_at on public.comments;
create trigger trg_comments_updated_at before update on public.comments
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.collection_products enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.saved_items enable row level security;

drop policy if exists profiles_read_all on public.profiles;
create policy profiles_read_all on public.profiles for select using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists categories_read_all on public.categories;
create policy categories_read_all on public.categories for select using (is_active);

drop policy if exists categories_insert_auth on public.categories;
create policy categories_insert_auth on public.categories for insert to authenticated with check (created_by = auth.uid());

drop policy if exists categories_update_owner on public.categories;
create policy categories_update_owner on public.categories for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists categories_delete_owner on public.categories;
create policy categories_delete_owner on public.categories for delete to authenticated using (created_by = auth.uid());

drop policy if exists collections_read_public_or_owner on public.collections;
create policy collections_read_public_or_owner on public.collections
for select using (is_public or owner_id = auth.uid());

drop policy if exists collections_insert_owner on public.collections;
create policy collections_insert_owner on public.collections
for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists collections_update_owner on public.collections;
create policy collections_update_owner on public.collections
for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists collections_delete_owner on public.collections;
create policy collections_delete_owner on public.collections
for delete to authenticated using (owner_id = auth.uid());

drop policy if exists products_read_all on public.products;
create policy products_read_all on public.products for select using (true);

drop policy if exists products_insert_auth on public.products;
create policy products_insert_auth on public.products
for insert to authenticated with check (created_by = auth.uid());

drop policy if exists products_update_creator on public.products;
create policy products_update_creator on public.products
for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists products_delete_creator on public.products;
create policy products_delete_creator on public.products
for delete to authenticated using (created_by = auth.uid());

drop policy if exists collection_products_select_visible on public.collection_products;
create policy collection_products_select_visible on public.collection_products
for select using (
  exists (
    select 1 from public.collections c
    where c.id = collection_products.collection_id
      and (c.is_public or c.owner_id = auth.uid())
  )
);

drop policy if exists collection_products_modify_owner on public.collection_products;
create policy collection_products_modify_owner on public.collection_products
for all to authenticated using (
  exists (
    select 1 from public.collections c
    where c.id = collection_products.collection_id and c.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.collections c
    where c.id = collection_products.collection_id and c.owner_id = auth.uid()
  )
);

drop policy if exists comments_read_visible on public.comments;
create policy comments_read_visible on public.comments
for select using (
  exists (
    select 1 from public.collections c
    where c.id = comments.collection_id
      and (c.is_public or c.owner_id = auth.uid())
  )
);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
for insert to authenticated with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.collections c
    where c.id = comments.collection_id
      and (c.is_public or c.owner_id = auth.uid())
  )
);

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments
for delete to authenticated using (user_id = auth.uid());

drop policy if exists likes_read_all on public.likes;
create policy likes_read_all on public.likes for select using (true);

drop policy if exists likes_insert_own on public.likes;
create policy likes_insert_own on public.likes
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists likes_delete_own on public.likes;
create policy likes_delete_own on public.likes
for delete to authenticated using (user_id = auth.uid());

drop policy if exists saved_items_read_own on public.saved_items;
create policy saved_items_read_own on public.saved_items
for select to authenticated using (user_id = auth.uid());

drop policy if exists saved_items_insert_own on public.saved_items;
create policy saved_items_insert_own on public.saved_items
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists saved_items_delete_own on public.saved_items;
create policy saved_items_delete_own on public.saved_items
for delete to authenticated using (user_id = auth.uid());

commit;
```
