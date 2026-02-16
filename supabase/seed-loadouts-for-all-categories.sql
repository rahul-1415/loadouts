begin;

with owner as (
  select id
  from auth.users
  where email = 'you@example.com'
  limit 1
),
category_rows as (
  select c.id, c.slug, c.title
  from public.categories c
  where c.is_active = true
)
insert into public.collections (
  owner_id,
  category_id,
  kind,
  slug,
  title,
  description,
  is_public
)
select
  owner.id,
  category_rows.id,
  'loadout'::public.collection_kind,
  category_rows.slug || '-starter',
  category_rows.title || ' Starter Loadout',
  'Starter loadout seeded for this category.',
  true
from category_rows
cross join owner
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  category_id = excluded.category_id,
  is_public = true;

commit;
