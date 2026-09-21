import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { supabase, SUPABASE_URL } from '@/lib/supabase'
import type { Category, Dress, DressStatus, Availability } from '@/lib/types'
import { AVAILABILITY_META, DRESS_STATUS_META } from '@/lib/constants'
import { cn, slugifyCode } from '@/lib/utils'
import { uploadImage, validateImageFile } from '@/lib/upload'
import { useToast } from '@/context/ToastContext'
import { useSEO } from '@/hooks/useSEO'

interface ImageItem {
  id?: string
  url: string
  /** مسار ملف مؤقت لفستان جديد لم يُحفظ بعد — يُنقل لمجلد الفستان عند الحفظ */
  pendingPath?: string
}

interface FormState {
  code: string
  name_ar: string
  name_en: string
  description: string
  category_id: string
  design_type: string
  sizes: string
  colors: string
  fabric: string
  sale_price: string
  rent_price: string
  availability: Availability
  status: DressStatus
  is_featured: boolean
  discount_percent: string
  sort_order: string
  is_active: boolean
  cover_image: string
}

const EMPTY: FormState = {
  code: '',
  name_ar: '',
  name_en: '',
  description: '',
  category_id: '',
  design_type: '',
  sizes: '',
  colors: '',
  fabric: '',
  sale_price: '',
  rent_price: '',
  availability: 'both',
  status: 'available',
  is_featured: false,
  discount_percent: '0',
  sort_order: '0',
  is_active: true,
  cover_image: '',
}

export default function DressFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()
  useSEO({ title: isEdit ? 'تعديل فستان' : 'إضافة فستان' })

  const [form, setForm] = useState<FormState>(EMPTY)
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<ImageItem[]>([])
  const [coverPreview, setCoverPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  // مجلد مؤقت للفستان الجديد قبل الحفظ الأول — تُرفع صوره هناك ثم تُنقل عند الحفظ
  const pendingRef = useRef(
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  )

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [])

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const [{ data: dress }, imgRes] = await Promise.all([
        supabase.from('dresses').select('*').eq('id', id).maybeSingle(),
        supabase.from('dress_images').select('*').eq('dress_id', id).order('sort_order'),
      ])
      if (dress) {
        const d = dress as Dress
        setForm({
          code: d.code,
          name_ar: d.name_ar ?? '',
          name_en: d.name_en ?? '',
          description: d.description ?? '',
          category_id: d.category_id ?? '',
          design_type: d.design_type ?? '',
          sizes: (d.sizes ?? []).join(', '),
          colors: (d.colors ?? []).join(', '),
          fabric: d.fabric ?? '',
          sale_price: d.sale_price != null ? String(d.sale_price) : '',
          rent_price: d.rent_price != null ? String(d.rent_price) : '',
          availability: d.availability,
          status: d.status,
          is_featured: d.is_featured,
          discount_percent: String(d.discount_percent ?? 0),
          sort_order: String(d.sort_order ?? 0),
          is_active: d.is_active,
          cover_image: d.cover_image ?? '',
        })
        setCoverPreview(d.cover_image ?? '')
      }
      setImages((imgRes.data as { id: string; url: string }[]) ?? [])
      setLoading(false)
    })()
  }, [id])

  /* ---------- رفع صورة الغلاف ---------- */
  const onCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const invalid = validateImageFile(file)
    if (invalid) return toast('error', invalid)
    setBusy(true)
    const res = await uploadImage(file, 'dress-images', 'covers')
    setBusy(false)
    if (!res.ok) return toast('error', res.error ?? 'فشل الرفع')
    setCoverPreview(res.url!)
    set('cover_image', res.url!)
  }

  /* ---------- رفع صور المعرض — يعمل حتى قبل الحفظ الأول (مجلد مؤقت + نقل تلقائي) ---------- */
  const onImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    let okCount = 0
    for (const file of files) {
      const folder = id ? id : `pending/${pendingRef.current}`
      const res = await uploadImage(file, 'dress-images', folder)
      if (res.ok) {
        okCount++
        setImages((prev) => [
          ...prev,
          id ? { url: res.url! } : { url: res.url!, pendingPath: `${folder}/${res.url!.split('/').pop()}` },
        ])
      } else {
        toast('error', res.error ?? 'فشل الرفع')
      }
    }
    setBusy(false)
    if (okCount) toast('success', `تم رفع ${okCount} صورة`)
  }

  const removeImage = async (img: ImageItem) => {
    setImages((prev) => prev.filter((x) => x !== img))
    try {
      if (img.id) await supabase.from('dress_images').delete().eq('id', img.id)
      if (img.pendingPath) {
        await supabase.storage.from('dress-images').remove([img.pendingPath])
      } else if (!img.id) {
        const storagePath = img.url.split('/object/public/dress-images/')[1]
        if (storagePath) await supabase.storage.from('dress-images').remove([decodeURIComponent(storagePath)])
      }
    } catch {
      // الحذف من التخزين أفضل-effort — الصف في قاعدة البيانات هو الأهم
    }
  }

  /* ---------- الحفظ ---------- */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim()) return toast('error', 'كود الفستان مطلوب')

    const payload = {
      code: form.code.trim().toUpperCase(),
      slug: slugifyCode(form.code),
      name_ar: form.name_ar.trim() || form.code.trim(),
      name_en: form.name_en.trim() || null,
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      design_type: form.design_type.trim() || null,
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
      fabric: form.fabric.trim() || null,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      rent_price: form.rent_price ? Number(form.rent_price) : null,
      availability: form.availability,
      status: form.status,
      display_mode: 'images' as const,
      is_featured: form.is_featured,
      discount_percent: Math.min(Math.max(Number(form.discount_percent) || 0, 0), 90),
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      cover_image: form.cover_image || null,
    }

    setBusy(true)
    let dressId = id
    if (isEdit) {
      const { error } = await supabase.from('dresses').update(payload).eq('id', id)
      if (error) {
        setBusy(false)
        return toast('error', 'تعذّر الحفظ: ' + error.message)
      }
    } else {
      const { data, error } = await supabase.from('dresses').insert(payload).select('id').single()
      if (error) {
        setBusy(false)
        return toast('error', 'تعذّر الحفظ: ' + error.message)
      }
      dressId = data!.id as string
    }

    // مزامنة صور المعرض: نقل المؤقتة إلى مجلد الفستان ثم حفظ الصفوف
    if (dressId) {
      for (const img of images) {
        if (!img.pendingPath) continue
        const filename = img.pendingPath.split('/').pop() ?? `img-${Date.now()}.jpg`
        const newPath = `${dressId}/${filename}`
        const { error: moveErr } = await supabase.storage.from('dress-images').move(img.pendingPath, newPath)
        if (!moveErr) {
          img.url = `${SUPABASE_URL}/storage/v1/object/public/dress-images/${newPath}`
          delete img.pendingPath
        } else {
          // إن تعذّر النقل نُبقي الرابط المؤقت — الصورة صالحة ومعروضة
          console.warn('move failed:', moveErr.message)
        }
      }
      const newImages = images.filter((i) => !i.id)
      if (newImages.length) {
        await supabase.from('dress_images').insert(
          newImages.map((img, i) => ({
            dress_id: dressId,
            url: img.url,
            sort_order: images.indexOf(img),
            alt: `${i + 1}`,
          })),
        )
      }
    }

    setBusy(false)
    toast('success', isEdit ? 'تم حفظ التعديلات' : 'تمت إضافة الفستان — يمكنكِ الآن رفع صور الزوايا')
    navigate(`/admin/dresses/${dressId}`, { replace: true })
  }

  if (loading) return <p className="py-16 text-center text-sm text-beige">جارٍ التحميل...</p>

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/admin/dresses')} className="btn-icon !h-9 !w-9" aria-label="رجوع">
            <ArrowRight className="h-4 w-4" />
          </button>
          <h1 className="font-display text-3xl">{isEdit ? `تعديل: ${form.code}` : 'إضافة فستان جديد'}</h1>
        </div>
        <button type="submit" disabled={busy} className="btn-gold btn-sm">
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          حفظ
        </button>
      </div>

      {/* البيانات الأساسية */}
      <section className="card space-y-5 p-6">
        <h2 className="font-display text-xl">البيانات الأساسية</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">كود الفستان *</label>
            <input className="input font-latin" required value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="RENAD-024" />
          </div>
          <div>
            <label className="label">اسم الفستان</label>
            <input className="input" value={form.name_ar} onChange={(e) => set('name_ar', e.target.value)} placeholder="مثال: فستان زفاف بتاج اللؤلؤ" />
          </div>
          <div>
            <label className="label">التصنيف</label>
            <select className="input" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">— بدون —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name_ar}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">نوع التصميم</label>
            <input className="input" value={form.design_type} onChange={(e) => set('design_type', e.target.value)} placeholder="مثال: أميرة، حورية، A-Line" />
          </div>
        </div>
        <div>
          <label className="label">الوصف</label>
          <textarea className="input" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="وصف جاذبي يشرح تفاصيل الفستان..." />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label">المقاسات (مفصولة بفاصلة)</label>
            <input className="input" value={form.sizes} onChange={(e) => set('sizes', e.target.value)} placeholder="S, M, L" />
          </div>
          <div>
            <label className="label">الألوان (مفصولة بفاصلة)</label>
            <input className="input" value={form.colors} onChange={(e) => set('colors', e.target.value)} placeholder="أبيض, عاجي" />
          </div>
          <div>
            <label className="label">نوع القماش</label>
            <input className="input" value={form.fabric} onChange={(e) => set('fabric', e.target.value)} placeholder="ساتان، تول، دانتيل" />
          </div>
        </div>
      </section>

      {/* الأسعار والحالة */}
      <section className="card space-y-5 p-6">
        <h2 className="font-display text-xl">الأسعار والحالة</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label">نوع العرض التجاري</label>
            <select className="input" value={form.availability} onChange={(e) => set('availability', e.target.value as Availability)}>
              {Object.entries(AVAILABILITY_META).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">سعر الشراء ($)</label>
            <input type="number" min={0} className="input font-latin" value={form.sale_price}
              onChange={(e) => set('sale_price', e.target.value)}
              disabled={form.availability === 'rent'} placeholder="1500" />
          </div>
          <div>
            <label className="label">سعر الإيجار ($)</label>
            <input type="number" min={0} className="input font-latin" value={form.rent_price}
              onChange={(e) => set('rent_price', e.target.value)}
              disabled={form.availability === 'sale'} placeholder="350" />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-4">
          <div>
            <label className="label">حالة الفستان</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value as DressStatus)}>
              {Object.entries(DRESS_STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">الخصم %</label>
            <input type="number" min={0} max={90} className="input font-latin" value={form.discount_percent}
              onChange={(e) => set('discount_percent', e.target.value)} />
          </div>
          <div>
            <label className="label">ترتيب الظهور</label>
            <input type="number" className="input font-latin" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          </div>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-[#AE8B4F]" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} />
              فستان مميز
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-[#AE8B4F]" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
              ظاهر في الموقع
            </label>
          </div>
        </div>
      </section>

      {/* الصور */}
      <section className="card space-y-5 p-6">
        <h2 className="font-display text-xl">الصور</h2>

        {/* الغلاف */}
        <div>
          <label className="label">صورة الغلاف</label>
          <div className="flex items-center gap-4">
            <div className="h-32 w-24 shrink-0 overflow-hidden border border-champagne-light bg-cream">
              {coverPreview ? <img src={coverPreview} alt="الغلاف" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-beige">لا غلاف</div>}
            </div>
            <label className="btn-outline btn-sm cursor-pointer">
              <ImagePlus className="h-4 w-4" />
              اختيار صورة الغلاف
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onCoverChange} />
            </label>
          </div>
        </div>

        {/* صور المعرض — زوايا متعددة لنفس الفستان (يمكن الرفع قبل الحفظ) */}
        <div>
          <label className="label">صور المعرض — زوايا متعددة لنفس الفستان</label>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={img.id ?? img.url} className="group relative h-24 w-[72px] overflow-hidden border border-champagne-light">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeImage(img)}
                  className="absolute inset-0 flex items-center justify-center bg-ink/60 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label="حذف الصورة">
                  <Trash2 className="h-4 w-4" />
                </button>
                <span className="absolute bottom-0 start-0 bg-ink/60 px-1 text-[9px] text-white">{i + 1}</span>
              </div>
            ))}
            <label className={cn('flex h-24 w-[72px] cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-champagne text-beige transition-colors hover:border-gold hover:text-gold-dark', busy && 'pointer-events-none opacity-50')}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              <span className="text-[9px]">إضافة</span>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onImagesChange} />
            </label>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-beige">
            أضيفي صورًا لنفس الفستان من زوايا مختلفة بالترتيب: الأمام، الجانب، الخلف، تفاصيل القماش —
            بدون صور للعروسات، فقط الفستان. JPG, PNG, WebP حتى 8MB.
          </p>
        </div>
      </section>

      <div className="flex justify-end gap-3 pb-8">
        <Link to="/admin/dresses" className="btn-outline">إلغاء</Link>
        <button type="submit" disabled={busy} className="btn-gold">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'حفظ التعديلات' : 'حفظ الفستان'}
        </button>
      </div>
    </form>
  )
}
