import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Dress } from '@/lib/types'
import { useDresses, useCategories } from '@/hooks/useData'
import {
  applyFilters,
  EMPTY_FILTERS,
  FiltersPanel,
  MobileFilters,
  parseFiltersFromParams,
  filtersToParams,
  type FilterState,
} from '@/components/dresses/Filters'
import { DressGrid } from '@/components/dresses/DressGrid'
import { useSEO } from '@/hooks/useSEO'

export default function DressesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<FilterState>(() => parseFiltersFromParams(searchParams))
  const [sort, setSort] = useState('featured')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { dresses, loading } = useDresses()
  const { categories } = useCategories()

  useSEO({ title: 'الفساتين', description: 'تصفحي تشكيلة فساتين الأعراس في ريناد — تصفية حسب التصنيف والمقاس واللون والسعر.' })

  // مزامنة الفلاتر مع رابط الصفحة (قابل للمشاركة)
  useEffect(() => {
    setSearchParams(filtersToParams(filters), { replace: true })
  }, [filters, setSearchParams])

  const filtered = useMemo(() => applyFilters(dresses, filters), [dresses, filters])

  const activeCount = useMemo(() => {
    let n = 0
    if (filters.cat) n++
    if (filters.size) n++
    if (filters.color) n++
    if (filters.min || filters.max) n++
    if (filters.mode) n++
    if (filters.availableOnly) n++
    return n
  }, [filters])

  const activeCategory = categories.find((c) => c.slug === filters.cat)

  return (
    <div className="container-site pb-20 pt-28 lg:pt-36">
      {/* ترويسة */}
      <div className="mb-10 text-center">
        <p className="eyebrow">THE COLLECTION</p>
        <h1 className="heading-display mt-2">{activeCategory ? activeCategory.name_ar : 'فساتين ريناد'}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-smoke">
          {loading ? 'جارٍ التحميل...' : `${filtered.length} فستان متاح للاستعراض`}
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
        {/* شريط التصفية الجانبي — سطح المكتب */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <h2 className="mb-6 font-display text-xl">التصفية</h2>
            <FiltersPanel filters={filters} onChange={setFilters} categories={categories} dresses={dresses} />
          </div>
        </aside>

        <div>
          {/* شريط الأدوات */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <MobileFilters open={drawerOpen} onOpen={() => setDrawerOpen(true)} onClose={() => setDrawerOpen(false)} activeCount={activeCount}>
              <FiltersPanel filters={filters} onChange={setFilters} categories={categories} dresses={dresses} />
            </MobileFilters>

            <div className="flex items-center gap-2 text-xs text-smoke">
              <span className="hidden sm:inline">ترتيب:</span>
              <select
                className="input !w-auto !py-2 text-xs"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="ترتيب النتائج"
              >
                <option value="featured">المميزة أولًا</option>
                <option value="newest">الأحدث</option>
                <option value="price_asc">السعر: الأقل أولًا</option>
                <option value="price_desc">السعر: الأعلى أولًا</option>
              </select>
            </div>
          </div>

          <DressGrid
            dresses={sortDresses(filtered, sort)}
            loading={loading}
            count={8}
            emptyAction={
              <button onClick={() => setFilters({ ...EMPTY_FILTERS })} className="btn-outline btn-sm">
                إعادة تعيين التصفية
              </button>
            }
          />
        </div>
      </div>
    </div>
  )
}

function sortDresses(dresses: Dress[], sort: string): Dress[] {
  const arr = [...dresses]
  if (sort === 'price_asc') arr.sort((a, b) => (minPrice(a) ?? Infinity) - (minPrice(b) ?? Infinity))
  else if (sort === 'price_desc') arr.sort((a, b) => (minPrice(b) ?? -1) - (minPrice(a) ?? -1))
  else if (sort === 'newest') arr.sort((a, b) => b.created_at.localeCompare(a.created_at))
  else arr.sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
  return arr
}

function minPrice(d: Dress): number | null {
  if (d.sale_price != null) return d.sale_price
  if (d.rent_price != null) return d.rent_price
  return null
}

/** صفحة قائمة مخصصة (الإيجار / الشراء) مع غلاف */
export function ListingPage({ mode }: { mode: 'rent' | 'sale' }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...parseFiltersFromParams(searchParams),
    mode,
  }))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { dresses, loading } = useDresses()
  const { categories } = useCategories()

  const isRent = mode === 'rent'
  useSEO({
    title: isRent ? 'فساتين للإيجار' : 'فساتين للبيع',
    description: isRent
      ? 'فساتين أعراس فاخرة متاحة للإيجار في معرض ريناد — احجزي موعد تجربة اليوم.'
      : 'فساتين أعراس متاحة للشراء من تشكيلة ريناد المختارة.',
  })

  useEffect(() => {
    const p = filtersToParams(filters)
    p.delete('mode')
    setSearchParams(p, { replace: true })
  }, [filters, setSearchParams])

  const filtered = useMemo(() => applyFilters(dresses, { ...filters, mode }), [dresses, filters])

  return (
    <div className="pb-20">
      {/* الغلاف */}
      <div className="relative flex items-center justify-center bg-ink py-24 lg:py-32">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(ellipse_at_center,rgba(174,139,79,0.6),transparent_60%)]" />
        <div className="relative z-10 text-center">
          <p className="eyebrow !text-gold-light">{isRent ? 'FOR RENT' : 'FOR SALE'}</p>
          <h1 className="mt-3 font-display text-4xl text-white lg:text-5xl">
            {isRent ? 'فساتين للإيجار' : 'فساتين للبيع'}
          </h1>
          <p className="mx-auto mt-3 max-w-md px-6 text-sm leading-7 text-white/70">
            {isRent
              ? 'إطلالة الأحمال الأجمل بسعر مناسب — احجزي تجربتك واختاري فستانك بثقة.'
              : 'قطع استثنائية تبقى معكِ — تصفحي الفساتين المتاحة للشراء.'}
          </p>
        </div>
      </div>

      <div className="container-site grid gap-10 pt-12 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <h2 className="mb-6 font-display text-xl">التصفية</h2>
            <FiltersPanel filters={filters} onChange={setFilters} categories={categories} dresses={dresses} />
          </div>
        </aside>
        <div>
          <div className="mb-6 lg:hidden">
            <MobileFilters open={drawerOpen} onOpen={() => setDrawerOpen(true)} onClose={() => setDrawerOpen(false)} activeCount={1}>
              <FiltersPanel filters={filters} onChange={setFilters} categories={categories} dresses={dresses} />
            </MobileFilters>
          </div>
          <DressGrid dresses={filtered} loading={loading} count={8} />
        </div>
      </div>

      <div className="container-site mt-16 text-center">
        <Link to="/dresses" className="text-sm text-gold-dark underline underline-offset-8">
          تصفحي التشكيلة كاملة
        </Link>
      </div>
    </div>
  )
}
