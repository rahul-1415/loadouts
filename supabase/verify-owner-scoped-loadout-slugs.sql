select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'collections'
  and indexname in ('collections_slug_key', 'collections_owner_slug_key')
order by indexname;

select owner_id, slug, count(*) as duplicate_count
from public.collections
group by owner_id, slug
having count(*) > 1
order by duplicate_count desc, slug;
