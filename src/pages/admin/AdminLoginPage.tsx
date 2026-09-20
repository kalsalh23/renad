import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSEO } from '@/hooks/useSEO'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  useSEO({ title: 'دخول الإدارة' })

  if (user && isAdmin) return <Navigate to={location.state?.from ?? '/admin'} replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) {
      setError('بيانات الدخول غير صحيحة.')
      return
    }
    // التحقق من الصلاحية بعد الدخول
    navigate(location.state?.from ?? '/admin', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <span className="font-display text-4xl text-ivory">ريناد</span>
          <span className="mt-1 block font-latin text-[10px] tracking-[0.5em] text-gold-light">ADMIN PANEL</span>
        </div>

        <form onSubmit={submit} className="mt-10 space-y-5 bg-ivory p-8 shadow-2xl">
          <h1 className="text-center font-display text-2xl text-ink">دخول الإدارة</h1>
          {error && <p className="border border-rose-200 bg-rose-50 px-4 py-2.5 text-center text-xs text-rose-600">{error}</p>}
          <div>
            <label className="label" htmlFor="ad-email">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-beige" />
              <input id="ad-email" type="email" required dir="ltr" className="input ps-10 text-right" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="ad-pass">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-beige" />
              <input id="ad-pass" type="password" required dir="ltr" className="input ps-10 text-right" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full !py-3.5">
            {busy ? 'جارٍ الدخول...' : 'دخول'}
          </button>
          <p className="text-center text-[11px] text-beige">هذه المنطقة مخصصة لإدارة معرض ريناد فقط</p>
        </form>
      </div>
    </div>
  )
}
