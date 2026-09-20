import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Dress } from '@/lib/types'
import { AVAILABILITY_META, DRESS_STATUS_META } from '@/lib/constants'
import { cn, fmtPrice } from '@/lib/utils'
import { useSEO } from '@/hooks/useSEO'

export default function DressesAdminPage() {
  useSEO({ title: 'إدارة الفساتين' })
  const [dresses, setDresses] = useState<Dress[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('dresses')
      .select('*, category:categories(name_ar)')
      .order('created_at', { ascending: false })
    setDresses((data as unknown as Dress[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () =>
      dresses.filter(
        (d) =>
          (!q || `${d.code} ${d.name_ar}`.toLowerCase().includes(q.toLowerCase())) &&
          (!status || d.status === status),
      ),
    [dresses, q, status],
  )

  const remove = async (dress: Dress) => {
    if (!window.confirm(`حذف الفستان ${dress.code} نهائيًا؟ لا يمكن التراجع.`)) return
    const { error } = await supabase.from('dresses').delete().eq('id', dress.id)
    if (error) {
      window.alert('تعذّر الحذف: ' + error.message)
      return
    }
    setDresses((prev) => prev.filter((d) => d.id !== dress.id))
  }

  const toggleFeatured = async (dress: Dress) => {
    const next = !dress.is_featured
    setDresses((prev) => prev.map((d) => (d.id === dress.id ? { ...d, is_featured: next } : d)))
    await supabase.from('dresses').update({ is_featured: next }).eq('id', dress.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">الفساتين</h1>
          <p className="mt-1 text-sm text-smoke">{dresses.length} فستان في التشكيلة</p>
        </div>
        <Link to="/admin/dresses/new" className="btn-gold">
          <Plus className="h-4 w-4" />
          إضافة فستان
        </Link>
      </div>

      {/* أدوات البحث */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-beige" />
          <input className="input ps-9" placeholder="بحث بالكود أو الاسم..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="تصفية الحالة">
          <option value="">كل الحالات</option>
          {Object.entries(DRESS_STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* الجدول */}
      <div className="card overflow-x-auto">
        <table className="table-lux">
          <thead>
            <tr>
              <th>الفستان</th>
              <th>التصنيف</th>
              <th>الأسعار</th>
              <th>الحالة</th>
              <th>مميز</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-beige">جارٍ التحميل...</td></tr>
            )}
            {!loading && !filtered.length && (
              <tr><td colSpan={6} className="py-10 text-center text-sm text-beige">لا توجد نتائج</td></tr>
            )}
            {filtered.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="flex items-center gap-3">
                    {d.cover_image ? (
                      <img src={d.cover_image} alt="" className="h-16 w-12 object-cover" />
                    ) : (
                      <div className="h-16 w-12 bg-cream" />
                    )}
                    <div>
                      <span className="font-latin text-xs font-bold tracking-wider">{d.code}</span>
                      <span className="block max-w-40 truncate text-[11px] text-smoke">{d.name_ar}</span>
                      <span className="text-[10px] text-beige">{AVAILABILITY_META[d.availability]}</span>
                    </div>
                  </div>
                </td>
                <td className="text-xs">{d.category?.name_ar ?? '—'}</td>
                <td className="text-xs">
                  {d.sale_price != null && <span className="block">شراء: <b>{fmtPrice(d.sale_price)}</b></span>}
                  {d.rent_price != null && <span className="block">إيجار: <b>{fmtPrice(d.rent_price)}</b></span>}
                  {d.sale_price == null && d.rent_price == null && '—'}
                </td>
                <td>
                  <span className={cn('status-pill', DRESS_STATUS_META[d.status].pill)}>
                    {DRESS_STATUS_META[d.status].label}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggleFeatured(d)}
                    className={cn('text-lg transition-colors', d.is_featured ? 'text-gold' : 'text-champagne hover:text-gold-dark')}
                    title="تمييز الفستان"
                  >
                    ★
                  </button>
                </td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <Link to={`/admin/dresses/${d.id}`} className="btn-icon !h-8 !w-8" title="تعديل">
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button onClick={() => remove(d)} className="btn-icon !h-8 !w-8 !border-rose-200 text-rose-500 hover:!border-rose-400" title="حذف">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
