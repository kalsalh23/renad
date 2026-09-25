import { useEffect, useState } from 'react'
import { Download, Share2, X } from 'lucide-react'
import { BRAND } from '@/lib/constants'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'renad_install_dismissed_at'
const DISMISS_DAYS = 7

/** بانر «ثبّتي تطبيق ريناد» — يفتح نافذة التثبيت الرسمية (PWA) */
export function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // مخفي إن كان الموقع مثبتًا كتطبيق أصلًا
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true,
    )
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent))

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  useEffect(() => {
    if (isStandalone) return
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
    const dismissedRecently = Date.now() - dismissedAt < DISMISS_DAYS * 24 * 3600 * 1000
    // iOS لا يطلق beforeinstallprompt — نعرض التعليمات مباشرة بعد مهلة
    const timer = setTimeout(() => {
      if (!dismissedRecently && (isIOS || deferred)) setShow(true)
    }, 6000)
    return () => clearTimeout(timer)
  }, [deferred, isIOS, isStandalone])

  if (isStandalone || !show) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  const install = async () => {
    if (deferred) {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      if (outcome === 'accepted') dismiss()
    }
  }

  return (
    <div className="fixed inset-x-4 bottom-20 z-[70] md:bottom-6 md:left-6 md:right-auto md:w-96">
      <div className="relative overflow-hidden rounded-sm bg-ink p-5 text-ivory shadow-2xl animate-fade-up">
        <button onClick={dismiss} className="absolute end-3 top-3 text-ivory/50 hover:text-ivory" aria-label="إغلاق">
          <X className="h-4 w-4" />
        </button>
        <p className="eyebrow !text-gold-light">RENAD APP</p>
        <h3 className="mt-2 font-display text-xl">ثبّتي تطبيق {BRAND.nameAr} على جهازكِ</h3>
        <p className="mt-1.5 text-xs leading-6 text-ivory/60">
          وصول أسرع للتشكيلة، حجز مواعيد بلمسة، ومفضلتكِ دائمًا معكِ — كتطبيق حقيقي على شاشتكِ الرئيسية.
        </p>
        {isIOS && !deferred ? (
          <p className="mt-3 flex items-start gap-2 rounded-sm bg-ivory/10 px-3 py-2.5 text-[11px] leading-5">
            <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-light" />
            على الآيفون: اضغطي زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»
          </p>
        ) : null}
        <button onClick={install} className="btn-gold mt-4 w-full">
          <Download className="h-4 w-4" />
          تثبيت التطبيق
        </button>
      </div>
    </div>
  )
}
