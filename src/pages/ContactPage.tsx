import { Clock, Facebook, Instagram, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { useSEO } from '@/hooks/useSEO'
import { waLink } from '@/lib/utils'
import type { BusinessSettings } from '@/lib/types'

export default function ContactPage() {
  const { settings } = useSettings()
  useSEO({
    title: 'تواصل معنا',
    description: 'معلومات التواصل مع معرض ريناد — الهاتف، واتساب، العنوان، وأوقات العمل.',
  })

  const s = settings as BusinessSettings

  return (
    <div className="container-site pb-20 pt-28 lg:pt-36">
      <div className="text-center">
        <p className="eyebrow">GET IN TOUCH</p>
        <h1 className="heading-display mt-2">تواصلي معنا</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-smoke">
          فريق ريناد جاهز للإجابة عن استفساراتكِ وترتيب موعد تجربتكِ.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* معلومات التواصل */}
        <div className="space-y-4">
          <div className="card space-y-5 p-7">
            {s.phone && (
              <a href={`tel:${s.phone}`} className="flex items-center gap-4 text-sm transition-colors hover:text-gold-dark" dir="ltr">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-gold-dark">
                  <Phone className="h-4 w-4" />
                </span>
                <span className="text-right">
                  <span className="block text-xs text-beige">الهاتف</span>
                  <span className="font-bold">{s.phone}</span>
                </span>
              </a>
            )}
            {s.whatsapp_number && (
              <a href={waLink(s.whatsapp_number, 'مرحبًا، أود الاستفسار عن فساتين ريناد.')} target="_blank" rel="noreferrer"
                className="flex items-center gap-4 text-sm transition-colors hover:text-emerald-700" dir="ltr">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Phone className="h-4 w-4" />
                </span>
                <span className="text-right">
                  <span className="block text-xs text-beige">واتساب</span>
                  <span className="font-bold">{s.whatsapp_number}</span>
                </span>
              </a>
            )}
            {s.email && (
              <a href={`mailto:${s.email}`} className="flex items-center gap-4 text-sm transition-colors hover:text-gold-dark" dir="ltr">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-gold-dark">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="text-right">
                  <span className="block text-xs text-beige">البريد الإلكتروني</span>
                  <span className="font-bold">{s.email}</span>
                </span>
              </a>
            )}
            {s.address && (
              <div className="flex items-center gap-4 text-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-gold-dark">
                  <MapPin className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-xs text-beige">عنوان المعرض</span>
                  <span className="font-bold">{s.address}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              {s.instagram_url && (
                <a href={s.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-champagne text-smoke transition-colors hover:border-gold hover:text-gold-dark">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {s.facebook_url && (
                <a href={s.facebook_url} target="_blank" rel="noreferrer" aria-label="Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-champagne text-smoke transition-colors hover:border-gold hover:text-gold-dark">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
            </div>
            {s.maps_url && (
              <a href={s.maps_url} target="_blank" rel="noreferrer" className="btn-primary w-full">
                <Navigation className="h-4 w-4" />
                احصلي على الاتجاهات
              </a>
            )}
          </div>

          {/* أوقات العمل */}
          {s.working_hours?.length > 0 && (
            <div className="card p-7">
              <h3 className="flex items-center gap-2 font-display text-xl">
                <Clock className="h-5 w-5 text-gold-dark" />
                أوقات العمل
              </h3>
              <ul className="mt-4 space-y-2 text-sm">
                {s.working_hours.map((h) => (
                  <li key={h.day} className="flex items-center justify-between border-b border-champagne-light pb-2 last:border-0">
                    <span className="text-ink">{h.day}</span>
                    <span className={h.closed ? 'text-beige' : 'font-latin text-smoke'}>
                      {h.closed ? 'مغلق' : `${h.open} — ${h.close}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* الخريطة */}
        <div className="min-h-[380px] overflow-hidden border border-champagne-light bg-cream">
          {s.maps_embed_query ? (
            <iframe
              title="موقع معرض ريناد على الخريطة"
              src={`https://www.google.com/maps?q=${encodeURIComponent(s.maps_embed_query)}&output=embed`}
              className="h-full min-h-[380px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : s.maps_url ? (
            <iframe
              title="موقع معرض ريناد على الخريطة"
              src={s.maps_url}
              className="h-full min-h-[380px] w-full"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-beige">أضيفي موقع المعرض من لوحة التحكم</div>
          )}
        </div>
      </div>
    </div>
  )
}
