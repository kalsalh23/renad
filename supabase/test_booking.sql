-- اختبار مؤقت لنظام الحجز: إدخال ثم فحص الإشعار ثم حذف
insert into public.appointments (customer_name, phone, dress_code, appointment_date, appointment_time)
values ('اختبار النظام', '0999000000', 'RENAD-036', current_date + 3, '12:00');
select count(*) as notif_created from public.notifications where audience = 'admin';
delete from public.notifications where appointment_id in (select id from public.appointments where phone = '0999000000');
delete from public.appointments where phone = '0999000000';
select count(*) as remaining from public.appointments where phone = '0999000000';
