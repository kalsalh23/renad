import type { AppointmentStatus, Availability, DisplayMode, DressStatus } from './types'

export const BRAND = {
  nameAr: 'ريناد',
  nameEn: 'RENAD',
  tagline: 'إطلالتكِ التي تحلمين بها تبدأ من ريناد',
}

export const NAV_LINKS = [
  { to: '/', label: 'الرئيسية' },
  { to: '/dresses', label: 'الفساتين' },
  { to: '/rent', label: 'الإيجار' },
  { to: '/buy', label: 'الشراء' },
  { to: '/about', label: 'من نحن' },
  { to: '/contact', label: 'تواصل معنا' },
]

export const DRESS_STATUS_META: Record<DressStatus, { label: string; pill: string }> = {
  available: { label: 'متوفر', pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  reserved: { label: 'محجوز', pill: 'bg-amber-50 text-amber-700 border border-amber-200' },
  rented: { label: 'مؤجر', pill: 'bg-sky-50 text-sky-700 border border-sky-200' },
  unavailable: { label: 'غير متوفر', pill: 'bg-stone-100 text-stone-500 border border-stone-200' },
  sold: { label: 'مباع', pill: 'bg-rose-50 text-rose-600 border border-rose-200' },
}

export const APPOINTMENT_STATUS_META: Record<AppointmentStatus, { label: string; pill: string }> = {
  pending: { label: 'بانتظار التأكيد', pill: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed: { label: 'مؤكد', pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  completed: { label: 'مكتمل', pill: 'bg-sky-50 text-sky-700 border border-sky-200' },
  cancelled: { label: 'ملغي', pill: 'bg-rose-50 text-rose-600 border border-rose-200' },
  rescheduled: { label: 'مُعدّل الموعد', pill: 'bg-indigo-50 text-indigo-600 border border-indigo-200' },
}

export const AVAILABILITY_META: Record<Availability, string> = {
  sale: 'للبيع فقط',
  rent: 'للإيجار فقط',
  both: 'للإيجار والشراء',
}

export const DISPLAY_MODE_META: Record<DisplayMode, string> = {
  images: 'صور فقط',
  '360': 'عرض 360° فقط',
  both: 'صور + 360°',
}

export const WEEK_DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

export const MONTHS_AR = [
  'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول',
]

export const BOOKABLE_STATUSES: DressStatus[] = ['available', 'reserved']

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE_MB = 8
export const MIN_FRAMES_FOR_360 = 8
