import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CalendarPlus, Package, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import type { Appointment, Dress } from '@/lib/types'
import { APPOINTMENT_STATUS_META, DRESS_STATUS_META } from '@/lib/constants'
import { addDaysISO, fmtDateAr, fmtDateTimeAr, todayISO, weekDayIndex } from '@/lib/utils'
import { BarChart, DonutChart, StatCard } from '@/components/admin/Charts'
import { useSEO } from '@/hooks/useSEO'

export default function DashboardPage() {
  useSEO({ title: 'لوحة التحكم' })
  const [dresses, setDresses] = useState<Dress[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [customers, setCustomers] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [dRes, aRes, pRes] = await Promise.all([
        supabase.from('dresses').select('*'),
        supabase
          .from('appointments')
          .select('*, dress:dresses(code, name_ar, slug, cover_image)')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ])
      setDresses((dRes.data as Dress[]) ?? [])
      setAppointments((aRes.data as unknown as Appointment[]) ?? [])
      setCustomers(pRes.count ?? 0)
      setLoading(false)
    })()
  }, [])

  const stats = useMemo(() => {
    const byStatus = (s: Dress['status']) => dresses.filter((d) => d.status === s).length
    const today = todayISO()
    const newBookings = appointments.filter((a) => a.status === 'pending').length
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length
    const upcoming = appointments.filter((a) => a.appointment_date >= today && a.status !== 'cancelled').length
    const last7 = Array.from({ length: 7 }).map((_, i) => {
      const day = addDaysISO(today, -(6 - i))
      return appointments.filter((a) => a.appointment_date === day && a.status !== 'cancelled').length
    })
    const labels = Array.from({ length: 7 }).map((_, i) => {
      const day = addDaysISO(today, -(6 - i))
      return ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'][weekDayIndex(new Date(`${day}T00:00:00`).getDay())]
    })
    return { byStatus, newBookings, confirmed, upcoming, last7, labels }
  }, [dresses, appointments])

  if (loading) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-smoke">نظرة عامة على معرض ريناد</p>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="إجمالي الفساتين" value={dresses.length} />
        <StatCard label="متاح" value={stats.byStatus('available')} tone="green" />
        <StatCard label="مؤجر" value={stats.byStatus('rented')} tone="blue" />
        <StatCard label="مباع" value={stats.byStatus('sold')} tone="red" />
        <StatCard label="حجوزات جديدة" value={stats.newBookings} tone="gold" hint="بانتظار التأكيد" />
        <StatCard label="حجوزات مؤكدة" value={stats.confirmed} tone="green" />
        <StatCard label="مواعيد قادمة" value={stats.upcoming} />
        <StatCard label="العميلات" value={customers} hint="حسابات مسجّلة" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* حجوزات آخر 7 أيام */}
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-display text-xl">
            <CalendarPlus className="h-5 w-5 text-gold-dark" />
            الحجوزات — آخر 7 أيام
          </h3>
          <BarChart data={stats.last7} labels={stats.labels} />
        </div>

        {/* الفساتين حسب الحالة */}
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-display text-xl">
            <Package className="h-5 w-5 text-gold-dark" />
            الفساتين حسب الحالة
          </h3>
          <div className="mt-6">
            <DonutChart
              segments={[
                { label: 'متوفر', value: stats.byStatus('available'), color: '#6B9E6B' },
                { label: 'محجوز', value: stats.byStatus('reserved'), color: '#C9A227' },
                { label: 'مؤجر', value: stats.byStatus('rented'), color: '#5B8DB8' },
                { label: 'غير متوفر', value: stats.byStatus('unavailable'), color: '#A79A87' },
                { label: 'مباع', value: stats.byStatus('sold'), color: '#B85C5C' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* أحدث الحجوزات */}
      <div className="card overflow-x-auto p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="flex items-center gap-2 font-display text-xl">
            <Sparkles className="h-5 w-5 text-gold-dark" />
            أحدث الحجوزات
          </h3>
          <Link to="/admin/appointments" className="text-xs text-gold-dark underline underline-offset-4">
            إدارة المواعيد
          </Link>
        </div>
        <table className="table-lux">
          <thead>
            <tr>
              <th>العميلة</th>
              <th>الفستان</th>
              <th>الموعد</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {appointments.slice(0, 6).map((a) => (
              <tr key={a.id}>
                <td>
                  <span className="font-bold">{a.customer_name}</span>
                  <span className="block text-[11px] text-beige" dir="ltr">{a.phone}</span>
                </td>
                <td className="font-latin text-xs">{a.dress?.code ?? a.dress_code ?? '—'}</td>
                <td className="text-xs">{fmtDateAr(a.appointment_date)} · {a.appointment_time}</td>
                <td>
                  <span className={`status-pill ${APPOINTMENT_STATUS_META[a.status].pill}`}>
                    {APPOINTMENT_STATUS_META[a.status].label}
                  </span>
                </td>
              </tr>
            ))}
            {!appointments.length && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-beige">لا توجد حجوزات بعد</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(['available', 'reserved', 'rented', 'sold'] as const).map((s) => (
          <Link key={s} to="/admin/dresses" className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
            <CalendarDays className="h-5 w-5 text-gold-dark" />
            <span className="text-sm">
              {DRESS_STATUS_META[s].label}
              <span className="ms-2 font-display text-xl">{stats.byStatus(s)}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
