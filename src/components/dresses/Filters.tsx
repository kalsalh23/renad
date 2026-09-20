import { useEffect, useMemo, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import type { Dress } from '@/lib/types'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'
import { effectivePrices } from '@/lib/utils'

export interface FilterState {
  q: string
  cat: string
  size: string
  color: string
  min: string
  max: string
  mode: '' | 'rent' | 'sale'
  availableOnly: boolean
}

export const EMPTY_FILTERS: FilterState = {
  q: '',
  cat: '',
  size: '',
  color: '',
  min: '',
  max: '',
  mode: '',
  availableOnly: false,
}

export function parseFiltersFromParams(params: URLSearchParams): FilterState {
  return {
    q: params.get('q') ?? '',
    cat: params.get('cat') ?? '',
    size: params.get('size') ?? '',
    color: params.get('color') ?? '',
    min: params.get('min') ?? '',
    max: params.get('max') ?? '',
    mode: (params.get('mode') as FilterState['mode']) ?? '',
    availableOnly: params.get('avail') === '1',
  }
}

export function filtersToParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.cat) p.set('cat', f.cat)
  if (f.size) p.set('size', f.size)
  if (f.color) p.set('color', f.color)
  if (f.min) p.set('min', f.min)
  if (f.max) p.set('max', f.max)
  if (f.mode) p.set('mode', f.mode)
  if (f.availableOnly) p.set('avail', '1')
  return p
}

export function applyFilters(dresses: Dress[], f: FilterState): Dress[] {
  const q = f.q.trim().toLowerCase()
  return dresses.filter((d) => {
    if (q) {
      const haystack = [d.code, d.name_ar, d.name_en, d.design_type, d.fabric, d.colors?.join(' '), d.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    if (f.cat && d.category?.slug !== f.cat) return false
    if (f.size && !(d.sizes ?? []).includes(f.size)) return false
    if (f.color && !(d.colors ?? []).some((c) => c === f.color)) return false
    const prices = effectivePrices(d)
    const price = prices.sale ?? prices.rent ?? null
    if (f.min && (price === null || price < Number(f.min))) return false
    if (f.max && (price === null || price > Number(f.max))) return false
    if (f.mode === 'rent' && d.availability === 'sale') return false
    if (f.mode === 'sale' && d.availability === 'rent') return false
    if (f.availableOnly && d.status !== 'available') return false
    return true
  })
}

/** لوحة التصفية — تُستخدم في الشريط الجانبي وسطح المكتب وفي درج الهاتف */
export function FiltersPanel({
  filters,
  onChange,
  categories,
  dresses,
}: {
  filters: FilterState
  onChange: (f: FilterState) => void
  categories: Category[]
  dresses: Dress[]
}) {
  const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch })

  const sizes = useMemo(
    () => [...new Set(dresses.flatMap((d) => d.sizes ?? []))].sort((a, b) => Number(a) - Number(b)),
    [dresses],
  )
  const colors = useMemo(() => [...new Set(dresses.flatMap((d) => d.colors ?? []))], [dresses])

  return (
    <div className="space-y-7">
      {/* بحث */}
      <div>
        <label className="label" htmlFor="filter-q">بحث</label>
        <input
          id="filter-q"
          className="input"
          placeholder="اسم أو كود الفستان..."
          value={filters.q}
          onChange={(e) => set({ q: e.target.value })}
        />
      </div>

      {/* التصنيف */}
      <div>
        <span className="label">التصنيف</span>
        <div className="flex flex-wrap gap-2">
          <button className={cn('chip', !filters.cat && 'chip-active')} onClick={() => set({ cat: '' })}>الكل</button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={cn('chip', filters.cat === c.slug && 'chip-active')}
              onClick={() => set({ cat: filters.cat === c.slug ? '' : c.slug })}
            >
              {c.name_ar}
            </button>
          ))}
        </div>
      </div>

      {/* نوع الاستفادة */}
      <div>
        <span className="label">نوع الاستفادة</span>
        <div className="flex flex-wrap gap-2">
          {([
            { v: '', l: 'الكل' },
            { v: 'rent', l: 'للإيجار' },
            { v: 'sale', l: 'للشراء' },
          ] as const).map((o) => (
            <button
              key={o.v}
              className={cn('chip', filters.mode === o.v && 'chip-active')}
              onClick={() => set({ mode: o.v })}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* المقاس */}
      {sizes.length > 0 && (
        <div>
          <span className="label">المقاس</span>
          <div className="flex flex-wrap gap-2">
            <button className={cn('chip', !filters.size && 'chip-active')} onClick={() => set({ size: '' })}>الكل</button>
            {sizes.map((s) => (
              <button
                key={s}
                className={cn('chip font-latin', filters.size === s && 'chip-active')}
                onClick={() => set({ size: filters.size === s ? '' : s })}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* اللون */}
      {colors.length > 0 && (
        <div>
          <span className="label">اللون</span>
          <div className="flex flex-wrap gap-2">
            <button className={cn('chip', !filters.color && 'chip-active')} onClick={() => set({ color: '' })}>الكل</button>
            {colors.map((c) => (
              <button
                key={c}
                className={cn('chip', filters.color === c && 'chip-active')}
                onClick={() => set({ color: filters.color === c ? '' : c })}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* السعر */}
      <div>
        <span className="label">السعر ($)</span>
        <div className="flex items-center gap-2">
          <input
            className="input !py-2 text-center"
            type="number"
            min={0}
            placeholder="من"
            value={filters.min}
            onChange={(e) => set({ min: e.target.value })}
            aria-label="أقل سعر"
          />
          <span className="text-beige">—</span>
          <input
            className="input !py-2 text-center"
            type="number"
            min={0}
            placeholder="إلى"
            value={filters.max}
            onChange={(e) => set({ max: e.target.value })}
            aria-label="أعلى سعر"
          />
        </div>
      </div>

      {/* متوفر الآن */}
      <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
        <input
          type="checkbox"
          checked={filters.availableOnly}
          onChange={(e) => set({ availableOnly: e.target.checked })}
          className="h-4 w-4 accent-[#AE8B4F]"
        />
        متوفر الآن فقط
      </label>

      {JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS) && (
        <button onClick={() => onChange({ ...EMPTY_FILTERS })} className="text-xs text-gold-dark underline underline-offset-4">
          إعادة تعيين عوامل التصفية
        </button>
      )}
    </div>
  )
}

/** زر + درج التصفية على الهاتف */
export function MobileFilters({
  open,
  onOpen,
  onClose,
  children,
  activeCount,
}: {
  open: boolean
  onOpen: () => void
  onClose: () => void
  children: React.ReactNode
  activeCount: number
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button onClick={onOpen} className="btn-outline btn-sm lg:hidden">
        <SlidersHorizontal className="h-4 w-4" />
        التصفية
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-ivory p-6 pb-10 animate-slide-down">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-xl">التصفية</h3>
              <button onClick={onClose} className="btn-icon !h-9 !w-9" aria-label="إغلاق">
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
            <button onClick={onClose} className="btn-primary mt-8 w-full">
              عرض النتائج
            </button>
          </div>
        </div>
      )}
    </>
  )
}
