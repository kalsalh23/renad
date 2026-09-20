import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Expand, Hand, RotateCcw, ZoomIn, ZoomOut, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * عارض 360° تفاعلي — سحب بالإصبع أو الماوس لعرض إطارات الفستان المتتالية.
 * التحميل تدريجي (Lazy): تُحمّل الإطارات القريبة أولًا ثم الباقي بالخلفية.
 */
export function Viewer360({
  frames,
  className,
  hint = true,
}: {
  frames: string[]
  className?: string
  hint?: boolean
}) {
  const count = frames.length
  const [index, setIndex] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [zoom, setZoom] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const dragState = useRef<{ startX: number; startIndex: number; lastX: number; velocity: number; lastT: number } | null>(null)
  const momentumRef = useRef<number | null>(null)

  // إعادة التهيئة عند تغيّر الفساتين
  useEffect(() => {
    imagesRef.current = frames.map((src) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => setLoadedCount((c) => c + 1)
      img.src = src
      return img
    })
    setIndex(0)
    setLoadedCount(0)
    return () => {
      imagesRef.current = []
    }
  }, [frames])

  // تحميل تدريجي: يبدأ عند ظهور العارض في الشاشة
  useEffect(() => {
    const el = containerRef.current
    if (!el || count === 0) return
    let started = false
    const startLoading = () => {
      if (started) return
      started = true
      // حمّل الإطار الحالي ثم الإطارات المجاورة أولًا، ثم الباقي بالتتابع
      const order: number[] = []
      order.push(0, 1, count - 1)
      for (let i = 2; i < count - 1; i++) order.push(i)
      let cursor = 0
      const next = () => {
        if (cursor >= order.length) return
        const img = imagesRef.current[order[cursor++]]
        if (img?.complete) {
          setLoadedCount((c) => c + 1)
          next()
        } else if (img) {
          img.decode?.().catch(() => {}).finally(() => next())
        } else {
          next()
        }
      }
      next()
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && startLoading()),
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [count])

  const stopMomentum = useCallback(() => {
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current)
      momentumRef.current = null
    }
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (zoom && fullscreen) return // أثناء التكبير: السحب للتحريك
      stopMomentum()
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      dragState.current = {
        startX: e.clientX,
        startIndex: index,
        lastX: e.clientX,
        velocity: 0,
        lastT: performance.now(),
      }
      setDragging(true)
      setInteracted(true)
    },
    [index, stopMomentum, zoom, fullscreen],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const st = dragState.current
      if (!st) return
      const width = containerRef.current?.clientWidth ?? 600
      const step = Math.max(width / 28, 12)
      const delta = e.clientX - st.startX
      // اتجاه طبيعي: سحب لليمين يدير الفستان لليمين
      let next = st.startIndex + Math.round(delta / step)
      next = ((next % count) + count) % count
      setIndex(next)
      const now = performance.now()
      const dt = Math.max(now - st.lastT, 1)
      st.velocity = ((e.clientX - st.lastX) / dt) * 16 / step
      st.lastX = e.clientX
      st.lastT = now
    },
    [count],
  )

  const onPointerUp = useCallback(() => {
    const st = dragState.current
    dragState.current = null
    setDragging(false)
    if (!st || Math.abs(st.velocity) < 0.05) return
    // قصور حركي ناعم بعد ترك السحب
    let v = st.velocity
    const tick = () => {
      v *= 0.94
      if (Math.abs(v) < 0.02) {
        momentumRef.current = null
        return
      }
      setIndex((i) => {
        const next = Math.round(i + v)
        return ((next % count) + count) % count
      })
      momentumRef.current = requestAnimationFrame(tick)
    }
    momentumRef.current = requestAnimationFrame(tick)
  }, [count])

  useEffect(() => () => stopMomentum(), [stopMomentum])

  // لوحة المفاتيح
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setIndex((i) => (i + 1) % count)
    if (e.key === 'ArrowRight') setIndex((i) => (i - 1 + count) % count)
  }

  const progress = count ? Math.round((loadedCount / count) * 100) : 0
  const currentLoaded = useMemo(() => imagesRef.current[index]?.complete ?? false, [index, loadedCount])

  const body = (
    <div
      ref={containerRef}
      className={cn(
        'relative select-none overflow-hidden bg-cream touch-pan-y',
        dragging ? 'cursor-grabbing grabbing' : 'cursor-grab',
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="img"
      aria-label="عارض 360 درجة — اسحبي لتدوير الفستان"
    >
      {/* الإطارات متراكبة */}
      {frames.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          className={cn(
            'absolute inset-0 h-full w-full object-contain transition-opacity duration-150',
            i === index ? 'opacity-100' : 'opacity-0',
            fullscreen && zoom && 'scale-[1.6]',
          )}
        />
      ))}

      {/* مؤشر اسحبي */}
      {hint && !interacted && (
        <div className="pointer-events-none absolute inset-x-0 bottom-14 flex justify-center">
          <span className="flex animate-fade-up items-center gap-2 rounded-full bg-ink/60 px-4 py-2 text-xs text-white backdrop-blur">
            <Hand className="h-4 w-4 text-gold-light" />
            اسحبي لمشاهدة الفستان من جميع الجهات
            <span className="font-latin tracking-widest">↔</span>
          </span>
        </div>
      )}

      {/* شارة 360 */}
      <span className="pointer-events-none absolute start-3 top-3 rounded-full bg-ink/55 px-3 py-1 font-latin text-[10px] tracking-[0.25em] text-white backdrop-blur">
        360°
      </span>

      {/* أزرار التحكم */}
      <div className="absolute end-3 top-3 flex flex-col gap-1.5">
        <button
          onClick={() => setFullscreen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/55 text-white backdrop-blur transition-colors hover:bg-gold"
          aria-label="عرض بالحجم الكامل"
        >
          <Expand className="h-4 w-4" />
        </button>
        <button
          onClick={() => setIndex(0)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/55 text-white backdrop-blur transition-colors hover:bg-gold"
          aria-label="إعادة الضبط"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* شريط التحميل */}
      {loadedCount < count && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-ink/10">
          <div className="h-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="relative aspect-[3/4] w-full">
        {!currentLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream">
            <div className="flex flex-col items-center gap-3">
              <div className="skeleton absolute inset-0" />
              <span className="relative font-latin text-xs tracking-[0.3em] text-gold-dark">360° LOADING</span>
            </div>
          </div>
        )}
        {body}
      </div>

      {/* الوضع الكامل */}
      {fullscreen && (
        <div className="fixed inset-0 z-[95] flex flex-col bg-ink/95 backdrop-blur animate-fade-in">
          <div className="flex items-center justify-between p-4">
            <span className="font-latin text-xs tracking-[0.3em] text-gold-light">RENAD · 360° VIEWER</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => !z)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-gold-light"
                aria-label={zoom ? 'تصغير' : 'تكبير'}
              >
                {zoom ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              </button>
              <button
                onClick={() => {
                  setFullscreen(false)
                  setZoom(false)
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-gold-light"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center px-2 pb-6">
            <div className="h-full w-full max-w-3xl">{body}</div>
          </div>
        </div>
      )}
    </>
  )
}
