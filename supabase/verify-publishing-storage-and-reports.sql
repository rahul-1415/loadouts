select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'collections'
  and column_name in ('status', 'published_at', 'archived_at')
order by column_name;

select count(*) as report_count from public.reports;

select id, entity_type, status, created_at
from public.reports
order by created_at desc
limit 10;

select id, name, public
from storage.buckets
where id = 'media';
