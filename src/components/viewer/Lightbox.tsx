import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Lightbox احترافي لعرض الصور مع تنقّل وتكبير
 */
export function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
  alt = '',
}: {
  images: string[]
  index: number
  onClose: () => void
  onNavigate: (i: number) => void
  alt?: string
}) {
  const zoomed = false

  const prev = useCallback(() => onNavigate((index - 1 + images.length) % images.length), [index, images.length, onNavigate])
  const next = useCallback(() => onNavigate((index + 1) % images.length), [index, images.length, onNavigate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') prev()
      if (e.key === 'ArrowLeft') next()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  if (index < 0 || !images.length) return null

  return createPortal(
    <div className="fixed inset-0 z-[95] flex flex-col bg-ink/95 backdrop-blur animate-fade-in" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between p-4">
        <span className="font-latin text-xs tracking-[0.3em] text-gold-light">
          {index + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-gold-light"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-10">
        <button
          onClick={prev}
          className="absolute start-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-gold-light hover:text-gold-light"
          aria-label="السابق"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <img
          key={images[index]}
          src={images[index]}
          alt={alt}
          className="max-h-full max-w-full object-contain animate-fade-in"
          style={zoomed ? { transform: 'scale(1.4)' } : undefined}
        />
        <button
          onClick={next}
          className="absolute end-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-gold-light hover:text-gold-light"
          aria-label="التالي"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="no-scrollbar flex justify-start gap-2 overflow-x-auto px-4 pb-6 sm:justify-center">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => onNavigate(i)}
            className={cn(
              'h-16 w-12 shrink-0 overflow-hidden border transition-all sm:h-20 sm:w-15',
              i === index ? 'border-gold opacity-100' : 'border-transparent opacity-50 hover:opacity-80',
            )}
          >
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  )
}

export function ZoomHintIcon() {
  return <ZoomIn className="h-4 w-4" />
}
export function ZoomOutIcon() {
  return <ZoomOut className="h-4 w-4" />
}
