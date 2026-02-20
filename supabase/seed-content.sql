begin;

-- 0) Make sure this email exists in auth.users
-- select id, email from auth.users order by created_at desc;

-- 1) Profile for your owner user
with owner as (
  select id
  from auth.users
  where email = 'you@example.com'
  limit 1
)
insert into public.profiles (id, handle, display_name, bio)
select id, 'rahul', 'Rahul', 'Creator and curator'
from owner
on conflict (id) do update
set
  handle = excluded.handle,
  display_name = excluded.display_name,
  bio = excluded.bio;

-- 2) Keep only fixed A-Z categories active (cat-001..cat-100).
-- Seed fixed categories first with supabase/seed-100-categories.sql
update public.categories
set is_active = false
where is_active = true
  and slug !~* '^cat-(00[1-9]|0[1-9][0-9]|100)$';

-- 3) Collections / loadouts
with owner as (
  select id
  from auth.users
  where email = 'you@example.com'
  limit 1
)
insert into public.collections (
  owner_id,
  category_id,
  kind,
  slug,
  title,
  description,
  cover_image_url,
  is_public
)
select
  owner.id,
  c.id,
  v.kind::public.collection_kind,
  v.slug,
  v.title,
  v.description,
  v.cover_image_url,
  true
from (
  values
    ('cat-013', 'loadout', 'creator-desk-kit', 'Creator Desk Kit', 'My daily setup for coding and content', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085'),
    ('cat-009', 'loadout', 'video-starter-kit', 'Video Starter Kit', 'Simple kit for recording and editing', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f')
) as v(category_slug, kind, slug, title, description, cover_image_url)
join public.categories c on c.slug = v.category_slug
cross join owner
on conflict (slug) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  cover_image_url = excluded.cover_image_url,
  is_public = excluded.is_public;

-- 4) Products
with owner as (
  select id
  from auth.users
  where email = 'you@example.com'
  limit 1
)
insert into public.products (
  slug,
  name,
  brand,
  description,
  image_url,
  product_url,
  source_url,
  created_by
)
select
  v.slug,
  v.name,
  v.brand,
  v.description,
  v.image_url,
  v.product_url,
  v.source_url,
  owner.id
from (
  values
    ('macbook-pro-14', 'MacBook Pro 14"', 'Apple', 'Main machine for dev and editing', 'https://images.unsplash.com/photo-1517336714739-489689fd1ca8', 'https://www.apple.com/macbook-pro/', 'https://www.apple.com/macbook-pro/'),
    ('mx-master-3s', 'MX Master 3S', 'Logitech', 'Ergonomic productivity mouse', 'https://images.unsplash.com/photo-1527814050087-3793815479db', 'https://www.logitech.com/products/mice/mx-master-3s.html', 'https://www.logitech.com/'),
    ('sony-a7iv', 'Alpha 7 IV', 'Sony', 'Hybrid camera for content creation', 'https://images.unsplash.com/photo-1516724562728-afc824a36e84', 'https://electronics.sony.com/', 'https://electronics.sony.com/'),
    ('rode-videomic', 'VideoMic Pro+', 'Rode', 'On-camera directional microphone', 'https://images.unsplash.com/photo-1589903308904-1010c2294adc', 'https://rode.com/', 'https://rode.com/'),
    ('key-light-air', 'Key Light Air', 'Elgato', 'Soft light for desk videos', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f', 'https://www.elgato.com/', 'https://www.elgato.com/'),
    ('notion', 'Notion', 'Notion', 'Planning and documentation workspace', 'https://images.unsplash.com/photo-1455390582262-044cdead277a', 'https://www.notion.so/', 'https://www.notion.so/')
) as v(slug, name, brand, description, image_url, product_url, source_url)
cross join owner
on conflict (slug) do update
set
  name = excluded.name,
  brand = excluded.brand,
  description = excluded.description,
  image_url = excluded.image_url,
  product_url = excluded.product_url,
  source_url = excluded.source_url;

-- 5) Attach products to collections
delete from public.collection_products cp
using public.collections c
where cp.collection_id = c.id
  and c.slug in ('creator-desk-kit', 'video-starter-kit');

insert into public.collection_products (collection_id, product_id, sort_order, note)
select
  c.id,
  p.id,
  v.sort_order,
  v.note
from (
  values
    ('creator-desk-kit', 'macbook-pro-14', 1, 'Primary workstation'),
    ('creator-desk-kit', 'mx-master-3s', 2, 'Daily mouse'),
    ('creator-desk-kit', 'notion', 3, 'Planning stack'),
    ('video-starter-kit', 'sony-a7iv', 1, 'Main camera'),
    ('video-starter-kit', 'rode-videomic', 2, 'Audio capture'),
    ('video-starter-kit', 'key-light-air', 3, 'Lighting')
) as v(collection_slug, product_slug, sort_order, note)
join public.collections c on c.slug = v.collection_slug
join public.products p on p.slug = v.product_slug
on conflict (collection_id, product_id) do update
set
  sort_order = excluded.sort_order,
  note = excluded.note;

commit;
