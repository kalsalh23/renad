-- =============================================================
-- RENAD | ريناد — Database Schema (Supabase / PostgreSQL)
-- 001: الجداول والدوال والمشغلات وسياسات RLS
-- =============================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- الملفات الشخصية ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- إنشاء ملف شخصي تلقائيًا لكل مستخدم جديد
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- هل المستخدم الحالي مدير؟
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- التصنيفات ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null,
  name_en text,
  image_url text,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- الفساتين ----------
create table if not exists public.dresses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  slug text unique not null,
  name_ar text not null,
  name_en text,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  design_type text,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  fabric text,
  sale_price numeric(10, 2),
  rent_price numeric(10, 2),
  availability text not null default 'both' check (availability in ('sale', 'rent', 'both')),
  status text not null default 'available' check (status in ('available', 'reserved', 'rented', 'unavailable', 'sold')),
  display_mode text not null default 'images' check (display_mode in ('images', '360', 'both')),
  cover_image text,
  is_featured boolean not null default false,
  discount_percent int not null default 0 check (discount_percent between 0 and 90),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dresses_category_idx on public.dresses (category_id);
create index if not exists dresses_status_idx on public.dresses (status, is_active);

-- ---------- صور الفساتين ----------
create table if not exists public.dress_images (
  id uuid primary key default gen_random_uuid(),
  dress_id uuid not null references public.dresses (id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists dress_images_dress_idx on public.dress_images (dress_id, sort_order);

-- ---------- إطارات 360° ----------
create table if not exists public.dress_360_frames (
  id uuid primary key default gen_random_uuid(),
  dress_id uuid not null references public.dresses (id) on delete cascade,
  url text not null,
  frame_index int not null,
  created_at timestamptz not null default now(),
  unique (dress_id, frame_index)
);
create index if not exists dress_frames_dress_idx on public.dress_360_frames (dress_id, frame_index);

-- ---------- المفضلة ----------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  dress_id uuid not null references public.dresses (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, dress_id)
);

-- ---------- المواعيد ----------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  dress_id uuid references public.dresses (id) on delete set null,
  dress_code text,
  appointment_date date not null,
  appointment_time text not null,
  companions int not null default 0 check (companions between 0 and 20),
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists appointments_date_idx on public.appointments (appointment_date);
create index if not exists appointments_status_idx on public.appointments (status);

-- حماية الحجوزات: تاريخ المستقبل + حد معدل الطلبات
create or replace function public.guard_booking_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  if new.appointment_date < current_date then
    raise exception 'لا يمكن الحجز بتاريخ في الماضي';
  end if;
  if new.appointment_date > current_date + interval '120 days' then
    raise exception 'الحجز متاح حتى 120 يومًا مقدامًا فقط';
  end if;
  select count(*) into recent
  from public.appointments
  where phone = new.phone and created_at > now() - interval '24 hours';
  if recent >= 5 then
    raise exception 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقًا';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_booking_insert on public.appointments;
create trigger guard_booking_insert
  before insert on public.appointments
  for each row execute function public.guard_booking_insert();

-- ---------- إعدادات المعرض ----------
create table if not exists public.business_settings (
  id int primary key default 1 check (id = 1),
  brand_name_ar text not null default 'ريناد',
  brand_name_en text not null default 'RENAD',
  tagline text not null default 'إطلالتكِ التي تحلمين بها تبدأ من ريناد',
  phone text,
  whatsapp_number text,
  email text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  instagram_handle text,
  address text,
  maps_url text,
  maps_embed_query text,
  working_hours jsonb not null default '[]'::jsonb,
  blocked_dates date[] not null default '{}',
  hero_title text not null default 'إطلالتكِ التي تحلمين بها تبدأ من ريناد',
  hero_subtitle text not null default 'اكتشفي تشكيلتنا المختارة من فساتين الأعراس للإيجار والشراء، واختاري الفستان الذي يليق بيومكِ الأجمل.',
  hero_image text,
  hero_cta_primary text not null default 'استكشفي الفساتين',
  hero_cta_secondary text not null default 'احجزي موعد تجربة',
  about_title text not null default 'قصة ريناد',
  about_body text,
  about_vision text,
  about_mission text,
  about_image text,
  showroom_images text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- ---------- الإشعارات ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  audience text not null default 'admin' check (audience in ('admin', 'customer')),
  user_id uuid references public.profiles (id) on delete cascade,
  title text not null,
  body text,
  link text,
  appointment_id uuid references public.appointments (id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_audience_idx on public.notifications (audience, is_read, created_at desc);

-- إشعار للإدارة عند وصول طلب حجز جديد
create or replace function public.notify_admins_on_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (audience, title, body, link, appointment_id)
  values (
    'admin',
    'طلب حجز جديد',
    'طلب حجز جديد من ' || new.customer_name || ' للفستان ' || coalesce(new.dress_code, '—') ||
    ' بتاريخ ' || to_char(new.appointment_date, 'YYYY-MM-DD') || ' الساعة ' || new.appointment_time,
    '/admin/appointments',
    new.id
  );
  return new;
end;
$$;

drop trigger if exists notify_admins_on_booking on public.appointments;
create trigger notify_admins_on_booking
  after insert on public.appointments
  for each row execute function public.notify_admins_on_booking();

-- إشعار للعميلة عند تغيّر حالة الحجز
create or replace function public.notify_customer_on_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    return new;
  end if;
  if new.status = 'confirmed' and (tg_op = 'UPDATE') then
    insert into public.notifications (audience, user_id, title, body, appointment_id)
    values ('customer', new.user_id, 'تم تأكيد حجزكِ 🤍',
      'موعد تجربتك بتاريخ ' || to_char(new.appointment_date, 'YYYY-MM-DD') || ' الساعة ' || new.appointment_time ||
      ' أصبح مؤكدًا — ننتظركِ في ريناد.', new.id);
  elsif new.status = 'rescheduled' and (tg_op = 'UPDATE') then
    insert into public.notifications (audience, user_id, title, body, appointment_id)
    values ('customer', new.user_id, 'تم تعديل موعد حجزكِ',
      'موعدكِ الجديد: ' || to_char(new.appointment_date, 'YYYY-MM-DD') || ' الساعة ' || new.appointment_time ||
      coalesce(' — ' || new.admin_note, ''), new.id);
  elsif new.status = 'cancelled' and (tg_op = 'UPDATE') then
    insert into public.notifications (audience, user_id, title, body, appointment_id)
    values ('customer', new.user_id, 'تم إلغاء حجزكِ',
      coalesce('ملاحظة الإدارة: ' || new.admin_note, 'يمكنكِ دائمًا حجز موعد جديد.'), new.id);
  elsif new.status = 'completed' and (tg_op = 'UPDATE') then
    insert into public.notifications (audience, user_id, title, body, appointment_id)
    values ('customer', new.user_id, 'شكرًا لزيارتكِ 🌸', 'نتمنى أن تكون تجربتكِ كانت ممتعة — فريق ريناد.', new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists notify_customer_on_status on public.appointments;
create trigger notify_customer_on_status
  after update of status on public.appointments
  for each row execute function public.notify_customer_on_status();

-- تحديث updated_at تلقائيًا
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_dresses on public.dresses;
create trigger touch_dresses before update on public.dresses
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_appointments on public.appointments;
create trigger touch_appointments before update on public.appointments
  for each row execute function public.touch_updated_at();

-- =============================================================
-- Row Level Security
-- =============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.dresses enable row level security;
alter table public.dress_images enable row level security;
alter table public.dress_360_frames enable row level security;
alter table public.favorites enable row level security;
alter table public.appointments enable row level security;
alter table public.business_settings enable row level security;
alter table public.notifications enable row level security;

-- profiles
drop policy if exists "profiles select" on public.profiles;
create policy "profiles select" on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update
  using (id = auth.uid() and role = 'customer')
  with check (id = auth.uid() and role = 'customer');

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- categories
drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);
drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- dresses
drop policy if exists "dresses public read" on public.dresses;
create policy "dresses public read" on public.dresses for select
  using (is_active = true or public.is_admin());
drop policy if exists "dresses admin write" on public.dresses;
create policy "dresses admin write" on public.dresses for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- dress_images
drop policy if exists "dress_images public read" on public.dress_images;
create policy "dress_images public read" on public.dress_images for select using (true);
drop policy if exists "dress_images admin write" on public.dress_images;
create policy "dress_images admin write" on public.dress_images for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- dress_360_frames
drop policy if exists "frames public read" on public.dress_360_frames;
create policy "frames public read" on public.dress_360_frames for select using (true);
drop policy if exists "frames admin write" on public.dress_360_frames;
create policy "frames admin write" on public.dress_360_frames for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

-- favorites
drop policy if exists "favorites own" on public.favorites;
create policy "favorites own" on public.favorites for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- appointments
drop policy if exists "appointments insert public" on public.appointments;
create policy "appointments insert public" on public.appointments for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "appointments select" on public.appointments;
create policy "appointments select" on public.appointments for select
  using (public.is_admin() or user_id = auth.uid());

drop policy if exists "appointments admin update" on public.appointments;
create policy "appointments admin update" on public.appointments for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "appointments admin delete" on public.appointments;
create policy "appointments admin delete" on public.appointments for delete
  using (public.is_admin());

-- business_settings
drop policy if exists "settings public read" on public.business_settings;
create policy "settings public read" on public.business_settings for select using (true);
drop policy if exists "settings admin write" on public.business_settings;
create policy "settings admin write" on public.business_settings for update
  using (public.is_admin()) with check (public.is_admin());

-- notifications
drop policy if exists "notifications admin read" on public.notifications;
create policy "notifications admin read" on public.notifications for select
  using (audience = 'admin' and public.is_admin());

drop policy if exists "notifications customer read" on public.notifications;
create policy "notifications customer read" on public.notifications for select
  using (audience = 'customer' and user_id = auth.uid());

drop policy if exists "notifications admin update" on public.notifications;
create policy "notifications admin update" on public.notifications for update
  using (audience = 'admin' and public.is_admin())
  with check (audience = 'admin' and public.is_admin());

drop policy if exists "notifications customer update" on public.notifications;
create policy "notifications customer update" on public.notifications for update
  using (audience = 'customer' and user_id = auth.uid())
  with check (audience = 'customer' and user_id = auth.uid());
