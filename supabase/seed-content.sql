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
  cover_image_source_url,
  is_public,
  status,
  published_at
)
select
  owner.id,
  c.id,
  v.kind::public.collection_kind,
  v.slug,
  v.title,
  v.description,
  v.cover_image_url,
  v.cover_image_source_url,
  true,
  'published'::public.loadout_status,
  now()
from (
  values
    ('cat-013', 'loadout', 'creator-desk-kit', 'Creator Desk Kit', 'A focused desk setup for writing, design reviews, planning, and shipping content without clutter.', 'https://images.pexels.com/photos/9469520/pexels-photo-9469520.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'https://www.pexels.com/photo/desk-computer-setup-inside-a-room-9469520/'),
    ('cat-009', 'loadout', 'video-starter-kit', 'Video Starter Kit', 'A practical starter video setup built around one camera, clean audio, and simple lighting for fast production.', 'https://images.pexels.com/photos/1787220/pexels-photo-1787220.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'https://www.pexels.com/photo/close-up-photo-of-dslr-camera-1787220/')
) as v(category_slug, kind, slug, title, description, cover_image_url, cover_image_source_url)
join public.categories c on c.slug = v.category_slug
cross join owner
on conflict (slug) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  description = excluded.description,
  cover_image_url = excluded.cover_image_url,
  cover_image_source_url = excluded.cover_image_source_url,
  is_public = excluded.is_public,
  status = excluded.status,
  published_at = excluded.published_at;

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
  image_source_url,
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
  v.image_source_url,
  v.product_url,
  v.source_url,
  owner.id
from (
  values
    ('airpods-pro-2', 'AirPods Pro (2nd generation)', 'Apple', 'AirPods Pro deliver active noise cancellation, transparency mode, and a compact in-ear form factor for monitoring, calls, and everyday listening.', 'https://www.apple.com/v/airpods-pro/r/images/meta/og__c0ceegchesom_overview.png?202603242312', 'https://www.apple.com/airpods-pro/', 'https://www.apple.com/airpods-pro/', 'https://www.apple.com/airpods-pro/'),
    ('amaran-200x-s', 'Amaran 200x S', 'Amaran', 'The amaran 200x S is a 200W bi-color Bowens Mount point source light with upgraded high-SSI LEDs, improved spectral quality, and app-controlled output for creator and studio setups.', 'https://cdn.sanity.io/images/7n7ckclh/production/5522e3fb4c78212adedd9ff4ea9dfbb2e4c5a8aa-400x400.jpg', 'https://amarancreators.com/products/amaran-200x-s', 'https://amarancreators.com/products/amaran-200x-s', 'https://amarancreators.com/products/amaran-200x-s'),
    ('atomos-ninja', 'Ninja', 'Atomos', 'The Atomos Ninja series. the leading 5" camera monitor-recorder range, compatible with most camera, and for all content creation workflows', 'https://www.atomos.com/wp-content/uploads/2026/02/NINJA-FAMILY-2026-FEB.png', 'https://www.atomos.com/explore/ninja-series/', 'https://www.atomos.com/explore/ninja-series/', 'https://www.atomos.com/explore/ninja-series/'),
    ('canon-r6-mark-ii', 'EOS R6 Mark II', 'Canon', 'The EOS R6 Mark II is Canon''s full-frame mirrorless camera built for hybrid creators, with fast autofocus, strong low-light performance, and high-end still and video capture.', 'https://s7d1.scene7.com/is/image/canon/5666C002_eos_r6_mark_ii_body_primary?fmt=webp-alpha&wid=1335', 'https://www.usa.canon.com/shop/p/eos-r6-mark-ii?color=Black&type=New', 'https://www.usa.canon.com/shop/p/eos-r6-mark-ii?color=Black&type=New', 'https://www.usa.canon.com/shop/p/eos-r6-mark-ii?color=Black&type=New'),
    ('dell-u2723qe', 'UltraSharp U2723QE', 'Dell', 'Dell''s UltraSharp U2723QE is a 27-inch 4K USB-C hub monitor with IPS Black technology, sharp color, and dock-style connectivity for desk setups and editing workstations.', 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/u-series/u2723qe/media-gallery/monitor-u2723qe-gallery-3.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=872&qlt=100,1&resMode=sharp2&size=872,804&chrss=full', 'https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-usb-c-hub-monitor-u2723qe/apd/210-bdpf/monitors-monitor-accessories', 'https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-usb-c-hub-monitor-u2723qe/apd/210-bdpf/monitors-monitor-accessories', 'https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-usb-c-hub-monitor-u2723qe/apd/210-bdpf/monitors-monitor-accessories'),
    ('descript', 'Descript', 'Descript', 'Descript makes editing video and audio as easy as editing text. Record, transcribe, edit, and publish in one tool. Try for free, with powerful upgrades for creators & teams.', 'https://cdn.builder.io/api/v1/image/assets%2Ffcea5005d671451e9b07839c893228d0%2Fb1cf2c175fbe4a028dff4622ee1ce727', 'https://www.descript.com/', 'https://www.descript.com/', 'https://www.descript.com/'),
    ('figma', 'Figma', 'Figma', 'Figma is the leading collaborative design platform for building meaningful products. Design, prototype, and build products faster—while gathering feedback all in one place.', 'https://cdn.sanity.io/images/599r6htc/regionalized/342e17642c7afa81206490b0dd21c3e5724ae040-2400x1260.png?w=1200&q=70&fit=max&auto=format', 'https://www.figma.com/', 'https://www.figma.com/', 'https://www.figma.com/'),
    ('final-cut-pro', 'Final Cut Pro', 'Apple', 'Final Cut Pro is packed with powerful intelligence features, making pro-quality video creation and editing easy on your Mac and iPad.', 'https://www.apple.com/v/final-cut-pro/w/images/meta/final_cut__cumj84xteas2_og.png?202603241546', 'https://www.apple.com/final-cut-pro/', 'https://www.apple.com/final-cut-pro/', 'https://www.apple.com/final-cut-pro/'),
    ('focusrite-scarlett-2i2', 'Scarlett 2i2 4th Gen', 'Focusrite', 'The original studio-quality 2-in, 2-out interface, Focusrite Scarlett 2i2, has been remastered for the artist.', 'https://cdn11.bigcommerce.com/s-7exlzlf13h/products/307/images/785/scarlett-2i2-top-image-2400-2400__78159.1693324453.386.513.png?c=3', 'https://us.focusrite.com/products/scarlett-2i2', 'https://us.focusrite.com/products/scarlett-2i2', 'https://us.focusrite.com/products/scarlett-2i2'),
    ('gopro-hero12', 'HERO12 Black', 'GoPro', 'HERO12 Black is GoPro''s flagship action camera with rugged waterproof hardware, HyperSmooth stabilization, and long-form capture for POV and travel workflows.', 'https://static.gopro.com/assets/blta2b8522e5372af40/blt3e1d69abee0b4203/6659dac7d036b23b240097f8/01-pdp-h12b-gallery-v2-1920.jpg?width=3840&quality=80&auto=webp&disable=upscale', 'https://gopro.com/en/us/shop/cameras/hero12-black/CHDHX-121-master.html', 'https://gopro.com/en/us/shop/cameras/hero12-black/CHDHX-121-master.html', 'https://gopro.com/en/us/shop/cameras/hero12-black/CHDHX-121-master.html'),
    ('insta360-link-2', 'Insta360 Link 2', 'Insta360', 'Insta360 Link 2 is a 4K AI webcam with intelligent framing, strong low-light performance, and pro-level audio aimed at streaming, calls, and creator desks.', 'https://res.insta360.com/static/4e0d93be46a8714eead3c5478287a033/KV_@1440.jpg', 'https://www.insta360.com/product/insta360-link2', 'https://www.insta360.com/product/insta360-link2', 'https://www.insta360.com/product/insta360-link2'),
    ('key-light-air', 'Key Light Air', 'Elgato', 'Elgato Key Light Air is a freestanding Wi-Fi enabled lighting panel with 80 premium OSRAM LEDs outputting 1400 lumens for professional studio applications. Use the Control Center app to switch on/off, adjust brightnes...', 'https://images.ctfassets.net/h50kqpe25yx1/d1F24lEMtXFK8iHUKaIBL/c02f709b704f2467021e17ec115856d0/key-light-air.jpg', 'https://www.elgato.com/us/en/p/key-light-air', 'https://www.elgato.com/us/en/p/key-light-air', 'https://www.elgato.com/us/en/p/key-light-air'),
    ('keychron-k8-pro', 'K8 Pro', 'Keychron', 'Keychron K8 Pro QMK/VIA Wireless Mechanical Keyboard. Supports out-of-the-box QMK/VIA. Wireless or Wired. Hot swap every switch in a breeze with the hot-swappable feature. Compatible with Mac, Windows, iOS, Android, L...', 'https://www.keychron.com/cdn/shop/products/Keychron-K8-Pro-QMK-VIA-Wireless-Mechanical-Keyboard-for-Mac-Windows-PBT-keycaps-B-PCB-screw-in-stabilizer-hot-swappable-Gateron-G-Pro-mechanical-red-switch.jpg?crop=center&height=1200&v=1666259691&width=1200', 'https://www.keychron.com/products/keychron-k8-pro-qmk-via-wireless-mechanical-keyboard', 'https://www.keychron.com/products/keychron-k8-pro-qmk-via-wireless-mechanical-keyboard', 'https://www.keychron.com/products/keychron-k8-pro-qmk-via-wireless-mechanical-keyboard'),
    ('logitech-brio-4k', 'Brio 4K Webcam', 'Logitech', 'Shop Brio Webcam. Step up to the world’s most technologically advanced webcam. Logitech BRIO delivers 4K Ultra HD video with 5X zoom, and RightLight 3 with HDR', 'https://resource.logitech.com/w_1200,h_630,c_limit,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/webcams/brio/brio-og-image-new.jpg?v=1', 'https://www.logitech.com/en-us/products/webcams/brio-4k-hdr-webcam.html', 'https://www.logitech.com/en-us/products/webcams/brio-4k-hdr-webcam.html', 'https://www.logitech.com/en-us/products/webcams/brio-4k-hdr-webcam.html'),
    ('macbook-pro-14', 'MacBook Pro 14"', 'Apple', 'Find the best MacBook Pro for you with the M5, M5 Pro, or M5 Max chip. Built for AI. Up to 24 hours of battery life. Liquid Retina XDR display.', 'https://www.apple.com/v/macbook-pro/ax/images/meta/macbook-pro__difvbgz1plsi_og.png?202603261117', 'https://www.apple.com/macbook-pro/', 'https://www.apple.com/macbook-pro/', 'https://www.apple.com/macbook-pro/'),
    ('mx-master-3s', 'MX Master 3S', 'Logitech', 'MX Master 3S is Logitech''s flagship productivity mouse with quiet clicks, MagSpeed scrolling, and precision tracking for multi-device desk workflows.', 'https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/2025-update/mx-master-3s-bluetooth-edition-top-view-black-new-1.png', 'https://www.logitech.com/en-us/shop/p/mx-master-3s', 'https://www.logitech.com/en-us/shop/p/mx-master-3s', 'https://www.logitech.com/en-us/shop/p/mx-master-3s'),
    ('notion', 'Notion', 'Notion', 'Build Custom Agents, search across all your apps, and automate busywork. The AI workspace where teams get more done, faster.', 'https://www.notion.com/front-static/meta/custom-agents-og.png', 'https://www.notion.com/', 'https://www.notion.com/', 'https://www.notion.com/'),
    ('obs-studio', 'OBS Studio', 'OBS Project', 'OBS Studio is free, open-source software for recording and live streaming, with scene control, audio routing, and broadcaster-grade output workflows.', 'https://obsproject.com/assets/images/features-new/hero.png', 'https://obsproject.com/', 'https://obsproject.com/', 'https://obsproject.com/'),
    ('premiere-pro', 'Premiere Pro', 'Adobe', 'Adobe Premiere is professional video editing software for cutting footage, color work, audio mixing, and polished post-production across creator and studio workflows.', 'https://www.adobe.com/cc-shared/fragments/products/premiere/media_13231f4af57fd65bb780d691fc842fe044a428c23.png?width=2000&format=webply&optimize=medium', 'https://www.adobe.com/products/premiere.html', 'https://www.adobe.com/products/premiere.html', 'https://www.adobe.com/products/premiere.html'),
    ('rode-videomic', 'VideoMic Pro+', 'Rode', 'The RØDE VideoMic Pro+ is ideal for filmmakers looking for a flexible and feature-packed on-camera microphone. Find out more.', 'https://edge.rode.com//images/page/128/modules/4092/RØDE_VideoMic_Pro+_3_QUARTER_LEFT_FRONT_1080x1080.png', 'https://rode.com/en-au/products/videomic-pro-plus', 'https://rode.com/en-au/products/videomic-pro-plus', 'https://rode.com/en-au/products/videomic-pro-plus'),
    ('sandisk-extreme-ssd', 'Extreme Portable SSD', 'SanDisk', 'The SanDisk Extreme Portable SSD is a compact external SSD built for fast file movement, on-the-go editing, and rugged creator workflows across devices.', 'https://www.sandisk.com/content/dam/store/en-us/assets/products/usb-flash-drives/extreme-usb-3-2-ssd/gallery/extreme-usb-3-2-ssd-front.png.wdthumb.1280.1280.webp', 'https://www.sandisk.com/products/ssd/external-ssd/portable-ssd-sandisk-extreme-usb-3-2?sku=SDSSDE61-500G-G25', 'https://www.sandisk.com/products/ssd/external-ssd/portable-ssd-sandisk-extreme-usb-3-2?sku=SDSSDE61-500G-G25', 'https://www.sandisk.com/products/ssd/external-ssd/portable-ssd-sandisk-extreme-usb-3-2?sku=SDSSDE61-500G-G25'),
    ('shure-sm7b', 'SM7B', 'Shure', 'The Shure SM7B is the iconic dynamic vocal microphone you''ve already heard. It is perfect for professional podcasters, streamers, and vocalists alike.', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/7e1/bf6/ed-/setcard/721ed7ee412b45897688a7b5acdefa44.jpeg', 'https://www.shure.com/en-us/products/microphones/sm7b', 'https://www.shure.com/en-us/products/microphones/sm7b', 'https://www.shure.com/en-us/products/microphones/sm7b'),
    ('sigma-24-70-f28', '24-70mm F2.8 DG DN Art', 'Sigma', 'Sigma''s 24-70mm F2.8 DG DN Art is a fast standard zoom lens for full-frame mirrorless systems, built for versatile shooting across portrait, event, and video work.', 'https://www.sigma-global.com/lenses/a019_24_70_28_product_img01.png', 'https://www.sigma-global.com/en/lenses/a019_24_70_28/', 'https://www.sigma-global.com/en/lenses/a019_24_70_28/', 'https://www.sigma-global.com/en/lenses/a019_24_70_28/'),
    ('sony-a7iv', 'Alpha 7 IV', 'Sony', 'Sony''s Alpha 7 IV is a full-frame hybrid camera that balances high-resolution stills, strong autofocus, and 4K video for modern creator workflows.', 'https://d1ncau8tqf99kp.cloudfront.net/converted/92650_original_local_1200x1050_v3_converted.webp', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7m4-b', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7m4-b', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7m4-b'),
    ('sony-wh1000xm5', 'WH-1000XM5', 'Sony', 'Sony''s WH-1000XM5 headphones combine premium noise cancellation, strong call quality, and long battery life for focused work and travel listening.', 'https://d1ncau8tqf99kp.cloudfront.net/converted/103364_original_local_1200x1050_v3_converted.webp', 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b', 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b', 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b')
) as v(slug, name, brand, description, image_url, image_source_url, product_url, source_url)
cross join owner
on conflict (slug) do update
set
  name = excluded.name,
  brand = excluded.brand,
  description = excluded.description,
  image_url = excluded.image_url,
  image_source_url = excluded.image_source_url,
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
