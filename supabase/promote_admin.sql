update public.profiles set role = 'admin', full_name = 'إدارة ريناد' where email = 'admin@renad.app';
select id, email, role from public.profiles;
