import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'

export function Hero() {
  const { settings, loading } = useSettings()

  return (
    <section className="relative flex h-[100svh] min-h-[580px] items-center justify-center overflow-hidden">
      {/* الخلفية */}
      {settings.hero_image ? (
        <img
          src={settings.hero_image}
          alt="فستان زفاف فاخر من تشكيلة ريناد"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-blush to-cream" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/20 to-ink/60" />

      {/* المحتوى */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <p className="eyebrow animate-fade-up !text-gold-light" style={{ animationDelay: '150ms' }}>
          RENAD · BRIDAL ATELIER
        </p>
        <h1
          className="mt-5 animate-fade-up font-display text-4xl leading-[1.4] text-white text-balance sm:text-5xl lg:text-6xl"
          style={{ animationDelay: '300ms' }}
        >
          {settings.hero_title || 'إطلالتكِ التي تحلمين بها تبدأ من ريناد'}
        </h1>
        <p className="mx-auto mt-5 max-w-xl animate-fade-up text-sm leading-8 text-white/85 sm:text-base" style={{ animationDelay: '450ms' }}>
          {settings.hero_subtitle ||
            'اكتشفي تشكيلتنا المختارة من فساتين الأعراس للإيجار والشراء، واختاري الفستان الذي يليق بيومكِ الأجمل.'}
        </p>
        <div className="mt-9 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '600ms' }}>
          <Link to="/dresses" className="btn w-56 bg-ivory text-ink hover:bg-gold hover:text-white sm:w-auto">
            {settings.hero_cta_primary || 'استكشفي الفساتين'}
          </Link>
          <Link to="/book" className="btn-outline-light w-56 sm:w-auto">
            {settings.hero_cta_secondary || 'احجزي موعد تجربة'}
          </Link>
        </div>
      </div>

      {/* مؤشر التمرير */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/70">
        <ChevronDown className="h-6 w-6 animate-bounce" />
      </div>
    </section>
  )
}
