import { Bell, Check } from 'lucide-react'
import { useNotifications } from '@/hooks/useData'
import { useSEO } from '@/hooks/useSEO'
import { fmtDateTimeAr } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function NotificationsAdminPage() {
  useSEO({ title: 'الإشعارات' })
  const { notifications, unread, markAllRead, markRead } = useNotifications('admin')

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">الإشعارات</h1>
          <p className="mt-1 text-sm text-smoke">{unread > 0 ? `${unread} إشعار جديد` : 'كل الإشعارات مقروءة'}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-outline btn-sm">
            <Check className="h-4 w-4" />
            تعليم الكل كمقروء
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-beige" />
          <h3 className="mt-4 font-display text-2xl">لا توجد إشعارات</h3>
          <p className="mt-2 text-sm text-smoke">ستصلكِ هنا تنبيهات طلبات الحجز الجديدة فور وصولها.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={cn('card p-5 transition-colors', !n.is_read && 'border-gold/60 bg-gold/[0.04]')}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-ink">{n.title}</h4>
                  {n.body && <p className="mt-1 text-sm leading-7 text-smoke">{n.body}</p>}
                </div>
                <span className="shrink-0 text-[11px] text-beige">{fmtDateTimeAr(n.created_at)}</span>
              </div>
              {!n.is_read && <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-gold" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
