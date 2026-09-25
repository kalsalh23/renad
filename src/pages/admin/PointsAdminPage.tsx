import { useMemo, useState } from 'react'
import { Award, Gift, Minus, Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLoyalty } from '@/hooks/useData'
import { useSEO } from '@/hooks/useSEO'
import { useToast } from '@/context/ToastContext'
import { fmtDateTimeAr } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function PointsAdminPage() {
  useSEO({ title: 'نقاط الولاء' })
  const { balances, transactions, loading, reload } = useLoyalty()
  const { toast } = useToast()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState<{ userId: string; name: string; mode: 'grant' | 'redeem'; balance: number } | null>(null)
  const [amount, setAmount] = useState('100')
  const [reason, setReason] = useState('')

  const filtered = useMemo(
    () =>
      balances.filter(
        (b) =>
          !q ||
          `${b.profile?.full_name ?? ''} ${b.profile?.email ?? ''} ${b.profile?.phone ?? ''}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [balances, q],
  )

  const totalPoints = balances.reduce((s, b) => s + b.points, 0)
  const activeCustomers = balances.filter((b) => b.points > 0).length

  const submitPoints = async () => {
    if (!modal) return
    const pts = Math.abs(Number(amount) || 0)
    if (!pts) return toast('error', 'أدخلي عدد نقاط صحيحًا')
    setBusy(true)
    try {
      if (modal.mode === 'grant') {
        const { error } = await supabase.rpc('grant_points', {
          p_user_id: modal.userId,
          p_points: pts,
          p_reason: reason.trim() || 'منح يدوي من إدارة المعرض',
        })
        if (error) throw error
        toast('success', `تم منح ${pts} نقطة — وصل إشعار للعميلة`)
      } else {
        if (pts > modal.balance) throw new Error(`الرصيد المتاح ${modal.balance} نقطة فقط`)
        const { error } = await supabase.rpc('redeem_points', {
          p_user_id: modal.userId,
          p_points: pts,
          p_reason: reason.trim() || 'استبدال نقاط (خصم/فستان مجاني) في المعرض',
        })
        if (error) throw error
        toast('success', `تم صرف ${pts} نقطة من رصيد العميلة`)
      }
      setModal(null)
      setAmount('100')
      setReason('')
      reload()
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'تعذّرت العملية')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">نقاط الولاء</h1>
        <p className="mt-1 text-sm text-smoke">
          تُضاف 100 نقطة تلقائيًا لكل فستان بعد تأكيد الحجز — تستبدلها العميلة بخصم أو فستان مجاني
        </p>
      </div>

      {/* ملخص */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs text-smoke">إجمالي النقاط الممنوحة</p>
          <p className="mt-2 font-display text-3xl text-gold-dark">{totalPoints}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-smoke">عميلات برصيد نشط</p>
          <p className="mt-2 font-display text-3xl">{activeCustomers}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-smoke">قيمة النقطة</p>
          <p className="mt-2 text-sm font-bold leading-6">100 نقطة = مكافأة فستان<br />(خصم يُحدد في المعرض)</p>
        </div>
      </div>

      {/* الأرصدة */}
      <div className="card overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <h3 className="flex items-center gap-2 font-display text-xl">
            <Award className="h-5 w-5 text-gold-dark" />
            أرصدة العميلات
          </h3>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-beige" />
            <input className="input !py-2 ps-9 text-xs" placeholder="بحث بالاسم أو الهاتف..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-lux">
            <thead>
              <tr>
                <th>العميلة</th>
                <th>الرصيد</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={3} className="py-10 text-center text-sm text-beige">جارٍ التحميل...</td></tr>
              )}
              {!loading && !filtered.length && (
                <tr><td colSpan={3} className="py-10 text-center text-sm text-beige">لا توجد أرصدة بعد — تُضاف تلقائيًا عند تأكيد الحجوزات</td></tr>
              )}
              {filtered.map((b) => (
                <tr key={b.user_id}>
                  <td>
                    <span className="font-bold">{b.profile?.full_name || '—'}</span>
                    <span className="block text-[11px] text-beige" dir="ltr">{b.profile?.phone || b.profile?.email || ''}</span>
                  </td>
                  <td>
                    <span className={cn('font-display text-2xl', b.points > 0 ? 'text-gold-dark' : 'text-beige')}>{b.points}</span>
                    <span className="ms-1 text-xs text-smoke">نقطة</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setModal({ userId: b.user_id, name: b.profile?.full_name || '—', mode: 'grant', balance: b.points })}
                        className="chip !border-emerald-300 !text-emerald-700 hover:!bg-emerald-50"
                      >
                        <Plus className="h-3 w-3" /> منح
                      </button>
                      <button
                        onClick={() => setModal({ userId: b.user_id, name: b.profile?.full_name || '—', mode: 'redeem', balance: b.points })}
                        className="chip !border-rose-200 !text-rose-600 hover:!bg-rose-50"
                      >
                        <Minus className="h-3 w-3" /> صرف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* سجل الحركات */}
      <div className="card overflow-hidden p-0">
        <h3 className="flex items-center gap-2 px-6 py-4 font-display text-xl">
          <Gift className="h-5 w-5 text-gold-dark" />
          سجل حركات النقاط
        </h3>
        <div className="overflow-x-auto">
          <table className="table-lux">
            <thead>
              <tr>
                <th>العميلة</th>
                <th>الحركة</th>
                <th>السبب</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr><td colSpan={4} className="py-10 text-center text-sm text-beige">لا حركات بعد</td></tr>
              )}
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="font-bold">{t.profile?.full_name || '—'}</td>
                  <td>
                    <span className={cn('font-display text-lg', t.amount > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      {t.amount > 0 ? `+${t.amount}` : t.amount}
                    </span>
                  </td>
                  <td className="max-w-64 text-xs text-smoke">{t.reason}</td>
                  <td className="text-xs text-beige">{fmtDateTimeAr(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة منح/صرف */}
      {modal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative z-10 w-full max-w-md bg-ivory p-6 shadow-2xl animate-fade-up">
            <h3 className="font-display text-2xl">
              {modal.mode === 'grant' ? 'منح نقاط' : 'صرف نقاط'} — {modal.name}
            </h3>
            {modal.mode === 'redeem' && (
              <p className="mt-1 text-xs text-smoke">الرصيد المتاح: <b className="text-gold-dark">{modal.balance}</b> نقطة</p>
            )}
            <div className="mt-5 space-y-4">
              <div>
                <label className="label">عدد النقاط</label>
                <input
                  type="number"
                  min={1}
                  className="input font-latin text-lg text-center"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="mt-2 flex gap-2">
                  {[50, 100, 200, 300].map((v) => (
                    <button key={v} onClick={() => setAmount(String(v))} className="chip font-latin">{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">السبب / ملاحظة</label>
                <input
                  className="input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={modal.mode === 'grant' ? 'مثال: مكافأة عميلة مميزة' : 'مثال: استبدال بخصم 50$'}
                />
              </div>
              {modal.mode === 'grant' && (
                <p className="rounded-sm bg-cream px-4 py-3 text-[11px] leading-5 text-smoke">
                  ستصل العميلة إشعارًا فوريًا بالنقاط الجديدة. النقاط مخفية عنها حتى منحها — وهذا المنح يظهر في حسابها مباشرة.
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={() => setModal(null)} className="btn-outline btn-sm">إلغاء</button>
                <button onClick={submitPoints} disabled={busy} className="btn-gold btn-sm">
                  {busy ? 'جارٍ التنفيذ...' : modal.mode === 'grant' ? 'منح النقاط' : 'صرف النقاط'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
