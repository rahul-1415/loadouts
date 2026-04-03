select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'collections'
  and column_name in ('layout_mode', 'body_layout', 'body_layout_updated_at')
order by column_name;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.collections'::regclass
  and conname = 'collections_layout_mode_check';

select layout_mode, count(*) as loadout_count
from public.collections
where kind = 'loadout'
group by layout_mode
order by layout_mode;
