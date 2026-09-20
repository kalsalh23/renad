import { Hero } from '@/components/home/Hero'
import { CategoriesSection } from '@/components/home/CategoriesSection'
import { FeaturedSection } from '@/components/home/FeaturedSection'
import { AnglesShowcase } from '@/components/home/AnglesShowcase'
import { RentBuySection } from '@/components/home/RentBuySection'
import { WhyRenad, BookingCta } from '@/components/home/WhyRenad'
import { ShowroomSection, InstagramSection } from '@/components/home/ShowroomSection'
import { useDresses, useCategories } from '@/hooks/useData'
import { useSEO } from '@/hooks/useSEO'

export default function HomePage() {
  useSEO({
    title: undefined,
    description:
      'اكتشفي تشكيلة ريناد المختارة من فساتين الأعراس الفاخرة للإيجار والشراء، شاهدي الفستان بتقنية 360° واحجزي موعد تجربتك.',
  })
  const { dresses, loading } = useDresses()
  const { categories, loading: catLoading } = useCategories()

  const featured = dresses.filter((d) => d.is_featured).slice(0, 8)

  return (
    <>
      <Hero />
      <CategoriesSection categories={categories} loading={catLoading} />
      <FeaturedSection dresses={featured} loading={loading} />
      <AnglesShowcase />
      <RentBuySection mode="rent" dresses={dresses} loading={loading} />
      <RentBuySection mode="sale" dresses={dresses} loading={loading} />
      <WhyRenad />
      <ShowroomSection />
      <BookingCta />
      <InstagramSection />
    </>
  )
}
