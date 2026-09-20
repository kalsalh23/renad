import { Link } from 'react-router-dom'
import { useSEO } from '@/hooks/useSEO'

export default function NotFoundPage() {
  useSEO({ title: 'الصفحة غير موجودة' })
  return (
    <div className="container-site flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="heading-display mt-3">هذه الصفحة غير موجودة</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-smoke">
        ربما انتقلت الصفحة أو تغيّر رابطها — تصفحي تشكيلتنا واختاري فستانكِ.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to="/" className="btn-primary">الرئيسية</Link>
        <Link to="/dresses" className="btn-outline">الفساتين</Link>
      </div>
    </div>
  )
}
