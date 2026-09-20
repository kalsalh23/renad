import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarHeart, CheckCircle2, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useToast } from '@/context/ToastContext'
import { useDresses } from '@/hooks/useData'
import { useSEO } from '@/hooks/useSEO'
import { isValidEmail, isValidPhone, timeSlots, todayISO, waLink, weekDayIndex } from '@/lib/utils'
import type { WorkingHour } from '@/lib/types'

export default function BookPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { settings } = useSettings()
  const { toast } = useToast()
  const { dresses } = useDresses()
  useSEO({ title: 'احجزي موعد تجربة', description: 'احجزي موعد تجربة فساتين في معرض ريناد — اخترا التاريخ والوقت المناسب لكِ.' })

  const prefillSlug = params.get('dress')
  const prefillDress = dresses.find((d) => d.slug === prefillSlug)

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    dress_id: '',
    appointment_date: '',
    appointment_time: '',
    companions: '0',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ date: string; time: string; code: string | null } | null>(null)

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        customer_name: f.customer_name || profile.full_name || '',
        phone: f.phone || profile.phone || '',
        email: f.email || profile.email || '',
      }))
    }
  }, [profile])

  useEffect(() => {
    if (prefillDress) setForm((f) => ({ ...f, dress_id: prefillDress.id }))
  }, [prefillDress])

  const hours: WorkingHour[] = settings.working_hours ?? []
  const selectedDayIndex = form.appointment_date
    ? weekDayIndex(new Date(`${form.appointment_date}T00:00:00`).getDay())
    : -1
  const dayHours = selectedDayIndex >= 0 ? hours[selectedDayIndex] : undefined
  const isBlocked = form.appointment_date ? (settings.blocked_dates ?? []).includes(form.appointment_date) : false
  const slots = useMemo(
    () => (dayHours && !dayHours.closed && !isBlocked ? timeSlots(dayHours.open, dayHours.close) : []),
    [dayHours, isBlocked],
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_name.trim() || !isValidPhone(form.phone)) {
      toast('error', 'يرجى إدخال الاسم ورقم هاتف صحيح.')
      return
    }
    if (!form.appointment_date || !form.appointment_time) {
      toast('error', 'يرجى اختيار تاريخ ووقت التجربة.')
      return
    }
    if (form.email && !isValidEmail(form.email)) {
      toast('error', 'صيغة البريد الإلكتروني غير صحيحة.')
      return
    }
    setSubmitting(true)
    const chosenDress = dresses.find((d) => d.id === form.dress_id)
    const { error } = await supabase.from('appointments').insert({
      user_id: user?.id ?? null,
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      dress_id: form.dress_id || null,
      dress_code: chosenDress?.code ?? null,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      companions: Number(form.companions) || 0,
      notes: form.notes.trim() || null,
    })
    setSubmitting(false)
    if (error) {
      toast('error', error.message === 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقًا'
        ? error.message
        : 'تعذّر إرسال الطلب — تحققي من البيانات وحاولي مجددًا.')
      return
    }
    setDone({ date: form.appointment_date, time: form.appointment_time, code: chosenDress?.code ?? null })
    window.scrollTo({ top: 0 })
  }

  // شاشة النجاح
  if (done) {
    return (
      <div className="container-site flex min-h-[80vh] items-center justify-center py-24">
        <div className="card max-w-lg px-8 py-12 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
          <h1 className="mt-5 font-display text-3xl text-ink">تم إرسال طلب حجزكِ</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-smoke">
            شكرًا {form.customer_name}! استلمنا طلب موعد تجربة بتاريخ <b>{done.date}</b> الساعة <b>{done.time}</b>
            {done.code && <> للفستان <b className="font-latin">{done.code}</b></>}، وسنعلمكِ بالتأكيد في أقرب وقت.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {settings.whatsapp_number && (
              <a
                href={waLink(settings.whatsapp_number, `مرحبًا، أرسلت طلب حجز تجربة بتاريخ ${done.date} الساعة ${done.time}.`)}
                target="_blank"
                rel="noreferrer"
                className="btn-outline !border-emerald-600/40 text-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                تأكيد أسرع عبر واتساب
              </a>
            )}
            <button onClick={() => navigate('/')} className="btn-primary">العودة للرئيسية</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-site pb-20 pt-28 lg:pt-36">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="eyebrow">BOOK YOUR VISIT</p>
          <h1 className="heading-display mt-2">احجزي موعد تجربة</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-smoke">
            احفظي موعدكِ لتجربة الفساتين في أجواء خاصة — وسيتواصل معكِ فريق ريناد لتأكيد الموعد.
          </p>
        </div>

        {prefillDress && (
          <div className="mt-8 flex items-center gap-4 border border-champagne-light bg-cream/50 p-4">
            {prefillDress.cover_image && (
              <img src={prefillDress.cover_image} alt="" className="h-20 w-16 object-cover" />
            )}
            <div>
              <p className="font-latin text-[10px] tracking-[0.3em] text-gold-dark">{prefillDress.code}</p>
              <p className="text-sm font-bold">{prefillDress.name_ar || prefillDress.category?.name_ar}</p>
              <Link to={`/dresses/${prefillDress.slug}`} className="text-xs text-gold-dark underline underline-offset-4">
                عرض تفاصيل الفستان
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="card mt-8 space-y-5 p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="bk-name">الاسم <span className="text-gold-dark">*</span></label>
              <input id="bk-name" required className="input" value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="اسمكِ الكامل" />
            </div>
            <div>
              <label className="label" htmlFor="bk-phone">رقم الهاتف <span className="text-gold-dark">*</span></label>
              <input id="bk-phone" required dir="ltr" className="input text-right" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09xx xxx xxx" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="bk-email">البريد الإلكتروني (اختياري)</label>
            <input id="bk-email" type="email" dir="ltr" className="input text-right" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
          </div>

          <div>
            <label className="label" htmlFor="bk-dress">الفستان المطلوب</label>
            <select id="bk-dress" className="input" value={form.dress_id} onChange={(e) => setForm({ ...form, dress_id: e.target.value })}>
              <option value="">— ليس بعد / سأختار في المعرض —</option>
              {dresses.filter((d) => d.status === 'available' || d.status === 'reserved').map((d) => (
                <option key={d.id} value={d.id}>{d.code} — {d.name_ar || d.category?.name_ar}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="bk-date">تاريخ التجربة <span className="text-gold-dark">*</span></label>
              <input id="bk-date" type="date" required min={todayISO()} className="input" value={form.appointment_date}
                onChange={(e) => setForm({ ...form, appointment_date: e.target.value, appointment_time: '' })} />
            </div>
            <div>
              <label className="label" htmlFor="bk-time">الوقت <span className="text-gold-dark">*</span></label>
              <select id="bk-time" required className="input" value={form.appointment_time}
                onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} disabled={!form.appointment_date}>
                <option value="">{!form.appointment_date ? 'اختاري التاريخ أولًا' : slots.length ? 'اختاري الوقت' : 'لا توجد أوقات متاحة هذا اليوم'}</option>
                {slots.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {form.appointment_date && (isBlocked || dayHours?.closed) && (
            <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              {isBlocked ? 'هذا التاريخ غير متاح للحجز — يرجى اختيار تاريخ آخر.' : 'المعرض مغلق هذا اليوم — يرجى اختيار يوم آخر.'}
            </p>
          )}

          <div>
            <label className="label" htmlFor="bk-comp">عدد المرافقات</label>
            <select id="bk-comp" className="input" value={form.companions} onChange={(e) => setForm({ ...form, companions: e.target.value })}>
              {Array.from({ length: 7 }).map((_, i) => (
                <option key={i} value={i}>{i === 0 ? 'بدون مرافقات' : `${i} ${i === 1 ? 'مرافقة' : 'مرافقات'}`}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="bk-notes">ملاحظات (اختياري)</label>
            <textarea id="bk-notes" className="input" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="مثال: أبحث عن فستان زفاف بقصّة أميرة، مقاسي عادةً M..." />
          </div>

          <button type="submit" disabled={submitting} className="btn-gold w-full !py-4">
            <CalendarHeart className="h-4 w-4" />
            {submitting ? 'جارٍ الإرسال...' : 'إرسال طلب الحجز'}
          </button>
          <p className="text-center text-[11px] leading-5 text-beige">
            بإرسالكِ الطلب ستتواصل معكِ إدارة المعرض لتأكيد الموعد. التصفح والحجز لا يتطلبان حسابًا،
            لكن <Link to="/auth" className="text-gold-dark underline underline-offset-4">إنشاء حساب</Link> يتيحكِ متابعة حجوزاتكِ.
          </p>
        </form>
      </div>
    </div>
  )
}
