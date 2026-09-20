-- 003: بيانات أساسية ثابتة — التصنيفات والإعدادات
insert into public.categories (slug, name_ar, name_en, sort_order) values
  ('wedding',  'فساتين الزفاف',   'Wedding',  1),
  ('luxury',   'فساتين فخمة',     'Luxury',   2),
  ('soft',     'فساتين ناعمة',    'Soft',     3),
  ('classic',  'فساتين كلاسيكية', 'Classic',  4),
  ('modern',   'فساتين عصرية',    'Modern',   5),
  ('rent',     'فساتين للإيجار',  'For Rent', 6),
  ('sale',     'فساتين للبيع',    'For Sale', 7)
on conflict (slug) do nothing;

insert into public.business_settings (
  id, brand_name_ar, brand_name_en, tagline,
  phone, whatsapp_number, email,
  instagram_url, facebook_url, instagram_handle,
  address, maps_embed_query,
  working_hours,
  about_body, about_vision, about_mission
) values (
  1, 'ريناد', 'RENAD', 'إطلالتكِ التي تحلمين بها تبدأ من ريناد',
  '+963 900 000 000', '963900000000', 'hello@renad.app',
  'https://instagram.com/renad', 'https://facebook.com/renad', 'renad',
  'دمشق — سوريا', 'دمشق، سوريا',
  '[
    {"day":"السبت","open":"10:00","close":"21:00","closed":false},
    {"day":"الأحد","open":"10:00","close":"21:00","closed":false},
    {"day":"الاثنين","open":"10:00","close":"21:00","closed":false},
    {"day":"الثلاثاء","open":"10:00","close":"21:00","closed":false},
    {"day":"الأربعاء","open":"10:00","close":"21:00","closed":false},
    {"day":"الخميس","open":"10:00","close":"21:00","closed":false},
    {"day":"الجمعة","closed":true}
  ]'::jsonb,
  'بدأت ريناد من فكرة بسيطة: أن تجربة اختيار فستان الزفاف تستحق أن تكون لحظة لا تُنسى بقدر يوم العمر نفسه. اليوم يقدم ريناد تشكيلة منتقاة من فساتين الأعراس للإيجار والشراء، مع تجربة رقمية تتيح لكِ اكتشاف كل تفصيلة قبل أن تصلي إلينا — ثم جلسة تجربة خاصة ترافقكِ فيها حتى تختاري بثقة وقلب مطمئن.',
  'أن نكون الوجهة الأولى لكل عروس تبحث عن إطلالة استثنائية وتجربة اختيار راقية من البداية للنهاية.',
  'أن نُقرّب الفستان المناسب من كل عروس — عبر تشكيلة صادقة وأسعار واضحة وتقنية تجعل الاكتشاف ممتعًا وخدمة تحفظ خصوصيتها.'
)
on conflict (id) do nothing;
