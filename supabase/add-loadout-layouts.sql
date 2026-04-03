begin;

alter table public.collections
  add column if not exists layout_mode text not null default 'standard';

update public.collections
set layout_mode = 'standard'
where layout_mode is null;

alter table public.collections
  add column if not exists body_layout jsonb;

alter table public.collections
  add column if not exists body_layout_updated_at timestamptz;

alter table public.collections
  drop constraint if exists collections_layout_mode_check;

alter table public.collections
  add constraint collections_layout_mode_check
  check (layout_mode in ('standard', 'custom'));

commit;
