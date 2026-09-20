import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ImagePlus, Loader2, Rotate3d, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Category, DisplayMode, Dress, DressStatus, Availability } from '@/lib/types'
import { AVAILABILITY_META, DRESS_STATUS_META, DISPLAY_MODE_META, MIN_FRAMES_FOR_360 } from '@/lib/constants'
import { cn, slugifyCode } from '@/lib/utils'
import { sortFrameFiles, uploadImage, validateImageFile } from '@/lib/upload'
import { useToast } from '@/context/ToastContext'
import { useSEO } from '@/hooks/useSEO'

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
  display_mode: DisplayMode
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
  display_mode: 'images',
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
  const [images, setImages] = useState<{ id?: string; url: string }[]>([])
  const [frames, setFrames] = useState<{ id?: string; url: string }[]>([])
  const [coverPreview, setCoverPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [uploadingFrames, setUploadingFrames] = useState(false)
  const framesInputRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [])

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const [{ data: dress }, imgRes, frameRes] = await Promise.all([
        supabase.from('dresses').select('*').eq('id', id).maybeSingle(),
        supabase.from('dress_images').select('*').eq('dress_id', id).order('sort_order'),
        supabase.from('dress_360_frames').select('*').eq('dress_id', id).order('frame_index'),
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
          display_mode: d.display_mode,
          is_featured: d.is_featured,
          discount_percent: String(d.discount_percent ?? 0),
          sort_order: String(d.sort_order ?? 0),
          is_active: d.is_active,
          cover_image: d.cover_image ?? '',
        })
        setCoverPreview(d.cover_image ?? '')
      }
      setImages((imgRes.data as { id: string; url: string }[]) ?? [])
      setFrames((frameRes.data as { id: string; url: string }[]) ?? [])
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

  /* ---------- رفع صور المعرض ---------- */
  const onImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length || !id) return toast('error', 'احفظ الفستان أولًا قبل رفع صور المعرض')
    setBusy(true)
    for (const file of files) {
      const res = await uploadImage(file, 'dress-images', id)
      if (res.ok) setImages((prev) => [...prev, { url: res.url! }])
      else toast('error', res.error ?? '')
    }
    setBusy(false)
  }

  /* ---------- رفع إطارات 360 ---------- */
  const onFramesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = sortFrameFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
    if (!files.length || !id) return toast('error', 'احفظ الفستان أولًا قبل رفع الإطارات')
    setUploadingFrames(true)
    let index = frames.length
    for (const file of files) {
      const res = await uploadImage(file, 'dress-360', id)
      if (res.ok) {
        setFrames((prev) => [...prev, { url: res.url!, id: `tmp-${index}` }])
        index += 1
      } else {
        toast('error', res.error ?? '')
        break
      }
    }
    setUploadingFrames(false)
  }

  const removeFrame = async (frame: { id?: string; url: string }, i: number) => {
    setFrames((prev) => prev.filter((_, idx) => idx !== i))
    if (frame.id && !frame.id.startsWith('tmp-')) {
      await supabase.from('dress_360_frames').delete().eq('id', frame.id)
    }
  }

  const removeImage = async (img: { id?: string; url: string }) => {
    setImages((prev) => prev.filter((x) => x !== img))
    if (img.id) await supabase.from('dress_images').delete().eq('id', img.id)
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
      display_mode: form.display_mode,
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

    // مزامنة صور المعرض الجديدة (URLs المؤقتة المرفوعة تحت مجلد مؤقت)
    if (dressId) {
      const newImages = images.filter((i) => !i.id)
      if (newImages.length) {
        await supabase.from('dress_images').insert(
          newImages.map((i, idx) => ({ dress_id: dressId, url: i.url, sort_order: images.indexOf(i) + idx })),
        )
      }
      const newFrames = frames.filter((f) => !f.id || f.id.startsWith('tmp-'))
      if (newFrames.length) {
        await supabase.from('dress_360_frames').insert(
          newFrames.map((f, idx) => ({ dress_id: dressId, url: f.url, frame_index: frames.indexOf(f) + idx })),
        )
      }
    }

    setBusy(false)
    toast('success', isEdit ? 'تم حفظ التعديلات' : 'تمت إضافة الفستان — يمكنكِ الآن رفع الصور والإطارات')
    navigate(`/admin/dresses/${dressId}`, { replace: true })
  }

  if (loading) return <p className="py-16 text-center text-sm text-beige">جارٍ التحميل...</p>

  const needFrames = form.display_mode === '360' || form.display_mode === 'both'

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

        {/* صور المعرض */}
        <div>
          <label className="label">صور المعرض {id ? '' : '(بعد الحفظ الأول)'}</label>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={img.id ?? img.url} className="group relative h-24 w-18 w-[72px] overflow-hidden border border-champagne-light">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => removeImage(img)}
                  className="absolute inset-0 flex items-center justify-center bg-ink/60 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label="حذف الصورة">
                  <Trash2 className="h-4 w-4" />
                </button>
                <span className="absolute bottom-0 start-0 bg-ink/60 px-1 text-[9px] text-white">{i + 1}</span>
              </div>
            ))}
            {id && (
              <label className="flex h-24 w-[72px] cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-champagne text-beige transition-colors hover:border-gold hover:text-gold-dark">
                <ImagePlus className="h-5 w-5" />
                <span className="text-[9px]">إضافة</span>
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onImagesChange} />
              </label>
            )}
          </div>
          <p className="mt-2 text-[11px] text-beige">أمام / خلف / جانب / تفاصيل التطريز — JPG, PNG, WebP حتى 8MB</p>
        </div>
      </section>

      {/* 360 */}
      <section className="card space-y-5 p-6">
        <h2 className="flex items-center gap-2 font-display text-xl">
          <Rotate3d className="h-5 w-5 text-gold-dark" />
          نوع العرض وإطارات 360°
        </h2>

        <div className="flex flex-wrap gap-2">
          {(Object.entries(DISPLAY_MODE_META) as [DisplayMode, string][]).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => set('display_mode', k)}
              className={cn('chip', form.display_mode === k && 'chip-active')}
            >
              {v}
            </button>
          ))}
        </div>

        {needFrames && (
          <div>
            <label className="label">إطارات 360° {id ? '' : '(بعد الحفظ الأول)'}</label>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
              {frames.map((f, i) => (
                <div key={f.id ?? f.url} className="group relative aspect-[3/4] overflow-hidden border border-champagne-light bg-cream">
                  <img src={f.url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute start-1 top-1 rounded-sm bg-ink/60 px-1 text-[9px] text-white">{i + 1}</span>
                  <button type="button" onClick={() => removeFrame(f, i)}
                    className="absolute inset-0 flex items-center justify-center bg-ink/60 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label="حذف الإطار">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {id && (
                <button
                  type="button"
                  onClick={() => framesInputRef.current?.click()}
                  className="flex aspect-[3/4] flex-col items-center justify-center gap-1 border border-dashed border-champagne text-beige transition-colors hover:border-gold hover:text-gold-dark"
                >
                  {uploadingFrames ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                  <span className="text-[9px]">رفع إطارات</span>
                </button>
              )}
            </div>
            <input ref={framesInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFramesChange} />
            <p className="mt-2 text-[11px] leading-5 text-beige">
              اختاري كل الإطارات دفعة واحدة — تُرتّب تلقائيًا حسب أسماء الملفات (01.webp, 02.webp...).
              الحد الأدنى {MIN_FRAMES_FOR_360} إطارًا، ويُفضّل 24–36 إطارًا بصيغة WebP.
              {frames.length >= MIN_FRAMES_FOR_360 ? ` ✓ لديكِ ${frames.length} إطارًا` : ` — لديكِ ${frames.length}`}
            </p>
          </div>
        )}
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
