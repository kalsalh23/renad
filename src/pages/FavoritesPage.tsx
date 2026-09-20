import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useDresses } from '@/hooks/useData'
import { useFavorites } from '@/context/FavoritesContext'
import { useSEO } from '@/hooks/useSEO'
import { DressGrid } from '@/components/dresses/DressGrid'

export default function FavoritesPage() {
  useSEO({ title: 'المفضلة', description: 'فساتين ريناد التي حفظتِها للعودة إليها لاحقًا.' })
  const { dresses, loading } = useDresses()
  const { ids } = useFavorites()
  const list = dresses.filter((d) => ids.includes(d.id))

  return (
    <div className="container-site pb-20 pt-28 lg:pt-36">
      <div className="mb-10 text-center">
        <p className="eyebrow">WISHLIST</p>
        <h1 className="heading-display mt-2">مفضلتكِ</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-smoke">
          {ids.length
            ? `${list.length} فستان محفوظ — تُحفظ مفضلتكِ على جهازكِ، وإن أنشأتِ حسابًا تُزامَن تلقائيًا.`
            : 'اضغطي على القلب في أي فستان ليُحفظ هنا.'}
        </p>
      </div>
      <DressGrid
        dresses={list}
        loading={loading}
        count={4}
        emptyAction={
          <Link to="/dresses" className="btn-gold mt-2">
            تصفحي الفساتين
          </Link>
        }
      />
    </div>
  )
}
