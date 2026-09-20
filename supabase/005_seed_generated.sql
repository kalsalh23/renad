begin;
delete from public.dresses where code in ('RENAD-024', 'RENAD-031', 'RENAD-012', 'RENAD-045', 'RENAD-018', 'RENAD-052', 'RENAD-007', 'RENAD-036');

update public.categories set image_url = v.url
from (values
  ('wedding', 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/categories/wedding.jpg'),
  ('luxury', 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/categories/luxury.jpg'),
  ('soft', 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/categories/soft.jpg'),
  ('classic', 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/categories/classic.jpg'),
  ('modern', 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/categories/modern.jpg'),
  ('rent', 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/categories/rent.jpg'),
  ('sale', 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/categories/sale.jpg')
) as v(slug, url)
where public.categories.slug = v.slug;

update public.business_settings set
  hero_image = 'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/hero-images/hero/hero.jpg',
  showroom_images = array['https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/showroom/showroom-0.jpg','https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/showroom/showroom-1.jpg','https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/showroom/showroom-2.jpg','https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/showroom/showroom-3.jpg','https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/showroom/showroom-4.jpg','https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/gallery-images/showroom/showroom-5.jpg']::text[]
where id = 1;

insert into public.dresses (
  code, slug, name_ar, description, category_id, design_type, sizes, colors, fabric,
  sale_price, rent_price, availability, status, display_mode, cover_image, is_featured, discount_percent, sort_order
) values
(
    'RENAD-024', 'renad-024', 'فستان زفاف بتاج اللؤلؤ', 'فستان زفاف بقصّة حورية وتطريز لؤلؤي يدوي ينسدل من الكتف حتى الذيل، مع قماش تول ناعم يعطي حركة راقية مع كل خطوة.',
    (select id from public.categories where slug = 'wedding'),
    'حورية Mermaid', array['S','M','L']::text[], array['أبيض','عاجي']::text[],
    'تول مطرز + ساتان',
    1500, 350,
    'both', 'available', 'images',
    'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-024/img-0.jpg', true, 10, 0
  ),
(
    'RENAD-031', 'renad-031', 'فستان زفاف بذيل ملكي', 'ذيل ملكي بطول 1.5 متر مع تفاصيل دانتيل فرنسي وحزام مرصّع بالكريستال — الفستان الذي يصنع لحظة الدخول.',
    (select id from public.categories where slug = 'wedding'),
    'Ball Gown', array['M','L','XL']::text[], array['أبيض']::text[],
    'دانتيل فرنسي + أورجانزا',
    null, 400,
    'rent', 'available', 'images',
    'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-031/img-0.jpg', true, 0, 1
  ),
(
    'RENAD-012', 'renad-012', 'فستان سهرة فخم مطرّز', 'قطعة فاخرة بتطريز كثيف من الخرز والكريستال على قماش كريب ثقيل، لسهرة لا تُنسى أو زفاف صغير.',
    (select id from public.categories where slug = 'luxury'),
    'Straight', array['S','M']::text[], array['شمبانيا']::text[],
    'كريب مطرّز',
    2200, null,
    'sale', 'available', 'images',
    'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-012/img-0.jpg', false, 0, 2
  ),
(
    'RENAD-045', 'renad-045', 'فستان ناعم بأكمام شيفون', 'أكمام شيفون شفافة وتنورة منسدلة بحنان — مثالي لزفاف الحديقة والمناسبات النهارية.',
    (select id from public.categories where slug = 'soft'),
    'A-Line', array['XS','S','M']::text[], array['أبيض وردي']::text[],
    'شيفون حريري',
    null, 300,
    'rent', 'available', 'images',
    'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-045/img-0.jpg', false, 15, 3
  ),
(
    'RENAD-018', 'renad-018', 'فستان كلاسيكي بقصّة أميرة', 'الكلاسيكية في أنقى صورها: قصّة أميرة بخصرات دقيقة وياقة قلب مطرزة بالخرز الأبيض.',
    (select id from public.categories where slug = 'classic'),
    'Princess', array['S','M','L']::text[], array['أبيض']::text[],
    'ميكلين + خرز',
    1800, 300,
    'both', 'available', 'images',
    'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-018/img-0.jpg', false, 0, 4
  ),
(
    'RENAD-052', 'renad-052', 'فستان عصري بتنورة ميروارد', 'تصميم جريء بتنورة ميروارد وكورسيه شفاف التفاصيل — للعروس التي تريد بصمة مختلفة.',
    (select id from public.categories where slug = 'modern'),
    'Mermaid', array['XS','S','M']::text[], array['عاجي']::text[],
    'كريب + تول',
    null, 450,
    'rent', 'available', 'images',
    'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-052/img-0.jpg', true, 0, 5
  ),
(
    'RENAD-007', 'renad-007', 'فستان كلاسيكي حريري', 'حرير طبيعي بلمسة مينيمال وتفاصيل يدوية دقيقة — أُبِع للتو ولم يلبس في حفل بعد.',
    (select id from public.categories where slug = 'classic'),
    'Slip', array['M']::text[], array['أبيض']::text[],
    'حرير طبيعي',
    1200, null,
    'sale', 'sold', 'images',
    'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-007/img-0.jpg', false, 0, 6
  ),
(
    'RENAD-036', 'renad-036', 'فستان 360° — ذيل مشجر', 'فستان زفاف بتطريز مشجر كثيف وذيل ناعم — صوّرناه بتقنية 360° لتري كل تفصيلة قبل زيارتك.',
    (select id from public.categories where slug = 'wedding'),
    'A-Line', array['S','M']::text[], array['أبيض']::text[],
    'تول مطرز مشجر',
    null, 500,
    'rent', 'available', 'both',
    'https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-036/img-0.jpg', true, 0, 7
  )
on conflict (code) do nothing;

insert into public.dress_images (dress_id, url, alt, sort_order)
select id, u.url, 'فستان RENAD-024', u.ord
from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-024/img-0.jpg', 0), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-024/img-1.jpg', 1), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-024/img-2.jpg', 2), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-024/img-3.jpg', 3)) as u(url, ord)
where public.dresses.code = 'RENAD-024';
insert into public.dress_images (dress_id, url, alt, sort_order)
select id, u.url, 'فستان RENAD-031', u.ord
from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-031/img-0.jpg', 0), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-031/img-1.jpg', 1), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-031/img-2.jpg', 2), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-031/img-3.jpg', 3)) as u(url, ord)
where public.dresses.code = 'RENAD-031';
insert into public.dress_images (dress_id, url, alt, sort_order)
select id, u.url, 'فستان RENAD-012', u.ord
from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-012/img-0.jpg', 0), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-012/img-1.jpg', 1), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-012/img-2.jpg', 2), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-012/img-3.jpg', 3)) as u(url, ord)
where public.dresses.code = 'RENAD-012';
insert into public.dress_images (dress_id, url, alt, sort_order)
select id, u.url, 'فستان RENAD-045', u.ord
from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-045/img-0.jpg', 0), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-045/img-1.jpg', 1), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-045/img-2.jpg', 2), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-045/img-3.jpg', 3)) as u(url, ord)
where public.dresses.code = 'RENAD-045';
insert into public.dress_images (dress_id, url, alt, sort_order)
select id, u.url, 'فستان RENAD-018', u.ord
from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-018/img-0.jpg', 0), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-018/img-1.jpg', 1), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-018/img-2.jpg', 2), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-018/img-3.jpg', 3)) as u(url, ord)
where public.dresses.code = 'RENAD-018';
insert into public.dress_images (dress_id, url, alt, sort_order)
select id, u.url, 'فستان RENAD-052', u.ord
from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-052/img-0.jpg', 0), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-052/img-1.jpg', 1), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-052/img-2.jpg', 2), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-052/img-3.jpg', 3)) as u(url, ord)
where public.dresses.code = 'RENAD-052';
insert into public.dress_images (dress_id, url, alt, sort_order)
select id, u.url, 'فستان RENAD-007', u.ord
from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-007/img-0.jpg', 0), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-007/img-1.jpg', 1), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-007/img-2.jpg', 2), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-007/img-3.jpg', 3)) as u(url, ord)
where public.dresses.code = 'RENAD-007';
insert into public.dress_images (dress_id, url, alt, sort_order)
select id, u.url, 'فستان RENAD-036', u.ord
from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-036/img-0.jpg', 0), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-036/img-1.jpg', 1), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-036/img-2.jpg', 2), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-images/RENAD-036/img-3.jpg', 3)) as u(url, ord)
where public.dresses.code = 'RENAD-036';
insert into public.dress_360_frames (dress_id, url, frame_index)
select id, u.url, u.ord
from public.dresses, (values ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/01.webp', 0), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/02.webp', 1), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/03.webp', 2), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/04.webp', 3), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/05.webp', 4), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/06.webp', 5), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/07.webp', 6), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/08.webp', 7), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/09.webp', 8), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/10.webp', 9), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/11.webp', 10), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/12.webp', 11), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/13.webp', 12), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/14.webp', 13), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/15.webp', 14), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/16.webp', 15), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/17.webp', 16), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/18.webp', 17), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/19.webp', 18), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/20.webp', 19), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/21.webp', 20), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/22.webp', 21), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/23.webp', 22), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/24.webp', 23), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/25.webp', 24), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/26.webp', 25), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/27.webp', 26), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/28.webp', 27), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/29.webp', 28), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/30.webp', 29), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/31.webp', 30), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/32.webp', 31), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/33.webp', 32), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/34.webp', 33), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/35.webp', 34), ('https://kpnhtuwrdxfggvadnpkt.supabase.co/storage/v1/object/public/dress-360/RENAD-036/36.webp', 35)) as u(url, ord)
where public.dresses.code = 'RENAD-036';
commit;
