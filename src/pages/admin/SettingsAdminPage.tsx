import { useEffect, useState } from 'react'
import { Check, Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { BusinessSettings, WorkingHour } from '@/lib/types'
import { useBusinessSettingsFull } from '@/hooks/useData'
import { useToast } from '@/context/ToastContext'
import { useSEO } from '@/hooks/useSEO'
import { uploadImage } from '@/lib/upload'
import { cn, todayISO } from '@/lib/utils'

const SECTIONS = [
  { id: 'brand', label: 'الهوية' },
  { id: 'contact', label: 'التواصل' },
  { id: 'hero', label: 'الواجهة الرئيسية' },
  { id: 'about', label: 'من نحن' },
  { id: 'hours', label: 'أوقات العمل' },
  { id: 'gallery', label: 'صور المعرض' },
] as const

export default function SettingsAdminPage() {
  useSEO({ title: 'الإعدادات والمحتوى' })
  const { settings, loading, reload } = useBusinessSettingsFull()
  const { toast } = useToast()
  const [active, setActive] = useState<(typeof SECTIONS)[number]['id']>('brand')
  const [form, setForm] = useState<BusinessSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [blockedInput, setBlockedInput] = useState('')

  useEffect(() => {
    if (settings && !form) {
      setForm({ ...settings })
      setBlockedInput((settings.blocked_dates ?? []).join(', '))
    }
  }, [settings, form])

  if (loading || !form) return <p className="py-16 text-center text-sm text-beige">جارٍ التحميل...</p>

  const set = <K extends keyof BusinessSettings>(k: K, v: BusinessSettings[K]) => setForm({ ...form, [k]: v })

  /** تطبيق فوري للتغييرات على قاعدة البيانات + تحديث النموذج المحلي (لصور الهيرو/من نحن/المعرض) */
  const instantSave = async (patch: Partial<BusinessSettings>, successMsg?: string) => {
    setForm((f) => (f ? { ...f, ...patch } : f))
    const { error } = await supabase.from('business_settings').update(patch).eq('id', 1)
    if (error) {
      toast('error', 'تعذّر التطبيق: ' + error.message)
      return false
    }
    if (successMsg) toast('success', successMsg)
    reload()
    return true
  }

  const save = async () => {
    setBusy(true)
    const blocked = blockedInput.split(',').map((s) => s.trim()).filter(Boolean)
    // استبعاد مفاتيح القراءة فقط التي تُفشل التعديل إن أُرسلت (id/updated_at)
    const { id: _id, updated_at: _u, ...payload } = form
    const { error } = await supabase
      .from('business_settings')
      .update({ ...payload, blocked_dates: blocked })
      .eq('id', 1)
    setBusy(false)
    if (error) return toast('error', 'تعذّر الحفظ: ' + error.message)
    toast('success', 'تم حفظ الإعدادات — ظهرت التغييرات في الموقع مباشرة')
    reload()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">الإعدادات والمحتوى</h1>
          <p className="mt-1 text-sm text-smoke">كل ما يظهر في الموقع يُدار من هنا — بدون كود</p>
        </div>
        <button onClick={save} disabled={busy} className="btn-gold">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ
        </button>
      </div>

      {/* تبويبات */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => setActive(s.id)} className={cn('chip shrink-0', active === s.id && 'chip-active')}>
            {s.label}
          </button>
        ))}
      </div>

      {/* الهوية */}
      {active === 'brand' && (
        <section className="card space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">اسم المعرض (عربي)</label>
              <input className="input" value={form.brand_name_ar} onChange={(e) => set('brand_name_ar', e.target.value)} />
            </div>
            <div>
              <label className="label">اسم المعرض (لاتيني)</label>
              <input className="input font-latin" dir="ltr" value={form.brand_name_en} onChange={(e) => set('brand_name_en', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">الشعار النصي (Tagline)</label>
            <input className="input" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </div>
        </section>
      )}

      {/* التواصل */}
      {active === 'contact' && (
        <section className="card space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">رقم الهاتف</label>
              <input className="input" dir="ltr" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">رقم واتساب (بصيغة دولية بدون +)</label>
              <input className="input" dir="ltr" value={form.whatsapp_number ?? ''} onChange={(e) => set('whatsapp_number', e.target.value)} placeholder="9639XXXXXXXX" />
            </div>
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input className="input" dir="ltr" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <label className="label">حساب انستغرام</label>
              <input className="input" dir="ltr" value={form.instagram_handle ?? ''} onChange={(e) => set('instagram_handle', e.target.value)} placeholder="renad.atelier" />
            </div>
            <div>
              <label className="label">رابط انستغرام</label>
              <input className="input" dir="ltr" value={form.instagram_url ?? ''} onChange={(e) => set('instagram_url', e.target.value)} />
            </div>
            <div>
              <label className="label">رابط فيسبوك</label>
              <input className="input" dir="ltr" value={form.facebook_url ?? ''} onChange={(e) => set('facebook_url', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">عنوان المعرض</label>
              <input className="input" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div>
              <label className="label">رابط الاتجاهات (Google Maps)</label>
              <input className="input" dir="ltr" value={form.maps_url ?? ''} onChange={(e) => set('maps_url', e.target.value)} />
            </div>
            <div>
              <label className="label">بحث الخريطة (يظهر في صفحة التواصل)</label>
              <input className="input" value={form.maps_embed_query ?? ''} onChange={(e) => set('maps_embed_query', e.target.value)} placeholder="دمشق، سوريا" />
            </div>
          </div>
        </section>
      )}

      {/* الواجهة الرئيسية */}
      {active === 'hero' && (
        <section className="card space-y-4 p-6">
          <div>
            <label className="label">العنوان الرئيسي</label>
            <input className="input" value={form.hero_title} onChange={(e) => set('hero_title', e.target.value)} />
          </div>
          <div>
            <label className="label">النص التعريفي</label>
            <textarea className="input" value={form.hero_subtitle} onChange={(e) => set('hero_subtitle', e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">نص الزر الأول</label>
              <input className="input" value={form.hero_cta_primary} onChange={(e) => set('hero_cta_primary', e.target.value)} />
            </div>
            <div>
              <label className="label">نص الزر الثاني</label>
              <input className="input" value={form.hero_cta_secondary} onChange={(e) => set('hero_cta_secondary', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">صورة الواجهة (Hero) — تُطبَّق فورًا عند الرفع</label>
            <div className="flex items-center gap-4">
              <div className="h-24 w-40 overflow-hidden border border-champagne-light bg-cream">
                {form.hero_image && <img src={form.hero_image} alt="" className="h-full w-full object-cover" />}
              </div>
              <label className={cn('btn-outline btn-sm cursor-pointer', busy && 'pointer-events-none opacity-50')}>
                {busy ? 'جارٍ الرفع...' : 'تغيير صورة الهيرو'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    setBusy(true)
                    const res = await uploadImage(file, 'hero-images', 'hero')
                    setBusy(false)
                    if (res.ok) await instantSave({ hero_image: res.url! }, 'تم تحديث صورة الهيرو — ظهرت على الموقع فورًا')
                    else toast('error', res.error ?? 'فشل الرفع')
                  }} />
              </label>
            </div>
          </div>
        </section>
      )}

      {/* من نحن */}
      {active === 'about' && (
        <section className="card space-y-4 p-6">
          <div>
            <label className="label">عنوان الصفحة</label>
            <input className="input" value={form.about_title} onChange={(e) => set('about_title', e.target.value)} />
          </div>
          <div>
            <label className="label">نص القصة</label>
            <textarea className="input !min-h-32" value={form.about_body} onChange={(e) => set('about_body', e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">الرؤية</label>
              <textarea className="input !min-h-24" value={form.about_vision} onChange={(e) => set('about_vision', e.target.value)} />
            </div>
            <div>
              <label className="label">الرسالة</label>
              <textarea className="input !min-h-24" value={form.about_mission} onChange={(e) => set('about_mission', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">صورة صفحة من نحن — تُطبَّق فورًا عند الرفع</label>
            <div className="flex items-center gap-4">
              <div className="h-24 w-40 overflow-hidden border border-champagne-light bg-cream">
                {form.about_image && <img src={form.about_image} alt="" className="h-full w-full object-cover" />}
              </div>
              <label className={cn('btn-outline btn-sm cursor-pointer', busy && 'pointer-events-none opacity-50')}>
                {busy ? 'جارٍ الرفع...' : 'تغيير الصورة'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    setBusy(true)
                    const res = await uploadImage(file, 'gallery-images', 'about')
                    setBusy(false)
                    if (res.ok) await instantSave({ about_image: res.url! }, 'تم تحديث صورة صفحة من نحن')
                    else toast('error', res.error ?? 'فشل الرفع')
                  }} />
              </label>
            </div>
          </div>
        </section>
      )}

      {/* أوقات العمل */}
      {active === 'hours' && (
        <section className="card space-y-5 p-6">
          <div className="space-y-3">
            {(form.working_hours ?? []).map((h, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-sm border border-champagne-light bg-cream/40 p-3 sm:grid-cols-[1fr_auto_auto_auto]">
                <span className="text-sm font-bold">{h.day}</span>
                {h.closed ? (
                  <span className="col-span-2 text-xs text-beige sm:col-span-2">مغلق</span>
                ) : (
                  <>
                    <input type="time" step={1800} className="input !w-auto !py-1.5 font-latin text-xs" value={h.open}
                      onChange={(e) => {
                        const next = [...form.working_hours]
                        next[i] = { ...h, open: e.target.value }
                        set('working_hours', next)
                      }} />
                    <span className="text-beige">—</span>
                    <input type="time" step={1800} className="input !w-auto !py-1.5 font-latin text-xs" value={h.close}
                      onChange={(e) => {
                        const next = [...form.working_hours]
                        next[i] = { ...h, close: e.target.value }
                        set('working_hours', next)
                      }} />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const next = [...form.working_hours]
                    next[i] = { ...h, closed: !h.closed, open: h.open ?? '10:00', close: h.close ?? '21:00' }
                    set('working_hours', next as WorkingHour[])
                  }}
                  className={cn('chip', !h.closed && 'chip-active')}
                >
                  {!h.closed && <Check className="h-3 w-3" />}
                  {h.closed ? 'افتح اليوم' : 'مفتوح'}
                </button>
              </div>
            ))}
          </div>
          <div>
            <label className="label">تواريخ غير متاحة (مفصولة بفاصلة)</label>
            <input className="input" dir="ltr" value={blockedInput} onChange={(e) => setBlockedInput(e.target.value)} placeholder={`${todayISO()}, 2026-12-25`} />
            <p className="mt-1 text-[11px] text-beige">أعياد أو مناسبات يُغلق فيها الحجز — لن تظهر أوقاتها في نموذج الحجز.</p>
          </div>
        </section>
      )}

      {/* صور المعرض */}
      {active === 'gallery' && (
        <section className="card space-y-4 p-6">
          <p className="text-xs text-smoke">صور صالة العرض — تظهر في قسم «جولة داخل المعرض» وشريط انستغرام في الصفحة الرئيسية.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {(form.showroom_images ?? []).map((src) => (
              <div key={src} className="group relative aspect-square overflow-hidden border border-champagne-light">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => instantSave({ showroom_images: form.showroom_images.filter((x) => x !== src) }, 'تم حذف الصورة')}
                  className="absolute inset-0 flex items-center justify-center bg-ink/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  حذف
                </button>
              </div>
            ))}
            <label className={cn('flex aspect-square cursor-pointer flex-col items-center justify-center border border-dashed border-champagne text-beige transition-colors hover:border-gold hover:text-gold-dark', busy && 'pointer-events-none opacity-50')}>
              <span className="text-2xl">+</span>
              <span className="text-[10px]">{busy ? 'جارٍ الرفع...' : 'إضافة صورة'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  setBusy(true)
                  const res = await uploadImage(file, 'gallery-images', 'showroom')
                  setBusy(false)
                  if (res.ok) await instantSave({ showroom_images: [...(form.showroom_images ?? []), res.url!] }, 'تمت إضافة الصورة وتطبيقها')
                  else toast('error', res.error ?? 'فشل الرفع')
                }}
              />
            </label>
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <button onClick={save} disabled={busy} className="btn-gold">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ كل التغييرات
        </button>
      </div>
    </div>
  )
}
