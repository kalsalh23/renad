import { Link } from 'react-router-dom'
import { Facebook, Instagram, MapPin, Phone, Mail, Clock } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { useCategories } from '@/hooks/useData'
import { NAV_LINKS } from '@/lib/constants'

export function Footer() {
  const { settings } = useSettings()
  const { categories } = useCategories()

  return (
    <footer className="bg-ink text-ivory/85">
      <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4 lg:py-18">
        <div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-3xl text-ivory">{settings.brand_name_ar || 'ريناد'}</span>
            <span className="mt-1 font-latin text-[10px] tracking-[0.5em] text-gold-light">
              {settings.brand_name_en || 'RENAD'}
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-7 text-ivory/60">
            {settings.tagline || 'إطلالتكِ التي تحلمين بها تبدأ من ريناد'}
          </p>
          <div className="mt-5 flex items-center gap-3">
            {settings.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/20 transition-colors hover:border-gold-light hover:text-gold-light">
                <Instagram className="h-4 w-4" />
              </a>
            )}
            {settings.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ivory/20 transition-colors hover:border-gold-light hover:text-gold-light">
                <Facebook className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-latin text-xs tracking-[0.3em] text-gold-light">روابط سريعة</h4>
          <ul className="space-y-2.5 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-ivory/70 transition-colors hover:text-gold-light">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/book" className="text-ivory/70 transition-colors hover:text-gold-light">
                احجزي موعدك
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-latin text-xs tracking-[0.3em] text-gold-light">التصنيفات</h4>
          <ul className="space-y-2.5 text-sm">
            {categories.slice(0, 7).map((c) => (
              <li key={c.id}>
                <Link to={`/dresses?cat=${c.slug}`} className="text-ivory/70 transition-colors hover:text-gold-light">
                  {c.name_ar}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-latin text-xs tracking-[0.3em] text-gold-light">تواصلي معنا</h4>
          <ul className="space-y-3 text-sm text-ivory/70">
            {settings.phone && (
              <li className="flex items-center gap-2.5" dir="ltr">
                <Phone className="h-4 w-4 shrink-0 text-gold-light" />
                <span>{settings.phone}</span>
              </li>
            )}
            {settings.email && (
              <li className="flex items-center gap-2.5" dir="ltr">
                <Mail className="h-4 w-4 shrink-0 text-gold-light" />
                <span>{settings.email}</span>
              </li>
            )}
            {settings.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" />
                <span>{settings.address}</span>
              </li>
            )}
            {settings.working_hours?.length > 0 && (
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" />
                <span>
                  {settings.working_hours.filter((h) => !h.closed).slice(0, 1).map((h) => `${h.day}: ${h.open} - ${h.close}`)}
                  {settings.working_hours.filter((h) => h.closed).length > 0 &&
                    ` • ${settings.working_hours.filter((h) => h.closed).map((h) => h.day).join('، ')} مغلق`}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-5 text-xs text-ivory/40 sm:flex-row">
          <span>© {new Date().getFullYear()} {settings.brand_name_ar || 'ريناد'} — جميع الحقوق محفوظة</span>
          <span className="font-latin tracking-[0.3em]">{settings.brand_name_en || 'RENAD'} · BRIDAL ATELIER</span>
        </div>
      </div>
    </footer>
  )
}
