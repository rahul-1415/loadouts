begin;

alter table public.collections
  drop constraint if exists collections_slug_key;

create unique index if not exists collections_owner_slug_key
  on public.collections(owner_id, slug);

commit;
