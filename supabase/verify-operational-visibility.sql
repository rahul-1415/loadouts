-- 1) Check that the table exists
select to_regclass('public.operational_events') as operational_events_table;

-- 2) Recent event counts by status
select status, count(*) as total
from public.operational_events
group by status
order by status;

-- 3) Latest events for spot checking
select user_id, event_name, status, context, metadata, created_at
from public.operational_events
order by created_at desc
limit 20;
