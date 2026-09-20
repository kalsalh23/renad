import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useCategories } from '@/hooks/useData'

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { categories } = useCategories()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!open) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/dresses?q=${encodeURIComponent(q.trim())}`)
    onClose()
    setQ('')
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-ivory/98 backdrop-blur-md animate-fade-in">
      <div className="container-site flex items-center justify-between py-5">
        <span className="eyebrow">ابحثي في تشكيلة ريناد</span>
        <button onClick={onClose} className="btn-icon" aria-label="إغلاق البحث">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="container-site flex flex-1 flex-col items-center justify-start pt-10 sm:pt-20">
        <form onSubmit={submit} className="flex w-full max-w-2xl items-center gap-3 border-b-2 border-gold pb-3">
          <Search className="h-6 w-6 shrink-0 text-gold-dark" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحثي بالاسم، الكود، اللون، المقاس..."
            className="w-full bg-transparent font-display text-2xl text-ink placeholder:text-beige/70 focus:outline-none sm:text-3xl"
            aria-label="نص البحث"
          />
        </form>
        {categories.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  navigate(`/dresses?cat=${c.slug}`)
                  onClose()
                }}
                className="chip transition-colors hover:border-gold hover:text-gold-dark"
              >
                {c.name_ar}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
