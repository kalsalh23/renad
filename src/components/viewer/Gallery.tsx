import { useState } from 'react'
import { Expand, Images } from 'lucide-react'
import type { DressImage } from '@/lib/types'
import { Lightbox } from './Lightbox'
import { cn } from '@/lib/utils'

/**
 * معرض صور الفستان: صورة رئيسية + مصغرات + Lightbox مع تكبير
 */
export function Gallery({ images, alt }: { images: DressImage[]; alt: string }) {
  const urls = images.map((i) => i.url)
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!images.length) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center bg-cream text-beige">
        <Images className="h-10 w-10" />
      </div>
    )
  }

  return (
    <div>
      <div className="group relative aspect-[3/4] w-full overflow-hidden bg-cream">
        <img
          key={urls[current]}
          src={urls[current]}
          alt={`${alt} — صورة ${current + 1}`}
          className="h-full w-full animate-fade-in object-cover"
        />
        <button
          onClick={() => setLightboxOpen(true)}
          className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/55 text-white backdrop-blur transition-colors hover:bg-gold"
          aria-label="تكبير الصورة"
        >
          <Expand className="h-4 w-4" />
        </button>
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setCurrent(i)}
              className={cn(
                'relative h-20 w-16 shrink-0 overflow-hidden border transition-all sm:h-24 sm:w-20',
                i === current ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100',
              )}
              aria-label={`صورة ${i + 1}`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <Lightbox
          images={urls}
          index={current}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setCurrent}
          alt={alt}
        />
      )}
    </div>
  )
}
