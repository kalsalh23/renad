import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Images } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Gallery } from '@/components/viewer/Gallery'
import { useReveal } from '@/hooks/useReveal'
import type { DressImage } from '@/lib/types'

interface ShowcaseDress {
  code: string
  slug: string
}

/**
 * قسم "شاهدي الفستان من كل زاوية" — صور متعددة الزوايا لنفس الفستان
 */
export function AnglesShowcase() {
  const ref = useReveal<HTMLElement>()
  const [dress, setDress] = useState<ShowcaseDress | null>(null)
  const [images, setImages] = useState<DressImage[]>([])

  useEffect(() => {
    ;(async () => {
      // الفستان صاحب أكثر الصور لعرض زوايا متعددة
      const { data } = await supabase
        .from('dress_images')
        .select('dress_id, url, alt, sort_order, id, dresses!inner(code, slug, is_active)')
        .eq('dresses.is_active', true)
        .order('sort_order')
      const rows = (data as unknown as { dress_id: string; dresses: ShowcaseDress }[]) ?? []
      const byDress = new Map<string, { dress: ShowcaseDress; imgs: DressImage[] }>()
      for (const r of rows) {
        const entry = byDress.get(r.dress_id) ?? { dress: r.dresses, imgs: [] }
        entry.imgs.push(r as unknown as DressImage)
        byDress.set(r.dress_id, entry)
      }
      const best = [...byDress.values()].sort((a, b) => b.imgs.length - a.imgs.length)[0]
      if (best) {
        setDress(best.dress)
        setImages(best.imgs)
      }
    })()
  }, [])

  return (
    <section ref={ref} className="container-site py-16 lg:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 text-center lg:order-1 lg:text-start">
          <p className="eyebrow">EVERY ANGLE</p>
          <h2 className="heading-display mt-3 text-balance">شاهدي الفستان من كل زاوية</h2>
          <div className="gold-divider !mx-0 lg:justify-start" />
          <p className="mx-auto max-w-lg text-sm leading-8 text-smoke lg:mx-0 sm:text-base">
            كل فستان في ريناد مصوَّر بعدة زوايا — الأمام والجانب والخلف وتفاصيل القماش والتطريز —
            لتكتشفي كل تفصيلة قبل زيارة المعرض.
          </p>
          <Link to="/dresses" className="btn-primary mt-8">
            <Images className="h-4 w-4" />
            اكتشفي الفساتين بالصور المتعددة
          </Link>
        </div>

        <div className="order-1 lg:order-2">
          {dress && images.length > 1 ? (
            <div className="border border-champagne-light bg-white p-3 shadow-[0_20px_60px_rgba(33,29,24,0.12)] sm:p-4">
              <Gallery images={images} alt={`فستان ${dress.code}`} />
              <p className="mt-3 text-center font-latin text-[10px] tracking-[0.35em] text-gold-dark">
                {dress.code} · MULTI-ANGLE
              </p>
            </div>
          ) : (
            <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-4 border border-champagne-light bg-cream/70 text-beige">
              <Images className="h-12 w-12" />
              <p className="font-latin text-xs tracking-[0.3em]">MULTI-ANGLE PREVIEW</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
