-- 1) Active category count (expected: 100)
select count(*) as active_category_count
from public.categories
where is_active = true;

-- 2) Active categories with non-null image URL (expected: 100)
select count(*) as active_categories_with_image
from public.categories
where is_active = true
  and cover_image_url is not null
  and trim(cover_image_url) <> '';

-- 3) Any active categories missing image URL (expected: 0 rows)
select slug, title
from public.categories
where is_active = true
  and (cover_image_url is null or trim(cover_image_url) = '')
order by slug;

-- 4) Sample image metadata for spot check
select slug, title, cover_image_url, cover_image_source_url
from public.categories
where is_active = true
order by slug
limit 12;
