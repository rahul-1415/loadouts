select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'product_submissions'
order by ordinal_position;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'collection_product_submissions'
order by ordinal_position;

select count(*) as pending_product_submission_count
from public.product_submissions
where review_status = 'pending';

select id, name, brand, review_status, created_at
from public.product_submissions
order by created_at desc
limit 10;

select collection_id, product_submission_id, sort_order, note
from public.collection_product_submissions
order by created_at desc
limit 10;
