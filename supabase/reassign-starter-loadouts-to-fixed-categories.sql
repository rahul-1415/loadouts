begin;

-- Move "Creator Desk Kit" to Desk Setups (cat-013).
update public.collections as c
set category_id = desk.id
from public.categories as desk
where c.slug = 'creator-desk-kit'
  and desk.slug = 'cat-013';

-- Move "Video Starter Kit" to Cameras (cat-009).
update public.collections as c
set category_id = cameras.id
from public.categories as cameras
where c.slug = 'video-starter-kit'
  and cameras.slug = 'cat-009';

-- Keep only fixed A-Z categories active.
update public.categories
set is_active = false
where is_active = true
  and slug !~* '^cat-(00[1-9]|0[1-9][0-9]|100)$';

commit;
