import { Instagram } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { useReveal } from '@/hooks/useReveal'
import { SectionHeading } from '@/components/ui/Common'

/** صور المعرض + شريط انستغرام */
export function ShowroomSection() {
  const { settings } = useSettings()
  const ref = useReveal<HTMLElement>()
  const images = settings.showroom_images ?? []

  if (!images.length) return null

  return (
    <section ref={ref} className="container-site py-16 lg:py-24">
      <SectionHeading
        eyebrow="THE ATELIER"
        title="جولة داخل معرض ريناد"
        subtitle="أجواء صالة العرض التي ستحين لحظتكِ فيها — رفاهية وخصوصية واهتمام بكل التفاصيل."
      />
      <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {images.slice(0, 6).map((src, i) => (
          <div
            key={src}
            className={`group overflow-hidden bg-cream ${i === 0 ? 'col-span-2 aspect-[2/1] lg:col-span-1 lg:aspect-[4/5]' : 'aspect-[4/5]'} ${i === 1 ? 'lg:col-span-2 lg:aspect-[2.08/1]' : ''}`}
          >
            <img
              src={src}
              alt={`صورة من معرض ريناد ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-[1.06]"
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export function InstagramSection() {
  const { settings } = useSettings()
  const ref = useReveal<HTMLElement>()
  const images = (settings.showroom_images ?? []).slice(0, 6)

  if (!settings.instagram_url && !images.length) return null

  return (
    <section ref={ref} className="container-site py-16 lg:py-20">
      <SectionHeading
        eyebrow="FOLLOW US"
        title="تابعينا على انستغرام"
        subtitle={settings.instagram_handle ? `@${settings.instagram_handle.replace('@', '')}` : 'إطلالات ولمسات يومية من عالم ريناد'}
      />
      <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
        {images.map((src) => (
          <a
            key={src}
            href={settings.instagram_url ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="group relative aspect-square overflow-hidden bg-cream"
            aria-label="انستغرام ريناد"
          >
            <img src={src} alt="منشور انستغرام ريناد" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <span className="absolute inset-0 flex items-center justify-center bg-ink/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Instagram className="h-6 w-6 text-white" />
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
