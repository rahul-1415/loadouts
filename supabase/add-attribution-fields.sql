begin;

alter table public.categories
  add column if not exists cover_image_source_url text;

alter table public.collections
  add column if not exists cover_image_source_url text;

alter table public.products
  add column if not exists image_source_url text;

commit;
