import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useSEO } from '@/hooks/useSEO'
import { cn } from '@/lib/utils'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { from?: string } | null)?.from ?? '/account'
  useSEO({ title: 'تسجيل الدخول' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      setBusy(false)
      if (error) toast('error', 'بيانات الدخول غير صحيحة — تحققي من البريد وكلمة المرور.')
      else {
        toast('success', 'أهلًا بكِ مجددًا 🤍')
        navigate(returnTo)
      }
    } else {
      if (password.length < 6) {
        setBusy(false)
        toast('error', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.')
        return
      }
      const { error, needsConfirmation } = await signUp(email, password, fullName)
      setBusy(false)
      if (error) {
        toast('error', error.includes('already') ? 'هذا البريد مسجّل مسبقًا — جرّبي تسجيل الدخول.' : 'تعذّر إنشاء الحساب، حاولي مجددًا.')
        return
      }
      if (needsConfirmation) {
        toast('info', 'تم إنشاء حسابكِ — تحققي من بريدكِ الإلكتروني لتأكيد الحساب ثم سجّلي الدخول.')
        setMode('login')
      } else {
        toast('success', 'أهلًا بكِ في ريناد 🤍')
        navigate(returnTo)
      }
    }
  }

  return (
    <div className="container-site flex min-h-[85vh] items-center justify-center pb-16 pt-28 lg:pt-32">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="eyebrow">RENAD ACCOUNT</p>
          <h1 className="heading-display mt-2 !text-3xl">
            {mode === 'login' ? 'تسجيل الدخول' : 'حساب جديد'}
          </h1>
          <p className="mt-3 text-sm leading-7 text-smoke">
            التصفح متاح بدون حساب — الحساب مطلوب للحجز، ويتيح متابعة حجوزاتكِ ومفضلتكِ ونقاطكِ.
          </p>
        </div>

        {/* تبويبات */}
        <div className="mt-8 grid grid-cols-2 border border-champagne-light bg-cream/60 p-1">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn('py-2.5 text-sm font-bold transition-all', mode === m ? 'bg-ink text-ivory' : 'text-smoke hover:text-ink')}
            >
              {m === 'login' ? 'دخول' : 'حساب جديد'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="card mt-6 space-y-5 p-6 sm:p-8">
          {mode === 'register' && (
            <div>
              <label className="label" htmlFor="au-name">الاسم الكامل</label>
              <div className="relative">
                <UserIcon className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-beige" />
                <input id="au-name" required className="input ps-10" value={fullName}
                  onChange={(e) => setFullName(e.target.value)} placeholder="اسمكِ الكامل" />
              </div>
            </div>
          )}
          <div>
            <label className="label" htmlFor="au-email">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-beige" />
              <input id="au-email" type="email" required dir="ltr" className="input ps-10 text-right" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="au-pass">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-beige" />
              <input id="au-pass" type="password" required dir="ltr" className="input ps-10 text-right" value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full !py-3.5">
            {busy ? 'لحظة...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-smoke">
          بإنشائكِ حسابًا توافقين على أن نحفظ مفضلتكِ وحجوزاتكِ لعرضها لكِ لاحقًا.{' '}
          <Link to="/" className="text-gold-dark underline underline-offset-4">العودة للرئيسية</Link>
        </p>
      </div>
    </div>
  )
}
