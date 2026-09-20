import type { Dress } from './types'

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function fmtPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return `${Number(value).toLocaleString('en-US')}$`
}

export function fmtDateAr(dateStr: string, opts: Intl.DateTimeFormatOptions = {}): string {
  try {
    const d = new Date(`${dateStr}T00:00:00`)
    return new Intl.DateTimeFormat('ar-u-nu-latn', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      ...opts,
    }).format(d)
  } catch {
    return dateStr
  }
}

export function fmtDateTimeAr(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar-u-nu-latn', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/** JS getDay(): الأحد=0 ... السبت=6 → فهرس مصفوفتنا: السبت=0 */
export function weekDayIndex(jsDay: number): number {
  return (jsDay + 1) % 7
}

export interface PriceInfo {
  sale?: number
  rent?: number
  saleOriginal?: number
  discountPercent?: number
}

export function effectivePrices(dress: Dress): PriceInfo {
  const info: PriceInfo = {}
  const discount = dress.discount_percent ?? 0
  if (dress.sale_price != null && (dress.availability === 'sale' || dress.availability === 'both')) {
    info.saleOriginal = dress.sale_price
    info.sale = discount > 0 ? Math.round(dress.sale_price * (1 - discount / 100)) : dress.sale_price
    if (discount > 0) info.discountPercent = discount
  }
  if (dress.rent_price != null && (dress.availability === 'rent' || dress.availability === 'both')) {
    info.rent = dress.rent_price
  }
  return info
}

export function waLink(number: string | null | undefined, text: string): string {
  const digits = (number ?? '').replace(/[^\d]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function slugifyCode(code: string): string {
  return code.trim().toLowerCase().replace(/\s+/g, '-')
}

export function sanitizeFileName(name: string): string {
  const ext = name.split('.').pop() ?? 'jpg'
  const base = name
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w\u0600-\u06FF-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
  return `${base || 'image'}.${ext.toLowerCase()}`
}

export function naturalSortNames(a: string, b: string): number {
  return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })
}

export function timeSlots(
  open?: string,
  close?: string,
  stepMinutes = 30,
): string[] {
  if (!open || !close) return []
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  const start = oh * 60 + om
  const end = ch * 60 + cm
  const slots: string[] = []
  for (let t = start; t <= end - 30; t += stepMinutes) {
    const h = String(Math.floor(t / 60)).padStart(2, '0')
    const m = String(t % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
  }
  return slots
}

export function todayISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function isValidPhone(phone: string): boolean {
  return /^[+\d][\d\s-]{6,17}$/.test(phone.trim())
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'auto' })
}
