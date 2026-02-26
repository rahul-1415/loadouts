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
    ('mx-master-3s', 'MX Master 3S', 'Logitech', 'Ergonomic productivity mouse', 'https://images.unsplash.com/photo-1527814050087-3793815479db', 'https://www.logitech.com/products/mice/mx-master-3s.html', 'https://www.logitech.com/products/mice/mx-master-3s.html'),
    ('keychron-k8-pro', 'K8 Pro', 'Keychron', 'Wireless mechanical keyboard', 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae', 'https://www.keychron.com/products/keychron-k8-pro-qmk-via-wireless-mechanical-keyboard', 'https://www.keychron.com/products/keychron-k8-pro-qmk-via-wireless-mechanical-keyboard'),
    ('dell-u2723qe', 'UltraSharp U2723QE', 'Dell', '4K monitor with USB-C hub', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf', 'https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-usb-c-hub-monitor-u2723qe/apd/210-bdpf/monitors-monitor-accessories', 'https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-usb-c-hub-monitor-u2723qe/apd/210-bdpf/monitors-monitor-accessories'),
    ('sony-a7iv', 'Alpha 7 IV', 'Sony', 'Hybrid camera for content creation', 'https://images.unsplash.com/photo-1516724562728-afc824a36e84', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/full-frame/p/ilce7m4-b', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/full-frame/p/ilce7m4-b'),
    ('canon-r6-mark-ii', 'EOS R6 Mark II', 'Canon', 'Full-frame mirrorless camera', 'https://images.unsplash.com/photo-1502920917128-1aa500764b6f', 'https://www.usa.canon.com/shop/p/eos-r6-mark-ii', 'https://www.usa.canon.com/shop/p/eos-r6-mark-ii'),
    ('sigma-24-70-f28', '24-70mm F2.8 DG DN Art', 'Sigma', 'Fast all-purpose zoom lens', 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd', 'https://www.sigma-global.com/en/lenses/a019_24_70_28/', 'https://www.sigma-global.com/en/lenses/a019_24_70_28/'),
    ('gopro-hero12', 'HERO12 Black', 'GoPro', 'Action camera for travel and POV', 'https://images.unsplash.com/photo-1508898578281-774ac4893a03', 'https://gopro.com/en/us/shop/cameras/hero12-black/CHDHX-121-master.html', 'https://gopro.com/en/us/shop/cameras/hero12-black/CHDHX-121-master.html'),
    ('insta360-link-2', 'Insta360 Link 2', 'Insta360', 'AI-powered 4K webcam', 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28', 'https://www.insta360.com/product/insta360-link2', 'https://www.insta360.com/product/insta360-link2'),
    ('rode-videomic', 'VideoMic Pro+', 'Rode', 'On-camera directional microphone', 'https://images.unsplash.com/photo-1589903308904-1010c2294adc', 'https://rode.com/en/microphones/on-camera/videomic-pro-plus', 'https://rode.com/en/microphones/on-camera/videomic-pro-plus'),
    ('shure-sm7b', 'SM7B', 'Shure', 'Broadcast vocal microphone', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81', 'https://www.shure.com/en-US/products/microphones/sm7b', 'https://www.shure.com/en-US/products/microphones/sm7b'),
    ('focusrite-scarlett-2i2', 'Scarlett 2i2 4th Gen', 'Focusrite', 'USB audio interface for creators', 'https://images.unsplash.com/photo-1590608897129-79da98d15969', 'https://us.focusrite.com/products/scarlett-2i2', 'https://us.focusrite.com/products/scarlett-2i2'),
    ('key-light-air', 'Key Light Air', 'Elgato', 'Soft light for desk videos', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f', 'https://www.elgato.com/us/en/p/key-light-air', 'https://www.elgato.com/us/en/p/key-light-air'),
    ('amaran-200x-s', 'Amaran 200x S', 'Amaran', 'Bi-color LED light for studio', 'https://images.unsplash.com/photo-1529992312029-bce5ec7f9f6a', 'https://www.amarancreators.com/products/amaran-200x-s', 'https://www.amarancreators.com/products/amaran-200x-s'),
    ('atomos-ninja', 'Ninja', 'Atomos', 'External monitor recorder', 'https://images.unsplash.com/photo-1495707902641-75cac588d2e9', 'https://www.atomos.com/explore/ninja/', 'https://www.atomos.com/explore/ninja/'),
    ('sandisk-extreme-ssd', 'Extreme Portable SSD', 'SanDisk', 'Fast portable NVMe storage', 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12', 'https://www.westerndigital.com/products/portable-drives/sandisk-extreme-usb-3-2-ssd', 'https://www.westerndigital.com/products/portable-drives/sandisk-extreme-usb-3-2-ssd'),
    ('notion', 'Notion', 'Notion', 'Planning and documentation workspace', 'https://images.unsplash.com/photo-1455390582262-044cdead277a', 'https://www.notion.so/', 'https://www.notion.so/'),
    ('figma', 'Figma', 'Figma', 'UI design and prototyping', 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9', 'https://www.figma.com/', 'https://www.figma.com/'),
    ('obs-studio', 'OBS Studio', 'OBS Project', 'Live streaming and recording software', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3', 'https://obsproject.com/', 'https://obsproject.com/'),
    ('premiere-pro', 'Premiere Pro', 'Adobe', 'Professional video editing suite', 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d', 'https://www.adobe.com/products/premiere.html', 'https://www.adobe.com/products/premiere.html'),
    ('final-cut-pro', 'Final Cut Pro', 'Apple', 'Mac-native video editing suite', 'https://images.unsplash.com/photo-1518770660439-4636190af475', 'https://www.apple.com/final-cut-pro/', 'https://www.apple.com/final-cut-pro/'),
    ('descript', 'Descript', 'Descript', 'AI audio/video editing workflow', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085', 'https://www.descript.com/', 'https://www.descript.com/'),
    ('airpods-pro-2', 'AirPods Pro (2nd generation)', 'Apple', 'Wireless earbuds for monitoring', 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46', 'https://www.apple.com/airpods-pro/', 'https://www.apple.com/airpods-pro/'),
    ('sony-wh1000xm5', 'WH-1000XM5', 'Sony', 'Noise-canceling headphones', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b', 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b', 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b'),
    ('logitech-brio-4k', 'Brio 4K Webcam', 'Logitech', '4K webcam for calls and streams', 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04', 'https://www.logitech.com/en-us/products/webcams/brio-4k-hdr-webcam.960-001105.html', 'https://www.logitech.com/en-us/products/webcams/brio-4k-hdr-webcam.960-001105.html')
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
