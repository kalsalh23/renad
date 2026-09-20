import { NavLink } from 'react-router-dom'
import { CalendarDays, Heart, Home, Sparkles, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useFavorites } from '@/context/FavoritesContext'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const { user } = useAuth()
  const { ids } = useFavorites()

  const items = [
    { to: '/', label: 'الرئيسية', icon: Home, end: true },
    { to: '/dresses', label: 'الفساتين', icon: Sparkles },
    { to: '/favorites', label: 'المفضلة', icon: Heart, badge: ids.length },
    { to: '/account?tab=bookings', label: 'حجوزاتي', icon: CalendarDays },
    { to: user ? '/account' : '/auth', label: 'حسابي', icon: User },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-champagne bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="التنقل السفلي"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 py-2.5 text-[10px] transition-colors',
                isActive ? 'text-gold-dark' : 'text-smoke',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
            {!!item.badge && item.badge > 0 && (
              <span className="absolute right-1/2 top-1 flex h-3.5 min-w-3.5 translate-x-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-bold text-white">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
