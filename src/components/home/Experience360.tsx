import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Rotate3d } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Viewer360 } from '@/components/viewer/Viewer360'
import { useReveal } from '@/hooks/useReveal'

interface ShowcaseDress {
  id: string
  code: string
  slug: string
}

/**
 * قسم "تجربة الفستان قبل الزيارة" — يعرض أول فستان يتوفر له عرض 360°
 */
export function Experience360() {
  const ref = useReveal<HTMLElement>()
  const [dress, setDress] = useState<ShowcaseDress | null>(null)
  const [frames, setFrames] = useState<string[]>([])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('dresses')
        .select('id, code, slug')
        .eq('is_active', true)
        .in('display_mode', ['360', 'both'])
        .order('created_at', { ascending: false })
        .limit(1)
      const first = (data as ShowcaseDress[] | null)?.[0]
      if (!first) return
      setDress(first)
      const { data: fr } = await supabase
        .from('dress_360_frames')
        .select('url, frame_index')
        .eq('dress_id', first.id)
        .order('frame_index')
      setFrames((fr as { url: string }[] | null)?.map((f) => f.url) ?? [])
    })()
  }, [])

  return (
    <section ref={ref} className="container-site py-16 lg:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 text-center lg:order-1 lg:text-start">
          <p className="eyebrow">360° EXPERIENCE</p>
          <h2 className="heading-display mt-3 text-balance">شاهدي فستانكِ من كل زاوية</h2>
          <div className="gold-divider !mx-0 lg:justify-start" />
          <p className="mx-auto max-w-lg text-sm leading-8 text-smoke lg:mx-0 sm:text-base">
            تصفحي الفستان بتقنية 360° واكتشفي تفاصيله قبل زيارة المعرض — بدوران سلس
            بلمسة واحدة كما لو كنتِ أماميه في صالة العرض.
          </p>
          <Link to="/dresses" className="btn-primary mt-8">
            <Rotate3d className="h-4 w-4" />
            اكتشفي الفساتين بتقنية 360°
          </Link>
        </div>

        <div className="order-1 lg:order-2">
          {dress && frames.length > 2 ? (
            <Link to={`/dresses/${dress.slug}`} className="block">
              <Viewer360 frames={frames} className="aspect-[3/4] w-full border border-champagne-light shadow-[0_20px_60px_rgba(33,29,24,0.12)]" />
            </Link>
          ) : (
            <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-4 border border-champagne-light bg-cream/70 text-beige">
              <Rotate3d className="h-12 w-12" />
              <p className="font-latin text-xs tracking-[0.3em]">360° PREVIEW</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
