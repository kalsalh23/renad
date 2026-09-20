import { Link } from 'react-router-dom'
import type { Category } from '@/lib/types'
import { useReveal } from '@/hooks/useReveal'
import { SectionHeading } from '@/components/ui/Common'

export function CategoriesSection({ categories, loading }: { categories: Category[]; loading: boolean }) {
  const ref = useReveal<HTMLElement>()

  if (!loading && !categories.length) return null

  return (
    <section ref={ref} className="container-site py-16 lg:py-24">
      <SectionHeading
        eyebrow="COLLECTIONS"
        title="تصنيفات تشكيلتنا"
        subtitle="اختاري الطابع الذي يشبهكِ — من الكلاسيكي الخالد إلى العصري الجريء."
      />

      <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {(loading ? Array.from({ length: 6 }) : categories).map((cat, i) => {
          const category = cat as Category | undefined
          return (
            <Link
              key={category?.id ?? i}
              to={category ? `/dresses?cat=${category.slug}` : '#'}
              className="group relative block overflow-hidden bg-cream"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="aspect-[4/5] w-full overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5]">
                {category?.image_url ? (
                  <img
                    src={category.image_url}
                    alt={`تصنيف ${category.name_ar}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.07]"
                  />
                ) : (
                  <div className="h-full w-full bg-cream" />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-center sm:p-6">
                <h3 className="font-display text-xl text-white sm:text-2xl">{category?.name_ar ?? <span className="skeleton inline-block h-5 w-24" />}</h3>
                {category?.name_en && (
                  <p className="mt-1 font-latin text-[10px] tracking-[0.35em] text-gold-light uppercase">{category.name_en}</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
