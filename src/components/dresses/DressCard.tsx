import { Link } from 'react-router-dom'
import { Eye, Heart } from 'lucide-react'
import type { Dress } from '@/lib/types'
import { AVAILABILITY_META, DRESS_STATUS_META } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useFavorites } from '@/context/FavoritesContext'

export function DressCard({ dress, priority = false }: { dress: Dress; priority?: boolean }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const fav = isFavorite(dress.id)
  const unavailable = dress.status === 'sold' || dress.status === 'unavailable'
  const statusMeta = DRESS_STATUS_META[dress.status]

  return (
    <article className="group relative">
      <Link
        to={`/dresses/${dress.slug}`}
        className="block overflow-hidden bg-cream"
        aria-label={`${dress.code} - ${dress.category?.name_ar ?? ''}`}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          {dress.cover_image ? (
            <img
              src={dress.cover_image}
              alt={`فستان ${dress.code} - ${dress.category?.name_ar ?? 'فساتين أعراس'}`}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              className={cn(
                'h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]',
                unavailable && 'opacity-75 saturate-50',
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-cream font-latin text-4xl text-champagne">
              {dress.code}
            </div>
          )}

          {/* الشارات */}
          {dress.status !== 'available' && (
            <div className="absolute start-3 top-3">
              <span className={cn('status-pill backdrop-blur', statusMeta.pill, 'bg-opacity-90')}>{statusMeta.label}</span>
            </div>
          )}

          {/* طبقة التحويم على سطح المكتب */}
          <div className="absolute inset-0 hidden items-end justify-center bg-gradient-to-t from-ink/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 lg:flex">
            <span className="mb-6 inline-flex items-center gap-2 bg-ivory px-5 py-2.5 text-xs font-bold text-ink shadow-lg transition-transform duration-500 group-hover:-translate-y-1">
              <Eye className="h-4 w-4" />
              مشاهدة التفاصيل
            </span>
          </div>
        </div>
      </Link>

      {/* زر المفضلة */}
      <button
        onClick={(e) => {
          e.preventDefault()
          toggleFavorite(dress.id)
        }}
        className={cn(
          'absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur transition-all hover:scale-110',
          fav && 'bg-white',
        )}
        aria-label={fav ? 'إزالة من المفضلة' : 'أضيفي إلى المفضلة'}
        aria-pressed={fav}
      >
        <Heart
          className={cn('h-[18px] w-[18px] transition-colors', fav ? 'fill-gold text-gold animate-pop' : 'text-ink/60')}
        />
      </button>

      {/* المعلومات — السعر عند الاستفسار فقط */}
      <div className="pt-3.5 text-center">
        <p className="font-latin text-[11px] tracking-[0.3em] text-gold-dark">{dress.code}</p>
        <h3 className="mt-1 text-sm font-bold text-ink">{dress.category?.name_ar ?? dress.name_ar}</h3>
        <p className="mt-0.5 text-[11px] text-smoke">{AVAILABILITY_META[dress.availability]}</p>
        <p className="mt-1.5 font-latin text-sm tracking-[0.45em] text-gold-dark/80" title="السعر عند الاستفسار">
          ***
        </p>
      </div>
    </article>
  )
}
