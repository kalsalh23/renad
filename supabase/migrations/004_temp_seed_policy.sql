-- 004: سياسة رفع مؤقتة للبيانات الأولية (تُحذف بعد الـ Seed)
drop policy if exists "renad seed temp" on storage.objects;
create policy "renad seed temp" on storage.objects for all
  to anon, authenticated
  using (bucket_id in ('dress-images', 'dress-360', 'hero-images', 'gallery-images'))
  with check (bucket_id in ('dress-images', 'dress-360', 'hero-images', 'gallery-images'));
