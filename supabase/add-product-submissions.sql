begin;

create table if not exists public.product_submissions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  approved_product_id uuid references public.products(id) on delete set null,
  name text not null,
  brand text,
  description text,
  image_url text,
  product_url text,
  source_url text,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_product_submissions (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_submission_id uuid not null references public.product_submissions(id) on delete cascade,
  sort_order integer not null default 0,
  note text,
  created_at timestamptz not null default now(),
  primary key (collection_id, product_submission_id),
  unique (collection_id, sort_order)
);

create index if not exists idx_product_submissions_created_by_status
  on public.product_submissions(created_by, review_status, created_at desc);

create index if not exists idx_collection_product_submissions_submission
  on public.collection_product_submissions(product_submission_id);

drop trigger if exists trg_product_submissions_updated_at on public.product_submissions;
create trigger trg_product_submissions_updated_at
before update on public.product_submissions
for each row execute function public.set_updated_at();

alter table public.product_submissions enable row level security;
alter table public.collection_product_submissions enable row level security;

drop policy if exists product_submissions_read_visible on public.product_submissions;
create policy product_submissions_read_visible on public.product_submissions
for select using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.collection_product_submissions cps
    join public.collections c on c.id = cps.collection_id
    where cps.product_submission_id = product_submissions.id
      and (c.is_public or c.owner_id = auth.uid())
  )
);

drop policy if exists product_submissions_insert_own on public.product_submissions;
create policy product_submissions_insert_own on public.product_submissions
for insert to authenticated with check (created_by = auth.uid());

drop policy if exists product_submissions_update_creator on public.product_submissions;
create policy product_submissions_update_creator on public.product_submissions
for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists product_submissions_delete_creator on public.product_submissions;
create policy product_submissions_delete_creator on public.product_submissions
for delete to authenticated using (created_by = auth.uid());

drop policy if exists collection_product_submissions_select_visible on public.collection_product_submissions;
create policy collection_product_submissions_select_visible on public.collection_product_submissions
for select using (
  exists (
    select 1 from public.collections c
    where c.id = collection_product_submissions.collection_id
      and (c.is_public or c.owner_id = auth.uid())
  )
);

drop policy if exists collection_product_submissions_modify_owner on public.collection_product_submissions;
create policy collection_product_submissions_modify_owner on public.collection_product_submissions
for all to authenticated using (
  exists (
    select 1 from public.collections c
    where c.id = collection_product_submissions.collection_id
      and c.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.collections c
    where c.id = collection_product_submissions.collection_id
      and c.owner_id = auth.uid()
  )
);

commit;
