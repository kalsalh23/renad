import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, List, MessageCircle, Pencil, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Appointment, AppointmentStatus } from '@/lib/types'
import { APPOINTMENT_STATUS_META } from '@/lib/constants'
import { cn, fmtDateAr, todayISO, waLink } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'
import { useSEO } from '@/hooks/useSEO'

type ViewMode = 'month' | 'week' | 'day'

export default function AppointmentsAdminPage() {
  useSEO({ title: 'إدارة المواعيد' })
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState<Appointment | null>(null)
  const { toast } = useToast()

  const load = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*, dress:dresses(code, name_ar, slug, cover_image)')
      .order('appointment_date')
      .order('appointment_time')
    setAppointments((data as unknown as Appointment[]) ?? [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const byDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    appointments.forEach((a) => {
      ;(map[a.appointment_date] ??= []).push(a)
    })
    return map
  }, [appointments])

  const filtered = useMemo(
    () => appointments.filter((a) => !statusFilter || a.status === statusFilter),
    [appointments, statusFilter],
  )

  const setStatus = async (a: Appointment, status: AppointmentStatus, adminNote?: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status, admin_note: adminNote ?? a.admin_note })
      .eq('id', a.id)
    if (error) return toast('error', 'تعذّر التحديث: ' + error.message)
    setAppointments((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, status, admin_note: adminNote ?? x.admin_note } : x)),
    )
    toast('success', 'تم تحديث حالة الحجز وإشعار العميلة تلقائيًا')
  }

  const reschedule = async (a: Appointment, date: string, time: string, note: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ appointment_date: date, appointment_time: time, status: 'rescheduled', admin_note: note || a.admin_note })
      .eq('id', a.id)
    if (error) return toast('error', 'تعذّر تعديل الموعد: ' + error.message)
    setAppointments((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, appointment_date: date, appointment_time: time, status: 'rescheduled', admin_note: note || x.admin_note } : x)),
    )
    setEditing(null)
    toast('success', 'تم تعديل الموعد وإشعار العميلة')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">المواعيد والحجوزات</h1>
          <p className="mt-1 text-sm text-smoke">{appointments.length} حجز إجمالًا</p>
        </div>
        <div className="flex items-center gap-2">
          {([['month', 'شهري'], ['week', 'أسبوعي'], ['day', 'يومي']] as [ViewMode, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} className={cn('chip', view === v && 'chip-active')}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* التقويم */}
      {view === 'month' && (
        <MonthCalendar
          cursor={cursor}
          setCursor={setCursor}
          byDate={byDate}
          selected={selectedDate}
          onSelect={setSelectedDate}
        />
      )}
      {view === 'week' && (
        <WeekCalendar cursor={cursor} setCursor={setCursor} byDate={byDate} selected={selectedDate} onSelect={setSelectedDate} />
      )}
      {view === 'day' && (
        <div className="card flex items-center justify-between p-4">
          <button onClick={() => shiftDay(-1)} className="btn-icon !h-9 !w-9" aria-label="اليوم السابق"><ChevronRight className="h-4 w-4" /></button>
          <div className="text-center">
            <p className="font-display text-xl">{fmtDateAr(selectedDate, { weekday: 'long' })}</p>
            <input type="date" className="input mt-2 !w-auto !py-1.5 text-xs" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <button onClick={() => shiftDay(1)} className="btn-icon !h-9 !w-9" aria-label="اليوم التالي"><ChevronLeft className="h-4 w-4" /></button>
        </div>
      )}

      {/* قائمة الحجوزات */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <List className="h-5 w-5 text-gold-dark" />
            {view === 'day' ? `حجوزات ${selectedDate}` : view === 'week' ? 'حجوزات الأسبوع' : 'كل الحجوزات'}
          </h2>
          <select className="input !w-auto !py-2 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="تصفية الحالة">
            <option value="">كل الحالات</option>
            {Object.entries(APPOINTMENT_STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="card overflow-x-auto">
          <table className="table-lux">
            <thead>
              <tr>
                <th>العميلة</th>
                <th>الفستان</th>
                <th>التاريخ والوقت</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="py-10 text-center text-sm text-beige">جارٍ التحميل...</td></tr>}
              {!loading && listFor(view, selectedDate, cursor, filtered).length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-beige">لا توجد حجوزات</td></tr>
              )}
              {listFor(view, selectedDate, cursor, filtered).map((a) => {
                const meta = APPOINTMENT_STATUS_META[a.status]
                return (
                  <tr key={a.id}>
                    <td>
                      <span className="font-bold">{a.customer_name}</span>
                      <span className="block text-[11px] text-beige" dir="ltr">{a.phone}{a.companions > 0 ? ` · ${a.companions} مرافقات` : ''}</span>
                    </td>
                    <td>
                      {a.dress ? (
                        <span className="font-latin text-xs font-bold">{a.dress.code}</span>
                      ) : (
                        <span className="text-xs text-beige">تجربة عامة</span>
                      )}
                    </td>
                    <td className="text-xs">
                      {fmtDateAr(a.appointment_date)}
                      <span className="block font-latin text-smoke">{a.appointment_time}</span>
                    </td>
                    <td><span className={cn('status-pill', meta.pill)}>{meta.label}</span></td>
                    <td>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {a.status === 'pending' && (
                          <button onClick={() => setStatus(a, 'confirmed')} className="chip !border-emerald-300 !text-emerald-700 hover:!bg-emerald-50">تأكيد</button>
                        )}
                        {a.status !== 'cancelled' && a.status !== 'completed' && (
                          <>
                            <button onClick={() => setEditing(a)} className="chip hover:!bg-cream"><Pencil className="h-3 w-3" /> تعديل</button>
                            <button onClick={() => setStatus(a, 'cancelled')} className="chip !border-rose-200 !text-rose-600 hover:!bg-rose-50">إلغاء</button>
                          </>
                        )}
                        {a.status === 'confirmed' && (
                          <button onClick={() => setStatus(a, 'completed')} className="chip hover:!bg-cream">إكمال</button>
                        )}
                        <a
                          href={waLink(a.phone, `مرحبًا ${a.customer_name}، بخصوص موعد التجربة في ريناد بتاريخ ${a.appointment_date} الساعة ${a.appointment_time}.`)}
                          target="_blank" rel="noreferrer"
                          className="chip !border-emerald-300 !text-emerald-700 hover:!bg-emerald-50"
                          title="تواصل عبر واتساب"
                        >
                          <MessageCircle className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة التعديل */}
      {editing && (
        <EditModal
          appointment={editing}
          onClose={() => setEditing(null)}
          onSave={(date, time, note) => reschedule(editing, date, time, note)}
        />
      )}
    </div>
  )

  function shiftDay(dir: number) {
    const d = new Date(`${selectedDate}T00:00:00`)
    d.setDate(d.getDate() + dir)
    setSelectedDate(isoOf(d))
  }
}

/* ============ أدوات التقويم ============ */
function isoOf(d: Date): string {
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

function listFor(view: ViewMode, selectedDate: string, cursor: Date, list: Appointment[]): Appointment[] {
  if (view === 'day') return list.filter((a) => a.appointment_date === selectedDate)
  if (view === 'week') {
    const start = startOfWeek(new Date(`${selectedDate}T00:00:00`))
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return list.filter((a) => {
      const d = new Date(`${a.appointment_date}T00:00:00`)
      return d >= start && d < end
    })
  }
  return list
}

function startOfWeek(d: Date): Date {
  // الأسبوع يبدأ السبت
  const day = d.getDay() // الأحد=0..السبت=6
  const diff = (day + 1) % 7
  const start = new Date(d)
  start.setDate(d.getDate() - diff)
  return start
}

function MonthCalendar({
  cursor,
  setCursor,
  byDate,
  selected,
  onSelect,
}: {
  cursor: Date
  setCursor: (d: Date) => void
  byDate: Record<string, Appointment[]>
  selected: string
  onSelect: (d: string) => void
}) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // عدد الأيام قبل بداية الشهر حتى السبت (بداية الأسبوع)
  const offset = (first.getDay() + 1) % 7
  const today = todayISO()

  const cells: (string | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(isoOf(new Date(year, month, d)))

  const monthNames = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول']

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="btn-icon !h-9 !w-9" aria-label="الشهر السابق"><ChevronRight className="h-4 w-4" /></button>
        <div className="text-center">
          <p className="font-display text-xl">{monthNames[month]} {year}</p>
          <button onClick={() => { setCursor(new Date()); onSelect(today) }} className="text-[11px] text-gold-dark underline underline-offset-4">اليوم</button>
        </div>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="btn-icon !h-9 !w-9" aria-label="الشهر التالي"><ChevronLeft className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'].map((d) => (
          <span key={d} className="py-1 text-[10px] font-bold text-beige">{d}</span>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <span key={`e${i}`} />
          const items = byDate[iso] ?? []
          const hasPending = items.some((a) => a.status === 'pending')
          return (
            <button
              key={iso}
              onClick={() => onSelect(iso)}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center border text-xs transition-colors sm:aspect-[1/0.7]',
                iso === selected ? 'border-gold bg-gold/10 font-bold' : 'border-transparent hover:border-champagne',
                iso === today && 'border-ink/30',
              )}
            >
              {Number(iso.slice(8))}
              {items.length > 0 && (
                <span className={cn('mt-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white', hasPending ? 'bg-amber-500' : 'bg-gold')}>
                  {items.length}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WeekCalendar({
  cursor,
  setCursor,
  byDate,
  selected,
  onSelect,
}: {
  cursor: Date
  setCursor: (d: Date) => void
  byDate: Record<string, Appointment[]>
  selected: string
  onSelect: (d: string) => void
}) {
  const base = startOfWeek(new Date(`${selected}T00:00:00`))
  void cursor
  void setCursor
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    return isoOf(d)
  })

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
      {days.map((iso, i) => {
        const items = byDate[iso] ?? []
        return (
          <button
            key={iso}
            onClick={() => onSelect(iso)}
            className={cn(
              'card p-3 text-center transition-shadow hover:shadow-md',
              iso === selected && '!border-gold bg-gold/5',
            )}
          >
            <p className="text-[10px] text-beige">{['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'][i]}</p>
            <p className="font-display text-lg">{Number(iso.slice(8))}</p>
            <p className={cn('text-[11px] font-bold', items.length ? 'text-gold-dark' : 'text-beige/60')}>
              {items.length ? `${items.length} حجز` : '—'}
            </p>
          </button>
        )
      })}
    </div>
  )
}

function EditModal({
  appointment,
  onClose,
  onSave,
}: {
  appointment: Appointment
  onClose: () => void
  onSave: (date: string, time: string, note: string) => void
}) {
  const [date, setDate] = useState(appointment.appointment_date)
  const [time, setTime] = useState(appointment.appointment_time)
  const [note, setNote] = useState(appointment.admin_note ?? '')

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-ivory p-6 shadow-2xl animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl">تعديل الموعد — {appointment.customer_name}</h3>
          <button onClick={onClose} className="btn-icon !h-8 !w-8" aria-label="إغلاق"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">التاريخ الجديد</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">الوقت الجديد</label>
            <input type="time" step={1800} className="input font-latin" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <label className="label">ملاحظة للعميلة (تظهر في حسابها)</label>
            <textarea className="input !min-h-20" value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: تم تعديل الموعد حسب طلبكم..." />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-outline btn-sm">إلغاء</button>
            <button onClick={() => onSave(date, time, note)} className="btn-gold btn-sm">حفظ الموعد الجديد</button>
          </div>
        </div>
      </div>
    </div>
  )
}
