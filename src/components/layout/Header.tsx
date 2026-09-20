import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Heart, Menu, Search, User, X, CalendarHeart } from 'lucide-react'
import { NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useFavorites } from '@/context/FavoritesContext'
import { useSettings } from '@/context/SettingsContext'
import { SearchOverlay } from './SearchOverlay'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const { ids } = useFavorites()
  const { settings } = useSettings()

  const isHome = location.pathname === '/'
  const transparent = isHome && !scrolled && !menuOpen

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          transparent ? 'bg-transparent' : 'border-b border-champagne bg-ivory/95 shadow-[0_1px_20px_rgba(33,29,24,0.05)] backdrop-blur',
        )}
      >
        <div className="container-site flex h-16 items-center justify-between gap-4 lg:h-20">
          {/* الشعار */}
          <Link to="/" className="group flex flex-col items-start leading-none" aria-label="ريناد - الرئيسية">
            <span className={cn('font-display text-2xl transition-colors lg:text-3xl', transparent ? 'text-white' : 'text-ink')}>
              {settings.brand_name_ar || 'ريناد'}
            </span>
            <span className={cn('font-latin text-[10px] tracking-[0.5em] transition-colors', transparent ? 'text-white/80' : 'text-gold-dark')}>
              {settings.brand_name_en || 'RENAD'}
            </span>
          </Link>

          {/* قائمة سطح المكتب */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="التنقل الرئيسي">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn('nav-link', isActive && 'active', transparent && 'text-white/90 hover:text-white after:bg-gold-light')
                }
                end={link.to === '/'}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* الأزرار */}
          <div className="flex items-center gap-1.5 lg:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className={cn('btn-icon !border-transparent !bg-transparent', transparent ? 'text-white hover:text-gold-light' : '')}
              aria-label="بحث"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              to="/favorites"
              className={cn('btn-icon relative !border-transparent !bg-transparent', transparent ? 'text-white hover:text-gold-light' : '')}
              aria-label="المفضلة"
            >
              <Heart className="h-5 w-5" />
              {ids.length > 0 && (
                <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white">
                  {ids.length}
                </span>
              )}
            </Link>
            <Link
              to={user ? '/account' : '/auth'}
              className={cn('btn-icon hidden !border-transparent !bg-transparent sm:inline-flex', transparent ? 'text-white hover:text-gold-light' : '')}
              aria-label="حسابي"
            >
              <User className="h-5 w-5" />
            </Link>
            <Link to="/book" className={cn('btn-primary btn-sm hidden md:inline-flex', transparent && 'bg-white text-ink hover:bg-gold hover:text-white')}>
              <CalendarHeart className="h-4 w-4" />
              احجزي موعدك
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={cn('btn-icon !border-transparent !bg-transparent lg:hidden', transparent ? 'text-white' : '')}
              aria-label="القائمة"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* قائمة الهاتف */}
      <div
        className={cn(
          'fixed inset-0 z-40 flex flex-col bg-ivory pt-16 transition-all duration-500 lg:hidden',
          menuOpen ? 'visible opacity-100' : 'invisible opacity-0',
        )}
      >
        <nav className="flex flex-1 flex-col items-center justify-center gap-1 overflow-y-auto py-8" aria-label="قائمة الهاتف">
          {NAV_LINKS.map((link, i) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              style={{ transitionDelay: menuOpen ? `${i * 60}ms` : '0ms' }}
              className={({ isActive }) =>
                cn(
                  'py-3 font-display text-3xl text-ink transition-all duration-500 hover:text-gold-dark',
                  menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                  isActive && 'text-gold-dark',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link to="/book" className="btn-gold">
              <CalendarHeart className="h-4 w-4" />
              احجزي موعد تجربة
            </Link>
            <Link to={user ? '/account' : '/auth'} className="text-sm text-smoke underline-offset-4 hover:underline">
              {user ? 'حسابي' : 'تسجيل الدخول / حساب جديد'}
            </Link>
          </div>
        </nav>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
