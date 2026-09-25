-- 008: نظام النقاط والولاء
-- العميلة تجمع نقاطًا من طلبات الفساتين المؤكدة، وتصرفها كخصم أو فستان مجاني
-- النقاط غير مرئية للعميلة حتى منحها فعليًا (granted)

-- أرصدة النقاط لكل عميلة
create table if not exists public.loyalty_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  points int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
create index if not exists loyalty_points_user_idx on public.loyalty_points (user_id);

-- حركات النقاط (منح/صرف) — للتاريخ والشفافية
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  amount int not null, -- موجب = منح، سالب = صرف
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists point_tx_user_idx on public.point_transactions (user_id, created_at desc);

-- تعديل updated_at تلقائيًا
drop trigger if exists touch_loyalty on public.loyalty_points;
create trigger touch_loyalty before update on public.loyalty_points
  for each row execute function public.touch_updated_at();

-- =============================================================
-- منطق النقاط
-- 100 نقطة لكل فستان، ويكافئ الطلب فقط (الحجز المؤكد بفساتين متعددة)
-- =============================================================
create or replace function public.points_per_dress()
returns int
language sql
immutable
as $$ select 100 $$;

-- صرف النقاط: خصم من الرصيد داخل معاملة ذرية مع تسجيل الحركة
create or replace function public.redeem_points(p_user_id uuid, p_points int, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance int;
begin
  if p_points <= 0 then
    raise exception 'عدد النقاط غير صحيح';
  end if;
  select coalesce(points, 0) into current_balance
  from public.loyalty_points where user_id = p_user_id for update;
  current_balance := coalesce(current_balance, 0);
  if current_balance < p_points then
    raise exception 'الرصيد غير كافٍ (% نقطة)', current_balance;
  end if;
  update public.loyalty_points
  set points = points - p_points, updated_at = now()
  where user_id = p_user_id;
  insert into public.point_transactions (user_id, amount, reason)
  values (p_user_id, -p_points, p_reason);
  return true;
end;
$$;

-- RLS
alter table public.loyalty_points enable row level security;
alter table public.point_transactions enable row level security;

-- العميلة ترى رصيدها وحركاتها فقط؛ المدير يرى الكل
drop policy if exists "points own read" on public.loyalty_points;
create policy "points own read" on public.loyalty_points for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "points tx own read" on public.point_transactions;
create policy "points tx own read" on public.point_transactions for select
  using (user_id = auth.uid() or public.is_admin());

-- الكتابة (منح/صرف) للمدير فقط — والعميلة لا تستطيع إضافة نقاط لنفسها
drop policy if exists "points admin insert" on public.loyalty_points;
create policy "points admin insert" on public.loyalty_points for insert
  to authenticated with check (public.is_admin());

drop policy if exists "points admin update" on public.loyalty_points;
create policy "points admin update" on public.loyalty_points for update
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "points tx admin insert" on public.point_transactions;
create policy "points tx admin insert" on public.point_transactions for insert
  to authenticated with check (public.is_admin());

-- مشغّل: عند تأكيد الحجز (confirmed/completed) تُحسب النقاط وتُضاف تلقائيًا
-- إن كانت الحركة الأولى لهذا الحجز (منع التكرار)
create or replace function public.award_points_on_confirm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := new.user_id;
  v_points int;
  v_existing int;
  v_dress_count int := 0;
begin
  if v_user is null then
    return new; -- حجز زائر بدون حساب: لا نقاط حتى يُنشئ حسابًا ويرتبط به
  end if;

  -- عدد الفساتين المطلوبة في هذا الحجز: 1 لكل فستان مرتبط + المرافقات تعطي مكافأة رمزية
  v_dress_count := greatest(1, coalesce((select count(*) from unnest(
    case when new.dress_id is null then array[]::uuid[] else array[new.dress_id] end
  ) as u where u is not null), 0) + case when new.companions >= 2 then 1 else 0 end);

  v_points := v_dress_count * public.points_per_dress();

  -- منع التكرار: حركة سابقة لنفس الحجز بنفس السبب؟
  select count(*) into v_existing
  from public.point_transactions
  where appointment_id = new.id and amount > 0;
  if v_existing > 0 then
    return new;
  end if;

  insert into public.loyalty_points (user_id, points)
  values (v_user, v_points)
  on conflict (user_id) do update
    set points = public.loyalty_points.points + excluded.points,
        updated_at = now();

  insert into public.point_transactions (user_id, appointment_id, amount, reason)
  values (
    v_user, new.id, v_points,
    'مكافأة طلب فساتين — ' || coalesce(new.dress_code, 'جلسة تجربة') ||
    (case when new.companions >= 2 then ' + مرافقات' else '' end)
  );

  -- إشعار للعميلة بالحصول على النقاط
  insert into public.notifications (audience, user_id, title, body)
  values (
    'customer', v_user, 'حصلتِ على نقاط ولاء 🎉',
    'مبروك! أُضيفت ' || v_points || ' نقطة إلى رصيدكِ. اجمعي النقاط واستبدليها بخصم في المعرض أو فستان مجاني.'
  );

  return new;
end;
$$;

drop trigger if exists award_points_on_status on public.appointments;
create trigger award_points_on_status
  after update of status on public.appointments
  for each row
  when (new.status in ('confirmed', 'completed'))
  execute function public.award_points_on_confirm();

-- منح نقاط يدويًا من الإدارة (دالة مساعدة)
create or replace function public.grant_points(p_user_id uuid, p_points int, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_points <= 0 then
    raise exception 'عدد النقاط غير صحيح';
  end if;
  insert into public.loyalty_points (user_id, points)
  values (p_user_id, p_points)
  on conflict (user_id) do update
    set points = public.loyalty_points.points + excluded.points, updated_at = now();
  insert into public.point_transactions (user_id, amount, reason)
  values (p_user_id, p_points, p_reason);
  return true;
end;
$$;
