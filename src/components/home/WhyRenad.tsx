import { Link } from 'react-router-dom'
import { CalendarHeart, Gem, Sparkles, Rotate3d } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { SectionHeading } from '@/components/ui/Common'

const VALUES = [
  {
    icon: Gem,
    title: 'جودة استثنائية',
    body: 'فساتين مختارة من أرقى التصاميم بأقمشة فاخرة وتفاصيل مدروسة حتى آخر غرزة.',
  },
  {
    icon: Sparkles,
    title: 'تشكيلة منتقاة',
    body: 'كل فستان في ريناد يمر باختيار دقيق ليناسب أذواق العرايس المختلفة.',
  },
  {
    icon: Rotate3d,
    title: 'تجربة 360°',
    body: 'شاهدي الفستان من كل زاوية عبر تقنية العرض التفاعلي قبل أن تصلي إلى المعرض.',
  },
  {
    icon: CalendarHeart,
    title: 'حجز سلس',
    body: 'احجزي موعد تجربتك في دقيقة، واحصلي على اهتمام شخصي كامل خلال الزيارة.',
  },
]

export function WhyRenad() {
  const ref = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="container-site py-16 lg:py-24">
      <SectionHeading eyebrow="WHY RENAD" title="لماذا ريناد؟" />
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {VALUES.map((v, i) => (
          <div
            key={v.title}
            className="card group px-6 py-8 text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(33,29,24,0.08)]"
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-champagne bg-cream text-gold-dark transition-colors duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-white">
              <v.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-display text-xl text-ink">{v.title}</h3>
            <p className="mt-2.5 text-[13px] leading-7 text-smoke">{v.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function BookingCta() {
  const ref = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-0 bg-ink" />
      <div className="absolute inset-0 opacity-25 [background:radial-gradient(ellipse_at_top,rgba(174,139,79,0.5),transparent_55%)]" />
      <div className="container-site relative z-10 text-center">
        <p className="eyebrow !text-gold-light">PRIVATE APPOINTMENT</p>
        <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl leading-[1.5] text-white text-balance sm:text-4xl lg:text-5xl">
          احجزي موعد تجربتك الخاصة
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-white/70 sm:text-base">
          جلسة تجربة خاصة تنتظركِ في صالة العرض — استشارية متخصصة ترافقكِ لتختاري فستان أحلامكِ بهدوء وراحة تامة.
        </p>
        <div className="mt-9">
          <Link to="/book" className="btn-gold px-10">
            <CalendarHeart className="h-4 w-4" />
            احجزي الآن
          </Link>
        </div>
      </div>
    </section>
  )
}
