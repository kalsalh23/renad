import type { Dress } from '@/lib/types'
import { DressCard } from './DressCard'
import { SkeletonCard, EmptyState } from '@/components/ui/Common'
import { Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

export function DressGrid({
  dresses,
  loading,
  count = 8,
  emptyAction,
}: {
  dresses: Dress[]
  loading?: boolean
  count?: number
  emptyAction?: ReactNode
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!dresses.length) {
    return (
      <EmptyState
        icon={<Sparkles className="h-10 w-10" />}
        title="لا توجد فساتين مطابقة"
        subtitle="جرّبي تعديل عوامل التصفية أو تصفحي تشكيلتنا كاملة لاكتشاف الفستان المناسب."
        action={emptyAction}
      />
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
      {dresses.map((dress, i) => (
        <DressCard key={dress.id} dress={dress} priority={i < 4} />
      ))}
    </div>
  )
}
