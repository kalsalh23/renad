-- تحديث معلومات التواصل
update public.business_settings
set phone = '0942577858', whatsapp_number = '963942577858'
where id = 1;
select phone, whatsapp_number from public.business_settings where id = 1;
