import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import type { Dress } from '@/lib/types'
import { DressGrid } from '@/components/dresses/DressGrid'
import { SectionHeading } from '@/components/ui/Common'
import { useReveal } from '@/hooks/useReveal'

export function FeaturedSection({ dresses, loading }: { dresses: Dress[]; loading: boolean }) {
  const ref = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="bg-cream/60 py-16 lg:py-24">
      <div className="container-site">
        <SectionHeading
          eyebrow="SIGNATURE PIECES"
          title="فساتين مميزة"
          subtitle="قطع مختارة بعناية من أجمل ما لدينا — الحبيبة الأولى لكل عروس."
        />
        <div className="mt-12">
          <DressGrid dresses={dresses} loading={loading} count={4} />
        </div>
        <div className="mt-12 text-center">
          <Link to="/dresses" className="btn-outline group">
            عرض التشكيلة كاملة
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
