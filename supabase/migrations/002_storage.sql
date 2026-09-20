-- 002: حاويات التخزين وسياساتها
insert into storage.buckets (id, name, public)
values
  ('dress-images', 'dress-images', true),
  ('dress-360', 'dress-360', true),
  ('hero-images', 'hero-images', true),
  ('gallery-images', 'gallery-images', true)
on conflict (id) do update set public = true;

drop policy if exists "renad public read" on storage.objects;
create policy "renad public read" on storage.objects for select
  using (bucket_id in ('dress-images', 'dress-360', 'hero-images', 'gallery-images'));

drop policy if exists "renad admin insert" on storage.objects;
create policy "renad admin insert" on storage.objects for insert
  to authenticated
  with check (public.is_admin() and bucket_id in ('dress-images', 'dress-360', 'hero-images', 'gallery-images'));

drop policy if exists "renad admin update" on storage.objects;
create policy "renad admin update" on storage.objects for update
  to authenticated
  using (public.is_admin() and bucket_id in ('dress-images', 'dress-360', 'hero-images', 'gallery-images'));

drop policy if exists "renad admin delete" on storage.objects;
create policy "renad admin delete" on storage.objects for delete
  to authenticated
  using (public.is_admin() and bucket_id in ('dress-images', 'dress-360', 'hero-images', 'gallery-images'));
