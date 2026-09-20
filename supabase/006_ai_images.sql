begin;
delete from public.dress_360_frames;
delete from public.dress_images where dress_id in (select id from public.dresses where code = 'RENAD-045');
insert into public.dress_images (dress_id, url, sort_order, alt)
select id, u.url, u.ord, u.alt from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-045/img-0.jpg', 0, 'من الأمام'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-045/img-1.jpg', 1, 'من الجانب'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-045/img-2.jpg', 2, 'من الخلف'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-045/img-3.jpg', 3, 'تفاصيل القماش')) as u(url, ord, alt)
where public.dresses.code = 'RENAD-045';
update public.dresses set cover_image = 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-045/img-0.jpg' where code = 'RENAD-045';
delete from public.dress_images where dress_id in (select id from public.dresses where code = 'RENAD-018');
insert into public.dress_images (dress_id, url, sort_order, alt)
select id, u.url, u.ord, u.alt from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-018/img-0.jpg', 0, 'من الأمام'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-018/img-1.jpg', 1, 'من الجانب'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-018/img-2.jpg', 2, 'من الخلف'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-018/img-3.jpg', 3, 'تفاصيل القماش')) as u(url, ord, alt)
where public.dresses.code = 'RENAD-018';
update public.dresses set cover_image = 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-018/img-0.jpg' where code = 'RENAD-018';
delete from public.dress_images where dress_id in (select id from public.dresses where code = 'RENAD-052');
insert into public.dress_images (dress_id, url, sort_order, alt)
select id, u.url, u.ord, u.alt from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-052/img-0.jpg', 0, 'من الأمام'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-052/img-1.jpg', 1, 'من الجانب'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-052/img-2.jpg', 2, 'من الخلف'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-052/img-3.jpg', 3, 'تفاصيل القماش')) as u(url, ord, alt)
where public.dresses.code = 'RENAD-052';
update public.dresses set cover_image = 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-052/img-0.jpg' where code = 'RENAD-052';
delete from public.dress_images where dress_id in (select id from public.dresses where code = 'RENAD-007');
insert into public.dress_images (dress_id, url, sort_order, alt)
select id, u.url, u.ord, u.alt from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-007/img-0.jpg', 0, 'من الأمام'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-007/img-1.jpg', 1, 'من الجانب'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-007/img-2.jpg', 2, 'من الخلف'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-007/img-3.jpg', 3, 'تفاصيل القماش')) as u(url, ord, alt)
where public.dresses.code = 'RENAD-007';
update public.dresses set cover_image = 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-007/img-0.jpg' where code = 'RENAD-007';
delete from public.dress_images where dress_id in (select id from public.dresses where code = 'RENAD-036');
insert into public.dress_images (dress_id, url, sort_order, alt)
select id, u.url, u.ord, u.alt from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-036/img-0.jpg', 0, 'من الأمام'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-036/img-1.jpg', 1, 'من الجانب'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-036/img-2.jpg', 2, 'من الخلف'), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-036/img-3.jpg', 3, 'تفاصيل القماش')) as u(url, ord, alt)
where public.dresses.code = 'RENAD-036';
update public.dresses set cover_image = 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-036/img-0.jpg' where code = 'RENAD-036';
update public.business_settings set hero_image = 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/hero-images/hero/hero.jpg' where id = 1;
commit;
