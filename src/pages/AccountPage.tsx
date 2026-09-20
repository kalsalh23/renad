import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, Heart, Bell, LogOut, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useFavorites } from '@/context/FavoritesContext'
import { useAppointments, useDresses, useNotifications } from '@/hooks/useData'
import { useSEO } from '@/hooks/useSEO'
import { APPOINTMENT_STATUS_META } from '@/lib/constants'
import { fmtDateAr, fmtDateTimeAr } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { PageLoader } from '@/components/ui/Common'
import { DressCard } from '@/components/dresses/DressCard'

export default function AccountPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'bookings'
  useSEO({ title: 'حسابي' })

  if (authLoading) return <PageLoader />
  if (!user) return <Navigate to="/auth" replace />

  const tabs = [
    { id: 'bookings', label: 'حجوزاتي', icon: CalendarDays },
    { id: 'favorites', label: 'المفضلة', icon: Heart },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'profile', label: 'بياناتي', icon: User },
  ]

  return (
    <div className="container-site pb-20 pt-28 lg:pt-36">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow">MY ACCOUNT</p>
          <h1 className="heading-display mt-2 !text-3xl">أهلًا {profile?.full_name || 'بكِ'} 🤍</h1>
        </div>
        <button onClick={() => signOut()} className="btn-outline btn-sm">
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>

      {/* التبويبات */}
      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto border-b border-champagne pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setParams({ tab: t.id }, { replace: true })}
            className={cn(
              'flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm transition-colors',
              tab === t.id ? 'border-gold font-bold text-gold-dark' : 'border-transparent text-smoke hover:text-ink',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {tab === 'bookings' && <MyBookings userId={user.id} />}
        {tab === 'favorites' && <MyFavorites />}
        {tab === 'notifications' && <MyNotifications userId={user.id} />}
        {tab === 'profile' && <MyProfile />}
      </div>
    </div>
  )
}

function MyBookings({ userId }: { userId: string }) {
  const { appointments, loading } = useAppointments({ userField: 'user_id', userValue: userId })

  if (loading) return <PageLoader />
  if (!appointments.length) {
    return (
      <div className="card p-10 text-center">
        <CalendarDays className="mx-auto h-10 w-10 text-beige" />
        <h3 className="mt-4 font-display text-2xl">لا توجد حجوزات بعد</h3>
        <p className="mt-2 text-sm text-smoke">احجزي موعد تجربتك الأول وستظهر تفاصيله هنا.</p>
        <Link to="/book" className="btn-gold mt-6">احجزي موعد تجربة</Link>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {appointments.map((a) => {
        const meta = APPOINTMENT_STATUS_META[a.status]
        return (
          <div key={a.id} className="card flex gap-4 p-4">
            {a.dress?.cover_image && (
              <img src={a.dress.cover_image} alt="" className="h-28 w-[88px] shrink-0 object-cover" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={cn('status-pill', meta.pill)}>{meta.label}</span>
                <span className="shrink-0 text-[11px] text-beige">{fmtDateTimeAr(a.created_at)}</span>
              </div>
              <h4 className="mt-2 font-bold text-ink">
                {a.dress ? (
                  <Link to={`/dresses/${a.dress.slug}`} className="hover:text-gold-dark">
                    {a.dress.code} — {a.dress.name_ar}
                  </Link>
                ) : (
                  'تجربة عامة'
                )}
              </h4>
              <p className="mt-1 text-sm text-smoke">
                {fmtDateAr(a.appointment_date, { weekday: 'long' })} · الساعة {a.appointment_time}
                {a.companions > 0 && ` · ${a.companions} مرافقات`}
              </p>
              {a.admin_note && (
                <p className="mt-2 rounded-sm bg-cream px-3 py-2 text-xs text-smoke">إدارة المعرض: {a.admin_note}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MyFavorites() {
  const { dresses, loading } = useDresses()
  const { ids } = useFavorites()

  if (loading) return <PageLoader />

  const list = dresses.filter((d) => ids.includes(d.id))

  if (!list.length) {
    return (
      <div className="card p-10 text-center">
        <Heart className="mx-auto h-10 w-10 text-beige" />
        <h3 className="mt-4 font-display text-2xl">مفضلتكِ فارغة</h3>
        <p className="mt-2 text-sm text-smoke">اضغطي على القلب ♥ في أي فستان ليُحفظ هنا.</p>
        <Link to="/dresses" className="btn-gold mt-6">تصفحي الفساتين</Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
      {list.map((d) => (
        <DressCard key={d.id} dress={d} />
      ))}
    </div>
  )
}

function MyNotifications({ userId }: { userId: string }) {
  const { notifications, unread, markAllRead, markRead } = useNotifications('customer', userId)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-smoke">{unread > 0 ? `${unread} إشعار جديد` : 'لا إشعارات جديدة'}</span>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs text-gold-dark underline underline-offset-4">
            تعليم الكل كمقروء
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="card p-10 text-center">
          <Bell className="mx-auto h-10 w-10 text-beige" />
          <h3 className="mt-4 font-display text-2xl">لا توجد إشعارات</h3>
          <p className="mt-2 text-sm text-smoke">ستصلكِ هنا إشعارات حالة حجوزاتكِ (تأكيد، تعديل، إلغاء).</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={cn('card p-4 transition-colors', !n.is_read && 'border-gold/50 bg-gold/[0.04]', !n.is_read && 'cursor-pointer')}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-ink">{n.title}</h4>
                <span className="shrink-0 text-[11px] text-beige">{fmtDateTimeAr(n.created_at)}</span>
              </div>
              {n.body && <p className="mt-1.5 text-[13px] leading-6 text-smoke">{n.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MyProfile() {
  const { profile } = useAuth()
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cream font-display text-3xl text-gold-dark">
        {(profile?.full_name || 'ر').charAt(0)}
      </div>
      <h3 className="mt-4 font-display text-2xl">{profile?.full_name || '—'}</h3>
      <p className="mt-1 text-sm text-smoke" dir="ltr">{profile?.email}</p>
      {profile?.phone && <p className="mt-1 text-sm text-smoke" dir="ltr">{profile.phone}</p>}
      <p className="mt-4 text-xs text-beige">عضوة منذ {profile ? fmtDateAr(profile.created_at.slice(0, 10)) : '—'}</p>
    </div>
  )
}
