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
    ('cat-009', 'loadout', 'video-starter-kit', 'Video Starter Kit', 'A practical starter video setup built around one camera, clean audio, and simple lighting for fast production.', 'https://images.pexels.com/photos/1787220/pexels-photo-1787220.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'https://www.pexels.com/photo/close-up-photo-of-dslr-camera-1787220/'),
    ('cat-013', 'loadout', 'broadcast-desk-rig', 'Broadcast Desk Rig', 'A polished desk setup for streaming, meetings, and daily production with reliable camera, lighting, and control surfaces.', 'https://images.pexels.com/photos/9469520/pexels-photo-9469520.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'https://www.pexels.com/photo/desk-computer-setup-inside-a-room-9469520/'),
    ('cat-021', 'loadout', 'solo-video-studio', 'Solo Video Studio', 'A lean one-person studio kit built for interviews, explainers, and fast turnaround video with pro audio and lighting.', 'https://images.pexels.com/photos/34037220/pexels-photo-34037220.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'https://www.pexels.com/photo/smiling-young-filmmaker-with-camera-in-urban-setting-34037220/'),
    ('cat-014', 'loadout', 'travel-creator-bag', 'Travel Creator Bag', 'A mobile setup for travel shoots, quick edits, and lightweight capture when a full studio rig is not practical.', 'https://images.pexels.com/photos/5014710/pexels-photo-5014710.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'https://www.pexels.com/photo/drones-flying-along-field-road-in-mountains-5014710/'),
    ('cat-020', 'loadout', 'reading-and-research-kit', 'Reading and Research Kit', 'A quieter reading setup for long-form research, highlights, voice notes, and lightweight idea capture away from the main desk.', 'https://images.pexels.com/photos/3747507/pexels-photo-3747507.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'https://www.pexels.com/photo/person-holding-black-tablet-computer-3747507/'),
    ('cat-001', 'loadout', 'remote-podcast-rig', 'Remote Podcast Rig', 'An at-home recording chain for remote interviews, voice sessions, and podcast episodes with clean routing and monitoring.', 'https://images.pexels.com/photos/5650544/pexels-photo-5650544.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200', 'https://www.pexels.com/photo/buttons-on-sound-mixer-5650544/')
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
    ('ableton-live-12', 'Live 12', 'Ableton', 'Ableton Live 12 is music production software built for composition, performance, and sound design workflows.', 'https://beta-ableton.imgix.net/media/y1tf4gvt/l12-beta-800x600.jpg', 'https://www.ableton.com/en/live/', 'https://www.ableton.com/en/live/', 'http://www.ableton.com/en/live/'),
    ('adobe-lightroom', 'Lightroom', 'Adobe', 'Lightroom is Adobe''s photo workflow app for organizing, editing, syncing, and delivering still images across desktop and mobile.', 'https://www.adobe.com/products/media_1e459da212cbda34dbab87b26a733fff0de666ad0.jpg?format=jpg&optimize=medium&width=750', 'https://www.adobe.com/products/photoshop-lightroom.html', 'https://www.adobe.com/products/photoshop-lightroom.html', 'https://www.adobe.com/products/photoshop-lightroom.html'),
    ('airpods-max', 'AirPods Max', 'Apple', 'AirPods Max are Apple''s over-ear headphones with active noise cancellation, transparency mode, spatial audio, and a premium closed-back design for focused listening.', 'https://www.apple.com/v/airpods-max/k/images/meta/airpods-max_overview__c2mz40a3bugm_og.png?202603242312', 'https://www.apple.com/airpods-max/', 'https://www.apple.com/airpods-max/', 'https://www.apple.com/airpods-max/'),
    ('airpods-pro-2', 'AirPods Pro (2nd generation)', 'Apple', 'AirPods Pro deliver active noise cancellation, transparency mode, and a compact in-ear form factor for monitoring, calls, and everyday listening.', 'https://www.apple.com/v/airpods-pro/r/images/meta/og__c0ceegchesom_overview.png?202603242312', 'https://www.apple.com/airpods-pro/', 'https://www.apple.com/airpods-pro/', 'https://www.apple.com/airpods-pro/'),
    ('amaran-200x-s', 'Amaran 200x S', 'Amaran', 'The amaran 200x S is a 200W bi-color Bowens Mount point source light with upgraded high-SSI LEDs, improved spectral quality, and app-controlled output for creator and studio setups.', 'https://cdn.sanity.io/images/7n7ckclh/production/5522e3fb4c78212adedd9ff4ea9dfbb2e4c5a8aa-400x400.jpg', 'https://amarancreators.com/products/amaran-200x-s', 'https://amarancreators.com/products/amaran-200x-s', 'https://amarancreators.com/products/amaran-200x-s'),
    ('apple-studio-display', 'Studio Display', 'Apple', 'Studio Display is Apple''s 27-inch 5K monitor with a built-in camera, speakers, and Thunderbolt connectivity for desk setups, editing, and review workflows.', 'https://www.apple.com/v/studio-display/f/images/meta/studio-display_overview__cc7vair07fjm_og.png?202603261117', 'https://www.apple.com/studio-display/', 'https://www.apple.com/studio-display/', 'https://www.apple.com/studio-display/'),
    ('aputure-mc-pro', 'MC Pro', 'Aputure', 'MC Pro is Aputure''s compact RGBWW light for practical accents, mobile kits, and color control in tighter production environments.', 'https://cdn.shopify.com/s/files/1/1343/1935/files/MC_Pro_1.png?v=1774336376', 'https://www.aputure.com/products/mc-pro/', 'https://www.aputure.com/products/mc-pro/', 'https://aputure.com/en-US/products/mc-pro'),
    ('atomos-ninja', 'Ninja', 'Atomos', 'The Atomos Ninja series. the leading 5" camera monitor-recorder range, compatible with most camera, and for all content creation workflows', 'https://www.atomos.com/wp-content/uploads/2026/02/NINJA-FAMILY-2026-FEB.png', 'https://www.atomos.com/explore/ninja-series/', 'https://www.atomos.com/explore/ninja-series/', 'https://www.atomos.com/explore/ninja-series/'),
    ('benq-pd3225u', 'PD3225U', 'BenQ', 'PD3225U is BenQ''s 32-inch 4K monitor for creative work, with Thunderbolt connectivity, wide-gamut color, and display tuning aimed at video, photo, and design workflows.', 'https://image.benq.com/is/image/benqco/pd3200u-right45-1?$ResponsivePreset$', 'https://www.benq.com/en-us/monitor/professional/pd3225u.html', 'https://www.benq.com/en-us/monitor/professional/pd3225u.html', 'https://www.benq.com/en-us/monitor/creative-pro/pd3225u.html'),
    ('blackmagic-pocket-cinema-camera-6k-pro', 'Blackmagic Pocket Cinema Camera 6K Pro', 'Blackmagic Design', 'Pocket Cinema Camera 6K Pro is Blackmagic''s Super 35 cinema camera with internal ND filters and RAW capture for more deliberate video production.', 'https://images.blackmagicdesign.com/images/products/blackmagicpocketcinemacamera/product-grid/blackmagic-pocket-cinema-camera-6k-pro.jpg?_v=1709252069', 'https://www.blackmagicdesign.com/products/blackmagicpocketcinemacamera', 'https://www.blackmagicdesign.com/products/blackmagicpocketcinemacamera', 'https://www.blackmagicdesign.com/products/blackmagicpocketcinemacamera'),
    ('boox-palma-2', 'BOOX Palma 2', 'BOOX', 'BOOX Palma 2 is a compact ePaper device for reading, annotation, and distraction-light research while keeping a phone-sized form factor.', 'https://shop.boox.com/cdn/shop/files/01_d2c58899-ae0c-489e-a94f-fc3417b8834b_grande.jpg?v=1729236534', 'https://shop.boox.com/products/palma2', 'https://shop.boox.com/products/palma2', 'https://shop.boox.com/products/palma2'),
    ('caldigit-ts4', 'TS4', 'CalDigit', 'The CalDigit TS4 Thunderbolt 4 Dock adds 18 ports of connectivity, 98W laptop charging, dual display connectivity, and 2.5GbE via a single cable.', 'https://www.caldigit.com/wp-content/uploads/2021/12/TS4_Thunderbolt-4-Dock_S2V1_D_1920px_Updated.jpg', 'https://www.caldigit.com/thunderbolt-station-4/', 'https://www.caldigit.com/thunderbolt-station-4/', 'https://www.caldigit.com/thunderbolt-station-4/'),
    ('canon-r6-mark-ii', 'EOS R6 Mark II', 'Canon', 'The EOS R6 Mark II is Canon''s full-frame mirrorless camera built for hybrid creators, with fast autofocus, strong low-light performance, and high-end still and video capture.', 'https://s7d1.scene7.com/is/image/canon/5666C002_eos_r6_mark_ii_body_primary?fmt=webp-alpha&wid=1335', 'https://www.usa.canon.com/shop/p/eos-r6-mark-ii?color=Black&type=New', 'https://www.usa.canon.com/shop/p/eos-r6-mark-ii?color=Black&type=New', 'https://www.usa.canon.com/shop/p/eos-r6-mark-ii?color=Black&type=New'),
    ('davinci-resolve', 'DaVinci Resolve', 'Blackmagic Design', 'DaVinci Resolve brings editing, color, audio, motion graphics, and collaboration into one post-production application.', 'https://images.blackmagicdesign.com/images/products/davinciresolve/product-grid/davinci-resolve-studio.jpg?_v=1712728177', 'https://www.blackmagicdesign.com/products/davinciresolve', 'https://www.blackmagicdesign.com/products/davinciresolve', 'https://www.blackmagicdesign.com/products/davinciresolve'),
    ('dell-u2723qe', 'UltraSharp U2723QE', 'Dell', 'Dell''s UltraSharp U2723QE is a 27-inch 4K USB-C hub monitor with IPS Black technology, sharp color, and dock-style connectivity for desk setups and editing workstations.', 'https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/u-series/u2723qe/media-gallery/monitor-u2723qe-gallery-3.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=872&qlt=100,1&resMode=sharp2&size=872,804&chrss=full', 'https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-usb-c-hub-monitor-u2723qe/apd/210-bdpf/monitors-monitor-accessories', 'https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-usb-c-hub-monitor-u2723qe/apd/210-bdpf/monitors-monitor-accessories', 'https://www.dell.com/en-us/shop/dell-ultrasharp-27-4k-usb-c-hub-monitor-u2723qe/apd/210-bdpf/monitors-monitor-accessories'),
    ('descript', 'Descript', 'Descript', 'Descript makes editing video and audio as easy as editing text. Record, transcribe, edit, and publish in one tool. Try for free, with powerful upgrades for creators & teams.', 'https://cdn.builder.io/api/v1/image/assets%2Ffcea5005d671451e9b07839c893228d0%2Fb1cf2c175fbe4a028dff4622ee1ce727', 'https://www.descript.com/', 'https://www.descript.com/', 'https://www.descript.com/'),
    ('dji-mic-2', 'Mic 2', 'DJI', 'DJI Mic 2 is a compact wireless microphone system with onboard recording, intelligent noise reduction, and reliable two-person capture for interviews and creator video kits.', 'https://www-cdn.djiits.com/cms/uploads/6e61a4668dd5cca507484a47a1260521@374*374.png', 'https://www.dji.com/mic-2', 'https://www.dji.com/mic-2', 'https://www.dji.com/mic-2'),
    ('dji-mini-4-pro', 'Mini 4 Pro', 'DJI', 'Mini 4 Pro is DJI''s lightweight drone with obstacle sensing and stabilized 4K capture for travel, property, and creator aerial work.', 'https://www-cdn.djiits.com/cms/uploads/892e39b4b76dc5a83b267ed12ce69b97@374*374.png', 'https://www.dji.com/mini-4-pro', 'https://www.dji.com/mini-4-pro', 'https://www.dji.com/mini-4-pro'),
    ('dji-osmo-pocket-3', 'Osmo Pocket 3', 'DJI', 'Osmo Pocket 3 is DJI''s stabilized pocket camera with a 1-inch sensor, rotating touchscreen, and fast start-up for vlogging, travel, and handheld b-roll capture.', 'https://www-cdn.djiits.com/cms/uploads/8c6ec9b0dc4e170120dfd4ebf9f0ffd6@374*374.png', 'https://www.dji.com/osmo-pocket-3', 'https://www.dji.com/osmo-pocket-3', 'https://www.dji.com/osmo-pocket-3'),
    ('elgato-cam-link-4k', 'Cam Link 4K', 'Elgato', 'Cam Link 4K turns a camera into a clean webcam or stream source, making higher-end capture easy for video calls, live shows, and tutorials.', 'https://images.ctfassets.net/h50kqpe25yx1/6vG5larqfHUJeWz08DnWf3/932b4dd49246785bfb27402d7a6cd9d5/Cam_Link_4k.jpg', 'https://www.elgato.com/us/en/p/cam-link-4k', 'https://www.elgato.com/us/en/p/cam-link-4k', 'https://www.elgato.com/us/en/p/cam-link-4k'),
    ('elgato-facecam-pro', 'Facecam Pro', 'Elgato', 'Facecam Pro is Elgato''s flagship 4K webcam with a larger Sony sensor, manual controls, and high-detail capture for creator desks, remote production, and streaming.', 'https://images.ctfassets.net/h50kqpe25yx1/6c9X3K1j89Jfs4ifY5g5IS/4e92d99af2eead834e07bce77e820a1d/facecam-pro.jpg', 'https://www.elgato.com/us/en/p/facecam-pro', 'https://www.elgato.com/us/en/p/facecam-pro', 'https://www.elgato.com/us/en/p/facecam-pro'),
    ('elgato-stream-deck-mk2', 'Stream Deck MK.2', 'Elgato', 'Stream Deck MK.2 gives creators programmable keys for live control, shortcuts, and workflow automation across recording, editing, and streaming setups.', 'https://images.ctfassets.net/h50kqpe25yx1/7Cwo01eNtXbhr1fsum2248/28c5f862966fa0c48353d3a80ff33c99/Stream-Deck-Social-Graph.jpg', 'https://www.elgato.com/us/en/p/stream-deck', 'https://www.elgato.com/us/en/p/stream-deck', 'https://www.elgato.com/us/en/p/stream-deck'),
    ('elgato-wave-3', 'Wave:3', 'Elgato', 'Wave:3 is a USB condenser microphone tuned for streaming, voiceover, and desk recordings, with onboard control and Elgato Wave Link integration.', 'https://images.ctfassets.net/h50kqpe25yx1/sQ05quBdMBremHxGG4s7S/f06b910c6f9491e2a8bef93357dfa516/Wave3-Open-Graph.png', 'https://www.elgato.com/us/en/p/wave-3', 'https://www.elgato.com/us/en/p/wave-3', 'https://www.elgato.com/us/en/p/wave-3'),
    ('figma', 'Figma', 'Figma', 'Figma is the leading collaborative design platform for building meaningful products. Design, prototype, and build products faster—while gathering feedback all in one place.', 'https://cdn.sanity.io/images/599r6htc/regionalized/342e17642c7afa81206490b0dd21c3e5724ae040-2400x1260.png?w=1200&q=70&fit=max&auto=format', 'https://www.figma.com/', 'https://www.figma.com/', 'https://www.figma.com/'),
    ('final-cut-pro', 'Final Cut Pro', 'Apple', 'Final Cut Pro is packed with powerful intelligence features, making pro-quality video creation and editing easy on your Mac and iPad.', 'https://www.apple.com/v/final-cut-pro/w/images/meta/final_cut__cumj84xteas2_og.png?202603241546', 'https://www.apple.com/final-cut-pro/', 'https://www.apple.com/final-cut-pro/', 'https://www.apple.com/final-cut-pro/'),
    ('focusrite-scarlett-2i2', 'Scarlett 2i2 4th Gen', 'Focusrite', 'The original studio-quality 2-in, 2-out interface, Focusrite Scarlett 2i2, has been remastered for the artist.', 'https://cdn11.bigcommerce.com/s-7exlzlf13h/products/307/images/785/scarlett-2i2-top-image-2400-2400__78159.1693324453.386.513.png?c=3', 'https://us.focusrite.com/products/scarlett-2i2', 'https://us.focusrite.com/products/scarlett-2i2', 'https://us.focusrite.com/products/scarlett-2i2'),
    ('focusrite-scarlett-solo-4th-gen', 'Scarlett Solo 4th Gen', 'Focusrite', 'Scarlett Solo 4th Gen is a compact 2-in/2-out interface for vocals, instruments, and desk recording with Focusrite''s updated preamp design.', 'https://cdn11.bigcommerce.com/s-7exlzlf13h/products/304/images/807/scarlett-solo-4g__93789.1711664540.386.513.png?c=3', 'https://us.focusrite.com/products/scarlett-solo', 'https://us.focusrite.com/products/scarlett-solo', 'https://us.focusrite.com/products/scarlett-solo'),
    ('framer', 'Framer', 'Framer', 'Framer is a site builder and prototyping platform for publishing interactive marketing pages and product experiences quickly.', 'https://framerusercontent.com/images/yyBL8MFizGZKUd27rQGHp30fyc.jpg', 'https://www.framer.com/', 'https://www.framer.com/', 'https://www.framer.com/'),
    ('fujifilm-x100vi', 'X100VI', 'Fujifilm', 'X100VI is Fujifilm''s premium fixed-lens compact camera, pairing a 40MP APS-C sensor with classic controls and in-body stabilization for everyday carry photography.', 'https://www.fujifilm-x.com/products-cameras-static/x100vi/assets/images/top/sageabe_device_img_03.png', 'https://fujifilm-x.com/en-us/products/cameras/x100vi/', 'https://fujifilm-x.com/en-us/products/cameras/x100vi/', 'https://www.fujifilm-x.com/en-us/products/cameras/x100vi/'),
    ('gopro-hero12', 'HERO12 Black', 'GoPro', 'HERO12 Black is GoPro''s flagship action camera with rugged waterproof hardware, HyperSmooth stabilization, and long-form capture for POV and travel workflows.', 'https://static.gopro.com/assets/blta2b8522e5372af40/blt3e1d69abee0b4203/6659dac7d036b23b240097f8/01-pdp-h12b-gallery-v2-1920.jpg?width=3840&quality=80&auto=webp&disable=upscale', 'https://gopro.com/en/us/shop/cameras/hero12-black/CHDHX-121-master.html', 'https://gopro.com/en/us/shop/cameras/hero12-black/CHDHX-121-master.html', 'https://gopro.com/en/us/shop/cameras/hero12-black/CHDHX-121-master.html'),
    ('insta360-link-2', 'Insta360 Link 2', 'Insta360', 'Insta360 Link 2 is a 4K AI webcam with intelligent framing, strong low-light performance, and pro-level audio aimed at streaming, calls, and creator desks.', 'https://res.insta360.com/static/4e0d93be46a8714eead3c5478287a033/KV_@1440.jpg', 'https://www.insta360.com/product/insta360-link2', 'https://www.insta360.com/product/insta360-link2', 'https://www.insta360.com/product/insta360-link2'),
    ('ipad-pro-13', 'iPad Pro 13-inch', 'Apple', 'iPad Pro features the M5 chip with Apple Intelligence, all-day battery life, 11-inch or 13-inch display, Wi-Fi 7, 5G, and Apple Pencil Pro support.', 'https://www.apple.com/v/ipad-pro/aw/images/meta/ipad-pro_overview__bu4cql27diaa_og.png?202603241546', 'https://www.apple.com/ipad-pro/', 'https://www.apple.com/ipad-pro/', 'https://www.apple.com/ipad-pro/'),
    ('key-light-air', 'Key Light Air', 'Elgato', 'Elgato Key Light Air is a freestanding Wi-Fi enabled lighting panel with 80 premium OSRAM LEDs outputting 1400 lumens for professional studio applications. Use the Control Center app to switch on/off, adjust brightnes...', 'https://images.ctfassets.net/h50kqpe25yx1/d1F24lEMtXFK8iHUKaIBL/c02f709b704f2467021e17ec115856d0/key-light-air.jpg', 'https://www.elgato.com/us/en/p/key-light-air', 'https://www.elgato.com/us/en/p/key-light-air', 'https://www.elgato.com/us/en/p/key-light-air'),
    ('keychron-k8-pro', 'K8 Pro', 'Keychron', 'Keychron K8 Pro QMK/VIA Wireless Mechanical Keyboard. Supports out-of-the-box QMK/VIA. Wireless or Wired. Hot swap every switch in a breeze with the hot-swappable feature. Compatible with Mac, Windows, iOS, Android, L...', 'https://www.keychron.com/cdn/shop/products/Keychron-K8-Pro-QMK-VIA-Wireless-Mechanical-Keyboard-for-Mac-Windows-PBT-keycaps-B-PCB-screw-in-stabilizer-hot-swappable-Gateron-G-Pro-mechanical-red-switch.jpg?crop=center&height=1200&v=1666259691&width=1200', 'https://www.keychron.com/products/keychron-k8-pro-qmk-via-wireless-mechanical-keyboard', 'https://www.keychron.com/products/keychron-k8-pro-qmk-via-wireless-mechanical-keyboard', 'https://www.keychron.com/products/keychron-k8-pro-qmk-via-wireless-mechanical-keyboard'),
    ('keychron-q1-max', 'Q1 Max', 'Keychron', 'Q1 Max is Keychron''s aluminum wireless mechanical keyboard with QMK/VIA support, hot-swappable switches, and a denser 75% layout.', 'https://www.keychron.com/cdn/shop/files/Q1-Max-Iconic-Features.jpg?crop=center&height=1200&v=1754276986&width=1200', 'https://www.keychron.com/products/keychron-q1-max-qmk-via-wireless-custom-mechanical-keyboard', 'https://www.keychron.com/products/keychron-q1-max-qmk-via-wireless-custom-mechanical-keyboard', 'https://www.keychron.com/products/keychron-q1-max-qmk-via-wireless-custom-mechanical-keyboard'),
    ('kobo-libra-colour', 'Kobo Libra Colour', 'Kobo', 'Kobo Libra Colour is a 7-inch color E Ink reader built for reading, markup, and note-taking with physical page buttons and stylus support.', 'https://us.kobobooks.com/cdn/shop/files/1-Dual_Device-EN_1080x1080_23353059-2418-4cf9-bff3-799e6a966f95_1200x1200.png?v=1758123115', 'https://us.kobobooks.com/products/kobo-libra-colour', 'https://us.kobobooks.com/products/kobo-libra-colour', 'https://us.kobobooks.com/products/kobo-libra-colour'),
    ('logitech-brio-4k', 'Brio 4K Webcam', 'Logitech', 'Shop Brio Webcam. Step up to the world’s most technologically advanced webcam. Logitech BRIO delivers 4K Ultra HD video with 5X zoom, and RightLight 3 with HDR', 'https://resource.logitech.com/w_1200,h_630,c_limit,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/webcams/brio/brio-og-image-new.jpg?v=1', 'https://www.logitech.com/en-us/products/webcams/brio-4k-hdr-webcam.html', 'https://www.logitech.com/en-us/products/webcams/brio-4k-hdr-webcam.html', 'https://www.logitech.com/en-us/products/webcams/brio-4k-hdr-webcam.html'),
    ('logitech-brio-500', 'Brio 500', 'Logitech', 'Brio 500 is a Full HD webcam with auto light correction, noise-reducing mics, and framing tools for calls, streams, and creator desks.', 'https://resource.logitech.com/c_fill,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/webcams/brio-500/gallery/brio-500-gallery-graphite-1.png', 'https://www.logitech.com/en-us/products/webcams/brio-500-webcam.960-001422.html', 'https://www.logitech.com/en-us/products/webcams/brio-500-webcam.960-001422.html', 'https://www.logitech.com/en-us/shop/p/brio-500-webcam'),
    ('logitech-litra-glow', 'Litra Glow', 'Logitech', 'Litra Glow is Logitech''s compact desktop light for video calls, streams, and desk setups, built to deliver soft front light without taking up much space.', 'https://resource.logitech.com/c_fill,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/lighting/litra-glow/gallery/litra-glow-streaming-light-front-view-graphite.png', 'https://www.logitech.com/en-us/products/lighting/litra-glow.946-000001.html', 'https://www.logitech.com/en-us/products/lighting/litra-glow.946-000001.html', 'https://www.logitech.com/en-us/shop/p/litra-glow'),
    ('logitech-mx-keys-s', 'MX Keys S', 'Logitech', 'MX Keys S is Logitech''s full-size low-profile keyboard with smart illumination, multi-device pairing, and a clean layout for daily desk work.', 'https://resource.logitech.com/c_fill,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/keyboards/mx-keys-s/migration-assets-for-delorean-2025/gallery/mx-keys-s-top-view-graphite-us.png', 'https://www.logitech.com/en-us/products/keyboards/mx-keys-s.920-011559.html', 'https://www.logitech.com/en-us/products/keyboards/mx-keys-s.920-011559.html', 'https://www.logitech.com/en-us/shop/p/mx-keys-s'),
    ('mac-mini-m4', 'Mac mini', 'Apple', 'Mac mini packs Apple silicon performance into a compact desktop for coding, editing, streaming, and creator workstation setups.', 'https://www.apple.com/v/mac-mini/aa/images/meta/mac-mini__dvce2jrm11w2_og.jpg?202601201341', 'https://www.apple.com/mac-mini/', 'https://www.apple.com/mac-mini/', 'https://www.apple.com/mac-mini/'),
    ('macbook-pro-14', 'MacBook Pro 14"', 'Apple', 'Find the best MacBook Pro for you with the M5, M5 Pro, or M5 Max chip. Built for AI. Up to 24 hours of battery life. Liquid Retina XDR display.', 'https://www.apple.com/v/macbook-pro/ax/images/meta/macbook-pro__difvbgz1plsi_og.png?202603261117', 'https://www.apple.com/macbook-pro/', 'https://www.apple.com/macbook-pro/', 'https://www.apple.com/macbook-pro/'),
    ('mx-master-3s', 'MX Master 3S', 'Logitech', 'MX Master 3S is Logitech''s flagship productivity mouse with quiet clicks, MagSpeed scrolling, and precision tracking for multi-device desk workflows.', 'https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_2.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/2025-update/mx-master-3s-bluetooth-edition-top-view-black-new-1.png', 'https://www.logitech.com/en-us/shop/p/mx-master-3s', 'https://www.logitech.com/en-us/shop/p/mx-master-3s', 'https://www.logitech.com/en-us/shop/p/mx-master-3s'),
    ('notion', 'Notion', 'Notion', 'Build Custom Agents, search across all your apps, and automate busywork. The AI workspace where teams get more done, faster.', 'https://www.notion.com/front-static/meta/custom-agents-og.png', 'https://www.notion.com/', 'https://www.notion.com/', 'https://www.notion.com/'),
    ('obs-studio', 'OBS Studio', 'OBS Project', 'OBS Studio is free, open-source software for recording and live streaming, with scene control, audio routing, and broadcaster-grade output workflows.', 'https://obsproject.com/assets/images/features-new/hero.png', 'https://obsproject.com/', 'https://obsproject.com/', 'https://obsproject.com/'),
    ('owc-envoy-pro-fx', 'Envoy Pro FX', 'OWC', 'Envoy Pro FX is OWC''s rugged Thunderbolt and USB-C SSD, built for fast offloads, portable editing, and creator travel workflows across Mac and PC.', 'https://media.owcnow.com/image/upload/w_1200,q_70,f_auto/envoy-pro-fx-hero-right', 'https://eshop.macsales.com/shop/owc-envoy-pro-fx', 'https://eshop.macsales.com/shop/owc-envoy-pro-fx', 'https://eshop.macsales.com/shop/owc-envoy-pro-fx'),
    ('premiere-pro', 'Premiere Pro', 'Adobe', 'Adobe Premiere is professional video editing software for cutting footage, color work, audio mixing, and polished post-production across creator and studio workflows.', 'https://www.adobe.com/cc-shared/fragments/products/premiere/media_13231f4af57fd65bb780d691fc842fe044a428c23.png?width=2000&format=webply&optimize=medium', 'https://www.adobe.com/products/premiere.html', 'https://www.adobe.com/products/premiere.html', 'https://www.adobe.com/products/premiere.html'),
    ('raycast', 'Raycast', 'Raycast', 'Raycast is a keyboard-first launcher for command execution, search, snippets, clipboard history, and workflow extensions on macOS.', 'https://www.raycast.com/opengraph-image-pwu6ef.png?7385e23163a01717', 'https://www.raycast.com/', 'https://www.raycast.com/', 'https://www.raycast.com/index'),
    ('rode-podmic-usb', 'PodMic USB', 'Rode', 'PodMic USB is a dynamic broadcast microphone with both XLR and USB connectivity for flexible podcast, stream, and creator setups.', 'https://edge.rode.com//images/products/variants/183/rode-podmic-usb-black-hero-3-quater-tilted-4000x4000-rgb-2000x2000-064a3d6.png', 'https://rode.com/en-us/microphones/usb/podmic-usb', 'https://rode.com/en-us/microphones/usb/podmic-usb', 'https://rode.com/en-us/products/podmic-usb'),
    ('rode-videomic', 'VideoMic Pro+', 'Rode', 'The RØDE VideoMic Pro+ is ideal for filmmakers looking for a flexible and feature-packed on-camera microphone. Find out more.', 'https://edge.rode.com//images/page/128/modules/4092/RØDE_VideoMic_Pro+_3_QUARTER_LEFT_FRONT_1080x1080.png', 'https://rode.com/en-au/products/videomic-pro-plus', 'https://rode.com/en-au/products/videomic-pro-plus', 'https://rode.com/en-au/products/videomic-pro-plus'),
    ('rode-wireless-pro', 'Wireless PRO', 'Rode', 'Wireless PRO is RODE''s pro-grade compact wireless system with 32-bit float onboard recording, timecode, and dual-transmitter capture for serious video kits.', 'https://edge.rode.com//images/page/2207/modules/8803/rode-wireless-pro-hero-three-quarter-4000x4000-rgb-1080x1080-f521e30.png', 'https://rode.com/en-us/microphones/wireless/wirelesspro', 'https://rode.com/en-us/microphones/wireless/wirelesspro', 'https://rode.com/en-us/products/wireless-pro'),
    ('samsung-t9-portable-ssd', 'Portable SSD T9', 'Samsung', 'Portable SSD T9 is Samsung''s high-speed external SSD for large media transfers, edit-from-drive workflows, and reliable portable storage on creator desks and travel kits.', 'https://images.samsung.com/is/image/samsung/p6pim/us/mu-pg1t0b-am/gallery/us-portable-ssd-t9-mu-pg1t0b-am-550971186?$product-details-jpg$', 'https://www.samsung.com/us/memory-storage/portable-ssd/portable-ssd-t9-usb-3-2-1tb-black-sku-mu-pg1t0b-am/', 'https://www.samsung.com/us/memory-storage/portable-ssd/portable-ssd-t9-usb-3-2-1tb-black-sku-mu-pg1t0b-am/', 'https://www.samsung.com/us/memory-storage/portable-ssd/portable-ssd-t9-usb-3-2-1tb-black-sku-mu-pg1t0b-am/'),
    ('sandisk-extreme-ssd', 'Extreme Portable SSD', 'SanDisk', 'The SanDisk Extreme Portable SSD is a compact external SSD built for fast file movement, on-the-go editing, and rugged creator workflows across devices.', 'https://www.sandisk.com/content/dam/store/en-us/assets/products/usb-flash-drives/extreme-usb-3-2-ssd/gallery/extreme-usb-3-2-ssd-front.png.wdthumb.1280.1280.webp', 'https://www.sandisk.com/products/ssd/external-ssd/portable-ssd-sandisk-extreme-usb-3-2?sku=SDSSDE61-500G-G25', 'https://www.sandisk.com/products/ssd/external-ssd/portable-ssd-sandisk-extreme-usb-3-2?sku=SDSSDE61-500G-G25', 'https://www.sandisk.com/products/ssd/external-ssd/portable-ssd-sandisk-extreme-usb-3-2?sku=SDSSDE61-500G-G25'),
    ('shure-mv7-plus', 'MV7+', 'Shure', 'MV7+ is Shure''s hybrid XLR/USB dynamic microphone for podcasters, streamers, and voice work, with onboard DSP and strong speech presence.', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/0a5/4f1/be-/setcard/fe71d068e73acc951e1c9a0458a7093c.jpeg', 'https://www.shure.com/en-US/products/microphones/mv7?variant=MV7%252B-K', 'https://www.shure.com/en-US/products/microphones/mv7?variant=MV7%252B-K', 'https://www.shure.com/en-us/products/microphones/mv7'),
    ('shure-sm7b', 'SM7B', 'Shure', 'The Shure SM7B is the iconic dynamic vocal microphone you''ve already heard. It is perfect for professional podcasters, streamers, and vocalists alike.', 'https://products.shureweb.eu/shure_product_db/product_main_images/files/7e1/bf6/ed-/setcard/721ed7ee412b45897688a7b5acdefa44.jpeg', 'https://www.shure.com/en-us/products/microphones/sm7b', 'https://www.shure.com/en-us/products/microphones/sm7b', 'https://www.shure.com/en-us/products/microphones/sm7b'),
    ('sigma-24-70-f28', '24-70mm F2.8 DG DN Art', 'Sigma', 'Sigma''s 24-70mm F2.8 DG DN Art is a fast standard zoom lens for full-frame mirrorless systems, built for versatile shooting across portrait, event, and video work.', 'https://www.sigma-global.com/lenses/a019_24_70_28_product_img01.png', 'https://www.sigma-global.com/en/lenses/a019_24_70_28/', 'https://www.sigma-global.com/en/lenses/a019_24_70_28/', 'https://www.sigma-global.com/en/lenses/a019_24_70_28/'),
    ('sony-a7iv', 'Alpha 7 IV', 'Sony', 'Sony''s Alpha 7 IV is a full-frame hybrid camera that balances high-resolution stills, strong autofocus, and 4K video for modern creator workflows.', 'https://d1ncau8tqf99kp.cloudfront.net/converted/92650_original_local_1200x1050_v3_converted.webp', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7m4-b', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7m4-b', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7m4-b'),
    ('sony-fe-24-70-gm-ii', 'FE 24-70mm F2.8 GM II', 'Sony', 'FE 24-70mm F2.8 GM II is Sony''s flagship standard zoom for hybrid shooters who need one fast lens across studio, event, and travel work.', 'https://d1ncau8tqf99kp.cloudfront.net/converted/102462_original_local_1200x1050_v3_converted.webp', 'https://electronics.sony.com/imaging/lenses/all-e-mount/p/sel2470gm2', 'https://electronics.sony.com/imaging/lenses/all-e-mount/p/sel2470gm2', 'https://electronics.sony.com/imaging/lenses/all-e-mount/p/sel2470gm2'),
    ('sony-fx3', 'FX3', 'Sony', 'FX3 is Sony''s compact full-frame Cinema Line camera, designed for handheld filmmaking with strong low-light performance, 4K capture, and pro video controls.', 'https://d1ncau8tqf99kp.cloudfront.net/converted/128744_original_local_1200x1050_v3_converted.webp', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilmefx3a', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilmefx3a', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilmefx3a'),
    ('sony-wh1000xm5', 'WH-1000XM5', 'Sony', 'Sony''s WH-1000XM5 headphones combine premium noise cancellation, strong call quality, and long battery life for focused work and travel listening.', 'https://d1ncau8tqf99kp.cloudfront.net/converted/103364_original_local_1200x1050_v3_converted.webp', 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b', 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b', 'https://electronics.sony.com/audio/headphones/headband/p/wh1000xm5-b'),
    ('sony-zv-e1', 'ZV-E1', 'Sony', 'ZV-E1 is Sony''s full-frame creator camera tuned for solo shooting, autofocus-heavy video, and compact studio or travel production.', 'https://d1ncau8tqf99kp.cloudfront.net/converted/102462_original_local_1200x1050_v3_converted.webp', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/full-frame/p/ilcezve1-b', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/full-frame/p/ilcezve1-b', 'https://electronics.sony.com/imaging/interchangeable-lens-cameras/full-frame/p/ilcezve1-b')
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
  and c.slug in ('creator-desk-kit', 'video-starter-kit', 'broadcast-desk-rig', 'solo-video-studio', 'travel-creator-bag', 'reading-and-research-kit', 'remote-podcast-rig');

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
    ('video-starter-kit', 'key-light-air', 3, 'Lighting'),
    ('broadcast-desk-rig', 'mac-mini-m4', 1, 'Quiet desktop for capture, edits, and admin work'),
    ('broadcast-desk-rig', 'apple-studio-display', 2, 'Main reference display'),
    ('broadcast-desk-rig', 'mx-master-3s', 3, 'Primary control mouse'),
    ('broadcast-desk-rig', 'logitech-mx-keys-s', 4, 'Full-size keyboard for long sessions'),
    ('broadcast-desk-rig', 'elgato-stream-deck-mk2', 5, 'Scene and shortcut control'),
    ('broadcast-desk-rig', 'logitech-brio-500', 6, 'Fast webcam for calls and live check-ins'),
    ('broadcast-desk-rig', 'shure-mv7-plus', 7, 'Primary voice mic'),
    ('solo-video-studio', 'sony-fx3', 1, 'Main cinema body'),
    ('solo-video-studio', 'sony-fe-24-70-gm-ii', 2, 'Flexible standard zoom'),
    ('solo-video-studio', 'rode-wireless-pro', 3, 'Wireless dialog capture'),
    ('solo-video-studio', 'dji-mic-2', 4, 'Backup wireless audio'),
    ('solo-video-studio', 'amaran-200x-s', 5, 'Key light for interviews'),
    ('solo-video-studio', 'samsung-t9-portable-ssd', 6, 'Fast media offload drive'),
    ('travel-creator-bag', 'dji-mini-4-pro', 1, 'Aerial capture'),
    ('travel-creator-bag', 'dji-osmo-pocket-3', 2, 'Pocket camera for walking footage'),
    ('travel-creator-bag', 'owc-envoy-pro-fx', 3, 'Portable project drive'),
    ('travel-creator-bag', 'airpods-pro-2', 4, 'Monitoring and flights'),
    ('travel-creator-bag', 'insta360-link-2', 5, 'Compact webcam for remote calls'),
    ('reading-and-research-kit', 'boox-palma-2', 1, 'Pocket reading device'),
    ('reading-and-research-kit', 'kobo-libra-colour', 2, 'Long-form reading and annotations'),
    ('reading-and-research-kit', 'airpods-max', 3, 'Noise isolation for focus'),
    ('reading-and-research-kit', 'notion', 4, 'Research database and notes'),
    ('reading-and-research-kit', 'raycast', 5, 'Quick capture and search'),
    ('remote-podcast-rig', 'shure-sm7b', 1, 'Primary spoken-word mic'),
    ('remote-podcast-rig', 'focusrite-scarlett-solo-4th-gen', 2, 'Simple interface for one-person recording'),
    ('remote-podcast-rig', 'sony-wh1000xm5', 3, 'Closed-back monitoring'),
    ('remote-podcast-rig', 'caldigit-ts4', 4, 'Dock for storage, backup, and peripherals'),
    ('remote-podcast-rig', 'rode-podmic-usb', 5, 'Secondary podcast mic'),
    ('remote-podcast-rig', 'descript', 6, 'Remote edit and transcript workflow')
) as v(collection_slug, product_slug, sort_order, note)
join public.collections c on c.slug = v.collection_slug
join public.products p on p.slug = v.product_slug
on conflict (collection_id, product_id) do update
set
  sort_order = excluded.sort_order,
  note = excluded.note;

commit;
