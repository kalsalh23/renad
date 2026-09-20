import { Link } from 'react-router-dom'
import { ChevronLeft, KeyRound, Tag } from 'lucide-react'
import type { Dress } from '@/lib/types'
import { DressGrid } from '@/components/dresses/DressGrid'
import { useReveal } from '@/hooks/useReveal'

/**
 * قسم الإيجار / الشراء في الصفحة الرئيسية
 */
export function RentBuySection({ mode, dresses, loading }: { mode: 'rent' | 'sale'; dresses: Dress[]; loading: boolean }) {
  const ref = useReveal<HTMLElement>()
  const isRent = mode === 'rent'
  const filtered = dresses.filter((d) =>
    isRent ? d.availability !== 'sale' : d.availability !== 'rent',
  )

  if (!loading && !filtered.length) return null

  return (
    <section ref={ref} className={isRent ? 'bg-cream/60 py-16 lg:py-20' : 'py-16 lg:py-20'}>
      <div className="container-site">
        <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-start">
          <div>
            <p className="eyebrow">{isRent ? 'FOR RENT' : 'FOR SALE'}</p>
            <h2 className="mt-3 flex items-center gap-3 font-display text-3xl text-ink lg:text-4xl">
              {isRent ? <KeyRound className="h-6 w-6 text-gold-dark" /> : <Tag className="h-6 w-6 text-gold-dark" />}
              {isRent ? 'فساتين للإيجار' : 'فساتين للبيع'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-smoke">
              {isRent
                ? 'إطلالة يومكِ الأجمل بسعر مناسب — فساتين مصممة بإتقان متاحة للإيجار.'
                : 'قطع استثنائية تبقى معكِ ذكرى لا تُنسى — متاحة للشراء بجودة عالية.'}
            </p>
          </div>
          <Link to={isRent ? '/rent' : '/buy'} className="btn-outline btn-sm group shrink-0">
            عرض الكل
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        <div className="mt-10">
          <DressGrid dresses={filtered.slice(0, 4)} loading={loading} count={4} />
        </div>
      </div>
    </section>
  )
}
