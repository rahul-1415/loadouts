-- 1) Users missing profile rows
select count(*) as auth_users_missing_profile
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 2) Profiles missing required username/display name
select count(*) as incomplete_profiles
from public.profiles
where handle is null
   or trim(handle::text) = ''
   or display_name is null
   or trim(display_name) = '';

-- 3) Handles violating lowercase rule (expected: 0)
select id, handle
from public.profiles
where handle::text <> lower(handle::text)
order by created_at desc
limit 20;

-- 4) Follow integrity checks
select count(*) as self_follow_rows
from public.follows
where follower_id = following_id;

-- 5) Sample follower counts
select
  p.handle,
  coalesce(follower_counts.count, 0) as followers,
  coalesce(following_counts.count, 0) as following
from public.profiles p
left join (
  select following_id, count(*)::int as count
  from public.follows
  group by following_id
) follower_counts on follower_counts.following_id = p.id
left join (
  select follower_id, count(*)::int as count
  from public.follows
  group by follower_id
) following_counts on following_counts.follower_id = p.id
order by followers desc, following desc
limit 20;
