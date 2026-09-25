-- تنظيف بيانات الاختبار
delete from public.point_transactions where user_id = '50931fec-bc2f-4c87-b5b0-0cbeaf2c21f7';
delete from public.loyalty_points where user_id = '50931fec-bc2f-4c87-b5b0-0cbeaf2c21f7';
select 'clean' as done;
