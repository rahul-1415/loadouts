-- 1) Detect duplicate notifications by uniqueness key (expected: 0 rows)
select
  recipient_id,
  actor_id,
  type,
  entity_type,
  coalesce(entity_id::text, '') as entity_key,
  count(*) as duplicate_count
from public.notifications
group by 1, 2, 3, 4, 5
having count(*) > 1
order by duplicate_count desc;

-- 2) Count analytics events by milestone
select
  event_name,
  count(*) as event_count
from public.analytics_events
group by event_name
order by event_name;

-- 3) Sample latest analytics rows
select
  user_id,
  event_name,
  metadata,
  created_at
from public.analytics_events
order by created_at desc
limit 20;
