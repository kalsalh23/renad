import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, ExternalLink, LayoutDashboard, LogOut, Settings, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/hooks/useData'
import { useSEO } from '@/hooks/useSEO'
import { cn } from '@/lib/utils'

const LINKS = [
  { to: '/admin', label: 'الرئيسية', icon: LayoutDashboard, end: true },
  { to: '/admin/dresses', label: 'الفساتين', icon: Sparkles },
  { to: '/admin/appointments', label: 'المواعيد', icon: CalendarDays },
  { to: '/admin/notifications', label: 'الإشعارات', icon: Bell },
  { to: '/admin/settings', label: 'الإعدادات والمحتوى', icon: Settings },
]

export default function AdminLayout() {
  useSEO({ title: 'لوحة التحكم' })
  const { signOut } = useAuth()
  const { unread } = useNotifications('admin')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const nav = (
    <nav className="flex flex-col gap-1">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
              isActive ? 'bg-gold/15 font-bold text-gold-dark' : 'text-ivory/70 hover:bg-white/5 hover:text-ivory',
            )
          }
        >
          <l.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          {l.label}
          {l.to === '/admin/notifications' && unread > 0 && (
            <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-[#F6F3EC]">
      {/* الشريط الجانبي — سطح المكتب */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col bg-ink lg:flex">
        <div className="border-b border-white/10 p-6">
          <span className="font-display text-2xl text-ivory">ريناد</span>
          <span className="mt-0.5 block font-latin text-[9px] tracking-[0.4em] text-gold-light">ADMIN PANEL</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">{nav}</div>
        <div className="border-t border-white/10 p-4">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 text-xs text-ivory/60 hover:text-gold-light">
            <ExternalLink className="h-3.5 w-3.5" />
            عرض الموقع
          </a>
          <button
            onClick={async () => {
              await signOut()
              navigate('/admin/login')
            }}
            className="mt-1 flex w-full items-center gap-2 px-4 py-2 text-xs text-ivory/60 hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* درج الهاتف */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-64 flex-col bg-ink">
            <div className="border-b border-white/10 p-6">
              <span className="font-display text-2xl text-ivory">ريناد</span>
              <span className="mt-0.5 block font-latin text-[9px] tracking-[0.4em] text-gold-light">ADMIN PANEL</span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">{nav}</div>
            <div className="border-t border-white/10 p-4">
              <button
                onClick={async () => {
                  await signOut()
                  navigate('/admin/login')
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-xs text-ivory/60 hover:text-rose-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                تسجيل الخروج
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* المحتوى */}
      <div className="flex min-h-screen w-full flex-col lg:ms-64">
        {/* شريط علوي للهاتف */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-champagne bg-ivory px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="btn-icon !h-9 !w-9" aria-label="القائمة">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-display text-xl">لوحة ريناد</span>
          <NavLink to="/admin/notifications" className="relative btn-icon !h-9 !w-9" aria-label="الإشعارات">
            <Bell className="h-4 w-4" />
            {unread > 0 && <span className="absolute -top-1 -left-1 h-4 min-w-4 rounded-full bg-gold px-1 text-[9px] font-bold text-white">{unread}</span>}
          </NavLink>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
