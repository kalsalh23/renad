import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, CalendarHeart, Heart, MessageCircle, Ruler, Truck, ShieldCheck, Images } from 'lucide-react'
import { useDressBySlug, useRelatedDresses } from '@/hooks/useData'
import { PageLoader, SectionHeading } from '@/components/ui/Common'
import { Gallery } from '@/components/viewer/Gallery'
import { DressCard } from '@/components/dresses/DressCard'
import { useSettings } from '@/context/SettingsContext'
import { useFavorites } from '@/context/FavoritesContext'
import { AVAILABILITY_META, DRESS_STATUS_META } from '@/lib/constants'
import { cn, waLink } from '@/lib/utils'
import { useSEO } from '@/hooks/useSEO'

export default function DressDetailsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { dress, images, loading, notFound } = useDressBySlug(slug)
  const related = useRelatedDresses(dress)
  const { settings } = useSettings()
  const { isFavorite, toggleFavorite } = useFavorites()

  useSEO({
    title: dress ? `فستان ${dress.code}` : undefined,
    description: dress
      ? `فستان ${dress.category?.name_ar ?? ''} ${dress.code} من ريناد — ${AVAILABILITY_META[dress.availability]}. ${dress.description?.slice(0, 90) ?? ''}`
      : undefined,
    image: dress?.cover_image ?? undefined,
    type: 'product',
  })

  if (loading) return <PageLoader />
  if (notFound || !dress) return <Navigate to="/dresses" replace />

  const statusMeta = DRESS_STATUS_META[dress.status]
  const bookable = dress.status === 'available' || dress.status === 'reserved'
  const fav = isFavorite(dress.id)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `فستان ${dress.code} - ${dress.category?.name_ar ?? 'فساتين أعراس'}`,
    image: dress.cover_image,
    description: dress.description ?? undefined,
    sku: dress.code,
    brand: { '@type': 'Brand', name: 'RENAD' },
  }

  return (
    <div className="container-site pb-20 pt-24 lg:pt-32">
      {/* مسار التنقل */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-smoke" aria-label="مسار التنقل">
        <Link to="/" className="hover:text-gold-dark">الرئيسية</Link>
        <span>/</span>
        <Link to="/dresses" className="hover:text-gold-dark">الفساتين</Link>
        {dress.category && (
          <>
            <span>/</span>
            <Link to={`/dresses?cat=${dress.category.slug}`} className="hover:text-gold-dark">{dress.category.name_ar}</Link>
          </>
        )}
        <span>/</span>
        <span className="font-latin text-ink">{dress.code}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* معرض الصور — نفس الفستان بعدة زوايا */}
        <div>
          {images.length > 0 ? (
            <Gallery images={images} alt={`فستان ${dress.code}`} />
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center bg-cream text-beige">
              <Images className="h-10 w-10" />
            </div>
          )}
        </div>

        {/* المعلومات */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-latin text-xs tracking-[0.35em] text-gold-dark">{dress.code}</p>
              <h1 className="mt-2 font-display text-3xl leading-snug text-ink lg:text-4xl">
                {dress.name_ar || dress.category?.name_ar}
              </h1>
            </div>
            <button
              onClick={() => toggleFavorite(dress.id)}
              className={cn('btn-icon mt-1', fav && 'border-gold')}
              aria-label={fav ? 'إزالة من المفضلة' : 'أضيفي إلى المفضلة'}
            >
              <Heart className={cn('h-5 w-5', fav && 'fill-gold text-gold animate-pop')} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={cn('status-pill', statusMeta.pill)}>{statusMeta.label}</span>
            {dress.category && <span className="chip">{dress.category.name_ar}</span>}
            {dress.design_type && <span className="chip">{dress.design_type}</span>}
            <span className="chip text-gold-dark">{AVAILABILITY_META[dress.availability]}</span>
          </div>

          {dress.description && (
            <p className="mt-6 text-sm leading-8 text-smoke">{dress.description}</p>
          )}

          {/* السعر — عند الاستفسار فقط */}
          <div className="mt-8 border-y border-champagne py-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-smoke">السعر:</span>
              <span className="font-latin text-3xl tracking-[0.5em] text-gold-dark">***</span>
            </div>
            <p className="mt-2 text-xs text-beige">الأسعار تُعرض عند الاستفسار أو زيارة المعرض</p>
          </div>

          {/* المواصفات */}
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-xs text-beige">المقاسات المتوفرة</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {(dress.sizes ?? []).length
                  ? dress.sizes.map((s) => (
                      <span key={s} className="chip font-latin">{s}</span>
                    ))
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-beige">الألوان</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {(dress.colors ?? []).length ? dress.colors.map((c) => <span key={c} className="chip">{c}</span>) : '-'}
              </dd>
            </div>
            {dress.fabric && (
              <div>
                <dt className="text-xs text-beige">نوع القماش</dt>
                <dd className="mt-1 text-ink">{dress.fabric}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-beige">العرض</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-ink">
                <Images className="h-4 w-4 text-gold-dark" />
                {images.length > 0 ? `صور من ${images.length} زوايا` : 'صور'}
              </dd>
            </div>
          </dl>

          {/* الأزرار */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {bookable ? (
              <Link to={`/book?dress=${dress.slug}`} className="btn-primary flex-1">
                <CalendarHeart className="h-4 w-4" />
                احجزي موعد تجربة
              </Link>
            ) : (
              <button disabled className="btn-primary flex-1">
                {statusMeta.label} — لا يمكن الحجز حاليًا
              </button>
            )}
            {settings.whatsapp_number && (
              <a
                href={waLink(settings.whatsapp_number, `مرحبًا، أود الاستفسار عن الفستان ${dress.code}.`)}
                target="_blank"
                rel="noreferrer"
                className="btn-outline flex-1 !border-emerald-600/40 text-emerald-700 hover:!border-emerald-600 hover:text-emerald-800"
              >
                <MessageCircle className="h-4 w-4" />
                اسألي عن الفستان عبر واتساب
              </a>
            )}
          </div>

          {/* الوعود */}
          <ul className="mt-8 space-y-3 text-[13px] text-smoke">
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-gold-dark" />
              تجربة داخل المعرض مع استشارية متخصصة
            </li>
            <li className="flex items-center gap-2.5">
              <Ruler className="h-4 w-4 text-gold-dark" />
              تعديل المقاس متوفر حسب التصميم
            </li>
            <li className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 text-gold-dark" />
              ترتيبات التسليم والاستلام تُنسّق في الموعد
            </li>
          </ul>
        </div>
      </div>

      {/* فساتين مشابهة */}
      {related.length > 0 && (
        <section className="mt-24">
          <SectionHeading eyebrow="YOU MAY ALSO LOVE" title="قد يعجبكِ أيضًا" />
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((d) => (
              <DressCard key={d.id} dress={d} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/dresses" className="btn-outline btn-sm">
              <ArrowRight className="h-4 w-4" />
              كل الفساتين
            </Link>
          </div>
        </section>
      )}

      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </div>
  )
}
